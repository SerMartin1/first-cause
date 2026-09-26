import {
  isDepositKnownToWorld,
  type Company,
  type Inventory,
  type ResourceDeposit,
} from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { assertNonNegative, InvariantViolationError } from "../../core/validation.js";
import { offsetCausalLinks, type PendingCausalLink } from "../../core/causal-links.js";
import { extractFromDeposit } from "../resources/extraction.js";
import { usableDepositQuantity } from "../resources/deposit-lifecycle.js";
import { addToInventory, removeFromInventory } from "./inventory.js";
import { applyProductionToCompany } from "./companies.js";

/**
 * CE-04 (M17, Causality Engine Spec SS63): jaki rodzaj wejścia faktycznie
 * ograniczył `batches` tego ticka -- `CAPACITY` to własny, zadeklarowany
 * sufit firmy (nie jest interesującym przyczynowo ograniczeniem sam z
 * siebie); resztę to realne, zewnętrzne limity warte ujawnienia
 * (`production_bottleneck_identified`, poniżej). `ENERGY`/`TRANSPORT`
 * nie są jeszcze modelowane jako własne wejścia (brak systemu energii,
 * brak per-firmowego kosztu transportu w tej funkcji) -- wymienione
 * tutaj, żeby przyszły system rozszerzający ten bag nigdy nie musiał
 * wymyślać nowego słownictwa, zgodnie z pełną 6-elementową taksonomią
 * §63.
 */
export type ProductionConstraintType =
  | "CAPACITY"
  | "LABOR"
  | "INPUT"
  | "DEMAND"
  | "ENERGY"
  | "TRANSPORT";

/** Nazwane inaczej niż `company-ai/production-decision.ts`'s własne (prostsze, 3-wartościowe) `ProductionBottleneck` -- to jest CE-04's bogatszy, przyczynowy odpowiednik, nie ten sam koncept. */
export interface ProductionConstraint {
  readonly type: ProductionConstraintType;
  /** Który konkretny resource/good id był wiążący, dla ograniczenia `INPUT` -- `"capacity"`/`"employees"` dla dwóch pozostałych kandydatów, które ta funkcja faktycznie liczy. */
  readonly variable: string;
  readonly batches: number;
}

/**
 * Production (Simulation Model, Production-Economy-Master SS11, ECO-007
 * "rozwój przez Production Methods, nie płaskie wyjątki technologiczne"):
 * jedna firma awansuje o dokładnie jeden tick, produkując tyle "batchy"
 * swojej Production Method, na ile pozwalają jednocześnie: przydzielona
 * capacity/utilization, dostępność zasobów (M5 `ResourceDeposit`, przez
 * `extractFromDeposit` -- ta sama fizyczna zasada "wydobycie nie może
 * stworzyć zasobu") i dostępność dóbr pośrednich we własnym Inventory
 * (M3 `Inventory`, DATA-005).
 *
 * `ProductionRecipe` -- podobnie jak `DemographyRates` w M6 -- to
 * osobny, prosty typ warstwy symulacji, nie część schematu contentu:
 * `ProductionMethodDefinitionSchema.inputs/outputs/resourceRequirements`
 * (M2) to tylko topologia grafu (które dobra/zasoby są zaangażowane, do
 * walidacji referencji i cykli); *ile* dokładnie zużywa/produkuje jeden
 * batch to "productivity" -- pole jawnie oznaczone w M2 jako "open
 * placeholder bag owned by Production (M7)" -- i tu właśnie M7 nadaje
 * mu konkretny kształt, bez zmiany schematu M2.
 *
 * Ile batchy odpowiada jednej jednostce `capacity` oraz jaką część
 * `capacity` firma faktycznie wykorzystuje (`utilization`) to decyzje
 * poza zakresem M7 (AI produkcyjne to M11) -- `runProduction` przyjmuje
 * je jako gotowy stan `Company.production`, nigdy ich nie oblicza.
 */
export interface ProductionRecipe {
  readonly productionMethodId: string;
  /**
   * Ilu zatrudnionych (`Company.workforce.employees`) wymaga jeden batch --
   * audytowe P0-02: bez tego pola `computeBatches` liczyła produkcję
   * wyłącznie z `capacity*utilization` i dostępności zasobów/dóbr, więc
   * firma z `employees === 0` nadal produkowała. Ten sam wzorzec ograniczenia
   * co `resourceInputsPerBatch`/`goodInputsPerBatch` -- `0` oznacza "ten
   * przepis nie wymaga pracy" (np. w pełni zautomatyzowana linia), nie
   * "praca jest nieograniczona".
   */
  readonly employeesPerBatch: number;
  /** Resource id -> ilość zużywana na jeden batch, wydobywana na żywo z `ResourceDeposit` (M5). */
  readonly resourceInputsPerBatch: Readonly<Record<string, number>>;
  /** Good id -> ilość zużywana z własnego Inventory firmy na jeden batch. */
  readonly goodInputsPerBatch: Readonly<Record<string, number>>;
  /** Good id -> ilość dodawana do własnego Inventory firmy na jeden batch. */
  readonly goodOutputsPerBatch: Readonly<Record<string, number>>;
  /**
   * `CompanyArchetype` id-y, które w ogóle mogą prowadzić tę Production
   * Method -- to `ProductionMethodDefinition.companyArchetypeIds` (M2),
   * NIE część "productivity" bagu (w przeciwieństwie do pól powyżej): to
   * już ustrukturyzowane, referencyjne pole M2, `ProductionRecipe` tylko
   * niesie je dalej pod tym samym kluczem (`productionMethodId`), bo to
   * jedyny per-recepturowy lookup, przez który przechodzi cały silnik
   * (`DEFAULT_PRODUCTION_RECIPES`/`productionRecipesByMethodId`). Pusta
   * tablica = brak ograniczenia. Audytowe P1 "PM adoption bez hard
   * eligibility" -- `company-ai/pm-adoption.ts` to jedyny dziś konsument.
   */
  readonly eligibleCompanyArchetypeIds: readonly string[];
}

export interface RunProductionInput {
  readonly tick: number;
  readonly company: Company;
  readonly inventory: Inventory;
  readonly recipe: ProductionRecipe;
  /** Depozyty, po jednym na każdy resource id z `recipe.resourceInputsPerBatch`. */
  readonly resourceDeposits: Readonly<Record<string, ResourceDeposit>>;
}

export interface RunProductionResult {
  readonly company: Company;
  readonly inventory: Inventory;
  readonly resourceDeposits: Readonly<Record<string, ResourceDeposit>>;
  readonly batches: number;
  readonly facts: readonly FactInput<number>[];
  /** M17 (CE-04): `targetIndex`/`sameBatch.index` są względne do WŁASNEJ tablicy `facts` tego wyniku -- patrz `offsetCausalLinks` w `causal-links.ts`. */
  readonly causalLinks: readonly PendingCausalLink[];
}

/**
 * Domyślne przepisy dla `content/productionMethods/*.json` (M7): ilość
 * na batch to "productivity" -- tuning parameter w tym samym sensie co
 * `DEFAULT_DEMOGRAPHY_RATES.birthRate` w M6, nie liczba wyprowadzona z
 * jakiejś fizycznej stałej. Straty przy przetwarzaniu (10 zboża -> 8
 * mąki, 5 mąki -> 4 chleba) są celowe -- pokazują, że silnik radzi sobie
 * z dowolnym wymiernym stosunkiem, nie tylko trywialnym 1:1.
 */
export const DEFAULT_PRODUCTION_RECIPES: Readonly<Record<string, ProductionRecipe>> = {
  manual_farming: {
    productionMethodId: "manual_farming",
    // 1:1 z EMPLOYEES_PER_CAPACITY_UNIT (economy-tick.ts): jeden batch tej
    // capacity-jednostki odpowiada dokładnie jednemu zatrudnionemu.
    employeesPerBatch: 1,
    resourceInputsPerBatch: { grain: 10 },
    goodInputsPerBatch: {},
    goodOutputsPerBatch: { flour: 8 },
    eligibleCompanyArchetypeIds: ["grain_farm"],
  },
  manual_food_processing: {
    productionMethodId: "manual_food_processing",
    employeesPerBatch: 1,
    resourceInputsPerBatch: {},
    goodInputsPerBatch: { flour: 5 },
    goodOutputsPerBatch: { bread: 4 },
    eligibleCompanyArchetypeIds: ["bakery"],
  },
};

function parseNonNegativeNumber(value: unknown, label: string): number {
  if (typeof value !== "number") {
    throw new InvariantViolationError(
      `${label} must be a number, got ${value === null ? "null" : typeof value}`,
    );
  }
  return assertNonNegative(value, label);
}

function parseQuantityRecord(
  value: unknown,
  label: string,
): Readonly<Record<string, number>> {
  if (value === undefined) return {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvariantViolationError(
      `${label} must be an object, got ${value === null ? "null" : typeof value}`,
    );
  }
  const result: Record<string, number> = {};
  for (const [key, quantity] of Object.entries(value)) {
    result[key] = parseNonNegativeNumber(quantity, `${label}.${key}`);
  }
  return result;
}

/**
 * Audytowe P0-06: `ProductionMethodDefinition.productivity` (M2
 * `OpenRecordSchema` -- "exact shape belongs to the system milestone that
 * consumes it", `@first-cause/content` `common.ts`) parsowane na konkretny,
 * walidowany `ProductionRecipe` -- ten sam fail-loud styl co
 * `computeBatches` już stosuje wobec zasobów/dóbr, teraz też wobec
 * *pochodzenia* przepisu (content/productionMethods/*.json), nie tylko
 * jego użycia. Przyjmuje surowy bag (`Record<string, unknown>`), nie typ
 * `ProductionMethodDefinition` z `@first-cause/content` -- M7 (Simulation
 * Core) celowo nie zależy od pakietu content, tylko od kształtu jednego
 * pola, które i tak dostaje z zewnątrz (caller w `worldgen` już przeszedł
 * przez `loadContentPack`, więc `id`/referencje są tam już zwalidowane).
 *
 * `companyArchetypeIds` to osobny parametr, nie pole `productivity` --
 * to już ustrukturyzowane `ProductionMethodDefinition.companyArchetypeIds`
 * (M2), caller (`worldgen`) przekazuje je wprost z definicji, bez
 * przechodzenia przez ten sam bag co ilości na batch.
 */
export function parseProductionRecipe(
  productionMethodId: string,
  productivity: Readonly<Record<string, unknown>>,
  companyArchetypeIds: readonly string[] = [],
): ProductionRecipe {
  const label = `productionMethods/${productionMethodId}.productivity`;
  return {
    productionMethodId,
    employeesPerBatch: parseNonNegativeNumber(
      productivity.employeesPerBatch,
      `${label}.employeesPerBatch`,
    ),
    resourceInputsPerBatch: parseQuantityRecord(
      productivity.resourceInputsPerBatch,
      `${label}.resourceInputsPerBatch`,
    ),
    goodInputsPerBatch: parseQuantityRecord(
      productivity.goodInputsPerBatch,
      `${label}.goodInputsPerBatch`,
    ),
    goodOutputsPerBatch: parseQuantityRecord(
      productivity.goodOutputsPerBatch,
      `${label}.goodOutputsPerBatch`,
    ),
    eligibleCompanyArchetypeIds: companyArchetypeIds,
  };
}

function maxBatchesFor(available: number, quantityPerBatch: number): number {
  if (quantityPerBatch <= 0) return Number.POSITIVE_INFINITY;
  return Math.floor(available / quantityPerBatch);
}

/** Ile batchy da się uruchomić w tym ticku: minimum z capacity i każdego ograniczenia wejściowego. */
function computeBatches(input: RunProductionInput): number {
  const { company, recipe } = input;
  assertNonNegative(company.production.capacity, "Company.production.capacity");
  assertNonNegative(company.production.utilization, "Company.production.utilization");

  let batches = Math.floor(company.production.capacity * company.production.utilization);

  // Audytowe P0-02: praca to twarde ograniczenie wejściowe, tak samo jak
  // zasób czy dobro pośrednie -- `employees === 0` (nowo założona firma
  // przed pierwszym zatrudnieniem, albo firma po zwolnieniu wszystkich)
  // musi dać 0 batchy, niezależnie od tego, ile capacity/utilization
  // deklaruje.
  assertNonNegative(
    recipe.employeesPerBatch,
    `ProductionRecipe(${recipe.productionMethodId}).employeesPerBatch`,
  );
  if (recipe.employeesPerBatch > 0) {
    batches = Math.min(
      batches,
      maxBatchesFor(company.workforce.employees, recipe.employeesPerBatch),
    );
  }

  for (const [resourceId, quantityPerBatch] of Object.entries(
    recipe.resourceInputsPerBatch,
  )) {
    assertNonNegative(
      quantityPerBatch,
      `ProductionRecipe(${recipe.productionMethodId}).resourceInputsPerBatch.${resourceId}`,
    );
    if (quantityPerBatch === 0) continue;

    // Brak depozytu w ogóle (nie: depozyt istnieje i jest pusty) to
    // pomyłka wywołującego -- zapomniał podłączyć zasób, który przepis
    // wymaga -- więc zgłaszamy to głośno, zamiast po cichu policzyć 0
    // batchy tak, jakby to był legalny stan wyczerpanego złoża.
    const deposit = input.resourceDeposits[resourceId];
    if (!deposit) {
      throw new InvariantViolationError(
        `runProduction(${recipe.productionMethodId}): requires resource "${resourceId}" but no matching deposit was provided`,
      );
    }
    // D2 (TECH-010): złoże nieznane światu daje 0 batchy -- jego stock nie jest czytany.
    batches = Math.min(
      batches,
      maxBatchesFor(usableDepositQuantity(deposit), quantityPerBatch),
    );
  }

  for (const [goodId, quantityPerBatch] of Object.entries(recipe.goodInputsPerBatch)) {
    assertNonNegative(
      quantityPerBatch,
      `ProductionRecipe(${recipe.productionMethodId}).goodInputsPerBatch.${goodId}`,
    );
    const available = input.inventory.items[goodId]?.quantity ?? 0;
    batches = Math.min(batches, maxBatchesFor(available, quantityPerBatch));
  }

  return Math.max(0, batches);
}

/**
 * Te same kandydujące limity, z których `computeBatches` już bierze
 * minimum, ale zachowane jako pojedynczo oznaczone liczby, nie
 * scalone -- deterministyczny tie-break: iteruje resource/good id w
 * sortowanej kolejności, pierwszy (najmniejszy) kandydat wygrywa,
 * `CAPACITY` zawsze liczone pierwsze, więc realny remis z capacity
 * faworyzuje bardziej informacyjną (nie-capacity) etykietę, tak samo
 * jak ta funkcja już listuje kandydatów w porządku priorytetu.
 */
function identifyProductionConstraint(input: RunProductionInput): ProductionConstraint {
  const { company, recipe } = input;
  const candidates: ProductionConstraint[] = [
    {
      type: "CAPACITY",
      variable: "capacity",
      batches: Math.floor(company.production.capacity * company.production.utilization),
    },
  ];
  if (recipe.employeesPerBatch > 0) {
    candidates.push({
      type: "LABOR",
      variable: "employees",
      batches: maxBatchesFor(company.workforce.employees, recipe.employeesPerBatch),
    });
  }
  for (const resourceId of Object.keys(recipe.resourceInputsPerBatch).sort()) {
    const quantityPerBatch = recipe.resourceInputsPerBatch[resourceId]!;
    if (quantityPerBatch === 0) continue;
    const available = usableDepositQuantity(input.resourceDeposits[resourceId]);
    candidates.push({
      type: "INPUT",
      variable: resourceId,
      batches: maxBatchesFor(available, quantityPerBatch),
    });
  }
  for (const goodId of Object.keys(recipe.goodInputsPerBatch).sort()) {
    const quantityPerBatch = recipe.goodInputsPerBatch[goodId]!;
    if (quantityPerBatch === 0) continue;
    const available = input.inventory.items[goodId]?.quantity ?? 0;
    candidates.push({
      type: "INPUT",
      variable: goodId,
      batches: maxBatchesFor(available, quantityPerBatch),
    });
  }

  let binding = candidates[0]!;
  for (const candidate of candidates.slice(1)) {
    if (candidate.batches < binding.batches) binding = candidate;
  }
  return binding;
}

export function runProduction(input: RunProductionInput): RunProductionResult {
  const { company, recipe } = input;
  const batches = computeBatches(input);

  let inventory = input.inventory;
  const resourceDeposits: Record<string, ResourceDeposit> = { ...input.resourceDeposits };
  const facts: FactInput<number>[] = [];
  const causalLinks: PendingCausalLink[] = [];
  const inputRequirements: Record<string, number> = {};

  // CE-04 (M17): ujawnij to tylko wtedy, gdy coś INNEGO niż własny,
  // zadeklarowany sufit capacity/utilization firmy faktycznie
  // ograniczyło output -- firma po prostu ograniczona własnym capacity
  // z definicji nie jest przyczynowo interesującym bottleneckiem; firma,
  // która CHCE działać na capacity, ale nie może (niedobór pracy/
  // zasobu/dobra), jest dokładnie tym sygnałem, którego potrzebuje
  // Resource Bust (CE-12 Test 10) i podobne łańcuchy.
  const capacityBatches = Math.floor(
    company.production.capacity * company.production.utilization,
  );
  const bottleneck = identifyProductionConstraint(input);
  if (bottleneck.type !== "CAPACITY" && bottleneck.batches < capacityBatches) {
    facts.push({
      type: "production_bottleneck_identified",
      subject: { entityType: "company", entityId: company.id },
      location: { regionId: company.regionId },
      values: {
        before: capacityBatches,
        after: bottleneck.batches,
        delta: bottleneck.batches - capacityBatches,
      },
    });
    causalLinks.push({
      targetIndex: facts.length - 1,
      source: { kind: "external", key: `${bottleneck.type.toLowerCase()}:${bottleneck.variable}` },
      type: "CONSTRAINING",
      factor: { key: bottleneck.variable, contribution: -1 },
      mechanism: `${bottleneck.type} (${bottleneck.variable}) limited production to ${bottleneck.batches} batches, below the ${capacityBatches}-batch capacity ceiling`,
      system: "production",
    });
  }

  for (const [resourceId, quantityPerBatch] of Object.entries(
    recipe.resourceInputsPerBatch,
  )) {
    const amount = quantityPerBatch * batches;
    if (amount <= 0) continue;

    // computeBatches już zgłosiłoby błąd, gdyby tego depozytu brakowało
    // przy dodatnim amount -- tu jest on zagwarantowany.
    const deposit = resourceDeposits[resourceId]!;
    // D2: twarda bramka -- gospodarcze wydobycie ze złoża nieznanego światu
    // jest naruszeniem inwariantu, nie cichym odkryciem (wariant C odrzucony).
    if (!isDepositKnownToWorld(deposit)) {
      throw new InvariantViolationError(
        `runProduction(${recipe.productionMethodId}): deposit "${deposit.id}" is not known to the world (${deposit.discovery.status})`,
      );
    }
    const extraction = extractFromDeposit(deposit, { tick: input.tick, amount });
    resourceDeposits[resourceId] = extraction.deposit;
    {
      const baseIndex = facts.length;
      facts.push(...extraction.facts);
      causalLinks.push(...offsetCausalLinks(extraction.causalLinks, baseIndex));
    }
    inputRequirements[resourceId] =
      (inputRequirements[resourceId] ?? 0) + extraction.extracted;
  }

  for (const [goodId, quantityPerBatch] of Object.entries(recipe.goodInputsPerBatch)) {
    const amount = quantityPerBatch * batches;
    if (amount <= 0) continue;

    const removal = removeFromInventory(inventory, goodId, amount);
    inventory = removal.inventory;
    if (removal.fact) facts.push(removal.fact);
    inputRequirements[goodId] = (inputRequirements[goodId] ?? 0) + amount;
  }

  let outputQuantity = 0;
  for (const [goodId, quantityPerBatch] of Object.entries(recipe.goodOutputsPerBatch)) {
    const amount = quantityPerBatch * batches;
    if (amount <= 0) continue;

    const addition = addToInventory(inventory, goodId, amount);
    inventory = addition.inventory;
    if (addition.fact) facts.push(addition.fact);
    outputQuantity += amount;
  }

  const nextCompany = applyProductionToCompany({
    company,
    productionMethodId: recipe.productionMethodId,
    outputQuantity,
    inputRequirements,
  });

  return { company: nextCompany, inventory, resourceDeposits, batches, facts, causalLinks };
}
