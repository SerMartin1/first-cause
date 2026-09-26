import type {
  Climate,
  ElevationClass,
  ResourceDeposit,
  SettlementStage,
  Terrain,
  WorldState,
} from "@first-cause/entities";
import { fnv1a32 } from "../core/hash.js";

/**
 * RegionVisualProfileReadModel v2 (M21-VIS-R2; Living Atlas Visual Asset
 * Spec v1.3 §28.1, §28.6; Canonical Decisions `UI-015`). Pipeline:
 * `SIMULATION STATE -> READ MODEL / VISUAL PROFILE -> VISUAL GRAMMAR ->
 * LIVING ATLAS` (Atlas Spec §27.1). Ten moduł to pierwsza strzałka --
 * gramatyka wizualna (`apps/desktop/.../atlas-grammar.ts`) i renderery
 * (`FCLivingAtlas`, `FCRegionVignette`) tylko czytają profil.
 *
 * v1 opisywał region jedną wartością `industry` („pierwszy pasujący
 * sektor”) i wywodził kolej z samego `infrastructure.level` (audyt
 * 2026-09-26 B1, M6). v2:
 *
 * - `industry[]`  -- wszystkie sektory aktywne (i zamknięte) w regionie,
 *   każdy ze skalą i stanem; region nie jest „jedną ikoną przemysłu”,
 * - `extraction[]` -- eksploatowane złoża (osobna kategoria niż zasób),
 * - `resources[]` -- ZNANE złoża (DISCOVERED/ASSESSED); złoże może istnieć
 *   bez wydobycia,
 * - infrastruktura należy do POŁĄCZENIA (`buildConnectionVisualProfile`),
 *   nie do regionu; `transport` regionu to tylko skrót dla winiety.
 *
 * Każde pole wynika z `WorldState` / contentu („NO DECORATION WITHOUT
 * INFORMATION”, VIS-09). Brak danych = `undefined`, nigdy domysł; „brak
 * danych” ≠ „zero” (np. `industry === undefined` gdy nie podano mapy
 * sektorów, `[]` gdy sektory są znane, a firm brak). Moduł jest czysty:
 * nie mutuje stanu, nie używa RNG, nie zależy od locale.
 */
export type RegionVisualTerrain = Terrain;
export type RegionVisualWater = "coast" | "river" | "none";
export type RegionVisualVegetation =
  "dense_forest" | "sparse_forest" | "grassland" | "fields" | "none";
export type RegionVisualFertility = "fertile" | "moderate" | "poor";
export type RegionVisualSettlementStage = Exclude<SettlementStage, "CAMP">;
/** Skrót najbardziej rozwiniętej trasy lądowej regionu (tylko dla winiety; Atlas rysuje trasy na krawędziach). */
export type RegionVisualTransport = "trail" | "road" | "railway" | "highway";

/** Atlas Spec §4A.5 / §10.4 -- tylko stany, które dziś wynikają z danych `Company.status` / produkcji. */
export type RegionVisualActivityState = "active" | "idle" | "stressed" | "closed";
/** Atlas Spec §10.3 -- wspólna hierarchia skali przemysłu. */
export type RegionVisualIndustryScale =
  "workshop" | "manufactory" | "factory" | "large_plant" | "industrial_complex";
/** Atlas Spec §9.3 -- podzbiór stanów wydobycia wynikający z `ResourceDeposit` (Prospected = `resources[]`). */
export type RegionVisualExtractionState = "active" | "idle" | "depleted";

export interface RegionVisualIndustry {
  /** Sektor archetypu firmy z contentu (`CompanyArchetypeDefinition.sector`) -- tożsamość rodziny wizualnej. */
  readonly sector: string;
  readonly activeCompanies: number;
  readonly closedCompanies: number;
  /** Suma z aktywnych firm sektora. */
  readonly employees: number;
  readonly capacity: number;
  readonly outputLastTick: number;
  /** `undefined`, gdy w sektorze nie ma już aktywnej firmy (skala zamkniętego zakładu nie jest znana). */
  readonly scale: RegionVisualIndustryScale | undefined;
  readonly state: RegionVisualActivityState;
}

export interface RegionVisualExtraction {
  readonly depositId: string;
  readonly resourceDefinitionId: string;
  /** Rodzina wizualna z contentu (`ResourceDefinition.extractionFamily`); `undefined` = nieokreślona. */
  readonly family: string | undefined;
  readonly renewable: boolean;
  readonly state: RegionVisualExtractionState;
  /** `ResourceDeposit.extraction.currentExtraction` (tempo w ostatnim ticku). */
  readonly rate: number;
  readonly cumulative: number;
  /** Tylko złoża nieodnawialne: `stock.quantity / stock.initialQuantity`. */
  readonly reserveRatio: number | undefined;
}

export interface RegionVisualResource {
  readonly resourceDefinitionId: string;
  readonly renewable: boolean;
  readonly deposits: number;
  /** Czy którekolwiek znane złoże tego zasobu jest (lub było) eksploatowane -- wtedy mówi o nim `extraction[]`. */
  readonly extracted: boolean;
}

export interface RegionVisualProfile {
  readonly regionId: string;
  readonly terrain: RegionVisualTerrain;
  readonly climate: Climate;
  readonly elevationClass: ElevationClass;
  readonly fertility: RegionVisualFertility;
  readonly water: RegionVisualWater;
  readonly vegetation: RegionVisualVegetation;
  /** `undefined`: brak settlementu, albo największy settlement jest wciąż CAMP-em. */
  readonly settlement: RegionVisualSettlementStage | undefined;
  /**
   * Wszystkie sektory gospodarcze regionu (sort: aktywne przed zamkniętymi,
   * zatrudnienie malejąco, sektor rosnąco). `undefined` = brak danych
   * (nie podano `sectorByCompanyArchetypeId`); `[]` = brak firm o znanym sektorze.
   */
  readonly industry: readonly RegionVisualIndustry[] | undefined;
  /** Eksploatowane (obecnie lub w przeszłości) ZNANE złoża. Złoża UNKNOWN/SUSPECTED nigdy tu nie trafiają (TECH-009). */
  readonly extraction: readonly RegionVisualExtraction[];
  /** Znane (DISCOVERED/ASSESSED), niewyczerpane złoża, per zasób. */
  readonly resources: readonly RegionVisualResource[];
  /** Skrót dla winiety, wywiedziony z rodzin tras połączeń regionu; `undefined` gdy brak klasyfikowanej trasy. */
  readonly transport: RegionVisualTransport | undefined;
  /** Zawsze `undefined` na razie -- nie istnieje jeszcze system energii. */
  readonly energy: undefined;
  /** Dominujący znany, niewyczerpany zasób (liczbą złóż); `undefined` bez jednoznacznej dominacji. */
  readonly landmarkResourceDefinitionId: string | undefined;
  /** `hash(worldSeed + regionId + visualState)` -- deterministyczny selektor wariantu, nigdy `Math.random()`. */
  readonly vignetteSeed: number;
}

export interface ConnectionVisualRoute {
  /** Rodzina wizualna z contentu (`TransportModeDefinition.routeFamily`); `undefined` = nieklasyfikowana. */
  readonly family: string | undefined;
  readonly transportModeIds: readonly string[];
}

/** Infrastruktura per połączenie (Atlas Spec v1.3 §28.6) -- rysowana NA KRAWĘDZI, nie pod osadą. */
export interface ConnectionVisualProfile {
  readonly connectionId: string;
  readonly regionAId: string;
  readonly regionBId: string;
  readonly level: number;
  /** Jedna pozycja na rodzinę trasy (sort: rodzina rosnąco, nieklasyfikowana na końcu). `[]` = brak infrastruktury transportowej. */
  readonly routes: readonly ConnectionVisualRoute[];
  readonly capacity: number;
  readonly utilization: number;
  readonly congestion: number;
  readonly disrupted: boolean;
}

export interface BuildRegionVisualProfileOptions {
  /**
   * `companyArchetypeId -> sector` (content, `LoadEconomyContentResult.
   * sectorByCompanyArchetypeId`). `packages/simulation` nigdy nie czyta
   * contentu samodzielnie (AGENTS.md reguła 6).
   */
  readonly sectorByCompanyArchetypeId?: Readonly<Record<string, string>>;
  /** `resourceId -> extractionFamily` (content, `LoadEconomyContentResult.extractionFamilyByResourceId`). */
  readonly extractionFamilyByResourceId?: Readonly<Record<string, string>>;
  /** `transportModeId -> routeFamily` (content, `LoadEconomyContentResult.routeFamilyByTransportModeId`). */
  readonly routeFamilyByTransportModeId?: Readonly<Record<string, string>>;
}

const SETTLEMENT_STAGE_RANK: Readonly<Record<SettlementStage, number>> = {
  CAMP: 0,
  HAMLET: 1,
  VILLAGE: 2,
  TOWN: 3,
  CITY: 4,
  METROPOLIS: 5,
};

const AGRICULTURE_SECTORS: ReadonlySet<string> = new Set(["agriculture"]);

/** TODO tuning (AGENTS.md): progi poniżej to konfigurowalne placeholdery, nie wartości z kanonu. */
const FOREST_SPARSE_PRESSURE_THRESHOLD = 0.5;
const GRASSLAND_FERTILITY_THRESHOLD = 0.4;
const FERTILE_THRESHOLD = 0.6;
const POOR_THRESHOLD = 0.25;
/** TODO tuning: zatrudnienie sektora -> klasa skali §10.3 (górne granice, wyłączne). */
const INDUSTRY_SCALE_EMPLOYEE_THRESHOLDS: readonly [RegionVisualIndustryScale, number][] =
  [
    ["workshop", 10],
    ["manufactory", 50],
    ["factory", 250],
    ["large_plant", 1000],
  ];

/** Kolejność rodzin tras lądowych dla skrótu winiety; rodziny wodne nie są trasą lądową. */
const LAND_ROUTE_TRANSPORT: Readonly<Record<string, RegionVisualTransport>> = {
  path: "trail",
  road: "road",
  rail: "railway",
};
const TRANSPORT_RANK: Readonly<Record<RegionVisualTransport, number>> = {
  trail: 1,
  road: 2,
  railway: 3,
  highway: 4,
};

function isRevealed(deposit: ResourceDeposit): boolean {
  return (
    deposit.discovery.status === "DISCOVERED" || deposit.discovery.status === "ASSESSED"
  );
}

function deriveWater(
  geography: WorldState["regions"][string]["geography"],
): RegionVisualWater {
  if (geography.coastal) return "coast";
  if (geography.waterAccess) return "river";
  return "none";
}

function deriveFertility(fertility: number): RegionVisualFertility {
  if (fertility >= FERTILE_THRESHOLD) return "fertile";
  if (fertility < POOR_THRESHOLD) return "poor";
  return "moderate";
}

function deriveVegetation(
  region: WorldState["regions"][string],
  activeSectors: readonly string[],
): RegionVisualVegetation {
  if (region.geography.terrain === "forest") {
    return region.environment.forestPressure > FOREST_SPARSE_PRESSURE_THRESHOLD
      ? "sparse_forest"
      : "dense_forest";
  }
  if (activeSectors.some((sector) => AGRICULTURE_SECTORS.has(sector))) return "fields";
  if (region.geography.fertility >= GRASSLAND_FERTILITY_THRESHOLD) return "grassland";
  return "none";
}

function deriveSettlement(
  state: WorldState,
  region: WorldState["regions"][string],
): RegionVisualSettlementStage | undefined {
  const settlements = region.settlements.settlementIds
    .map((id) => state.settlements[id])
    .filter((settlement) => settlement !== undefined);
  const stage = settlements.reduce<SettlementStage | undefined>(
    (largest, settlement) =>
      !largest || SETTLEMENT_STAGE_RANK[settlement.stage] > SETTLEMENT_STAGE_RANK[largest]
        ? settlement.stage
        : largest,
    undefined,
  );
  return stage && stage !== "CAMP" ? stage : undefined;
}

function industryScale(employees: number): RegionVisualIndustryScale {
  for (const [scale, below] of INDUSTRY_SCALE_EMPLOYEE_THRESHOLDS)
    if (employees < below) return scale;
  return "industrial_complex";
}

function deriveIndustry(
  state: WorldState,
  region: WorldState["regions"][string],
  sectorByArchetypeId: Readonly<Record<string, string>> | undefined,
): readonly RegionVisualIndustry[] | undefined {
  if (!sectorByArchetypeId) return undefined;
  const bySector = new Map<
    string,
    {
      active: number;
      closed: number;
      distressed: number;
      employees: number;
      capacity: number;
      output: number;
    }
  >();
  for (const companyId of region.economy.companyIds) {
    const company = state.companies[companyId];
    if (!company) continue;
    const sector = sectorByArchetypeId[company.archetypeId];
    if (sector === undefined) continue;
    const entry = bySector.get(sector) ?? {
      active: 0,
      closed: 0,
      distressed: 0,
      employees: 0,
      capacity: 0,
      output: 0,
    };
    if (company.status.active) {
      entry.active += 1;
      if (company.status.distressed) entry.distressed += 1;
      entry.employees += company.workforce.employees;
      entry.capacity += company.production.capacity;
      entry.output += company.production.outputLastTick;
    } else entry.closed += 1;
    bySector.set(sector, entry);
  }
  return [...bySector.entries()]
    .map(([sector, e]): RegionVisualIndustry => ({
      sector,
      activeCompanies: e.active,
      closedCompanies: e.closed,
      employees: e.employees,
      capacity: e.capacity,
      outputLastTick: e.output,
      scale: e.active > 0 ? industryScale(e.employees) : undefined,
      state:
        e.active === 0
          ? "closed"
          : e.distressed > 0
            ? "stressed"
            : e.output > 0
              ? "active"
              : "idle",
    }))
    .sort(
      (a, b) =>
        Number(b.activeCompanies > 0) - Number(a.activeCompanies > 0) ||
        b.employees - a.employees ||
        a.sector.localeCompare(b.sector),
    );
}

function knownDeposits(
  state: WorldState,
  region: WorldState["regions"][string],
): ResourceDeposit[] {
  return [...region.resources.depositIds]
    .sort()
    .map((id) => state.resourceDeposits[id])
    .filter((deposit): deposit is ResourceDeposit => !!deposit && isRevealed(deposit));
}

function deriveExtraction(
  deposits: readonly ResourceDeposit[],
  familyByResourceId: Readonly<Record<string, string>>,
): readonly RegionVisualExtraction[] {
  return deposits
    .filter(
      (d) => d.extraction.currentExtraction > 0 || d.extraction.cumulativeExtraction > 0,
    )
    .map((d): RegionVisualExtraction => ({
      depositId: d.id,
      resourceDefinitionId: d.resourceDefinitionId,
      family: familyByResourceId[d.resourceDefinitionId],
      renewable: d.renewable,
      state:
        d.depleted || d.economicallyExhausted
          ? "depleted"
          : d.extraction.currentExtraction > 0
            ? "active"
            : "idle",
      rate: d.extraction.currentExtraction,
      cumulative: d.extraction.cumulativeExtraction,
      reserveRatio:
        !d.renewable && d.stock.initialQuantity > 0
          ? d.stock.quantity / d.stock.initialQuantity
          : undefined,
    }));
}

function deriveResources(
  deposits: readonly ResourceDeposit[],
  extraction: readonly RegionVisualExtraction[],
): readonly RegionVisualResource[] {
  const worked = new Set(
    extraction.filter((e) => e.state !== "depleted").map((e) => e.resourceDefinitionId),
  );
  const byResource = new Map<string, { renewable: boolean; deposits: number }>();
  for (const d of deposits) {
    if (d.depleted || d.economicallyExhausted) continue;
    const entry = byResource.get(d.resourceDefinitionId) ?? {
      renewable: d.renewable,
      deposits: 0,
    };
    entry.deposits += 1;
    byResource.set(d.resourceDefinitionId, entry);
  }
  return [...byResource.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([resourceDefinitionId, e]) => ({
      resourceDefinitionId,
      renewable: e.renewable,
      deposits: e.deposits,
      extracted: worked.has(resourceDefinitionId),
    }));
}

function deriveLandmark(resources: readonly RegionVisualResource[]): string | undefined {
  if (resources.length === 0) return undefined;
  const sorted = [...resources].sort((a, b) =>
    a.deposits !== b.deposits
      ? b.deposits - a.deposits
      : a.resourceDefinitionId.localeCompare(b.resourceDefinitionId),
  );
  const [top, runnerUp] = sorted;
  if (runnerUp && runnerUp.deposits === top!.deposits) return undefined; // brak jednoznacznej dominacji
  return top!.resourceDefinitionId;
}

/** Trasy połączenia pogrupowane po rodzinie wizualnej trybu transportu (content). */
function connectionRoutes(
  transportModes: readonly string[],
  familyByModeId: Readonly<Record<string, string>>,
): readonly ConnectionVisualRoute[] {
  const byFamily = new Map<string, string[]>();
  for (const modeId of [...new Set(transportModes)].sort()) {
    const key = familyByModeId[modeId] ?? "";
    byFamily.set(key, [...(byFamily.get(key) ?? []), modeId]);
  }
  return [...byFamily.entries()]
    .sort((a, b) => (a[0] === "" ? 1 : b[0] === "" ? -1 : a[0].localeCompare(b[0])))
    .map(([family, transportModeIds]) => ({
      family: family === "" ? undefined : family,
      transportModeIds,
    }));
}

export function buildConnectionVisualProfile(
  state: WorldState,
  connectionId: string,
  options: BuildRegionVisualProfileOptions = {},
): ConnectionVisualProfile | undefined {
  const connection = state.connections[connectionId];
  if (!connection) return undefined;
  return {
    connectionId,
    regionAId: connection.regionAId,
    regionBId: connection.regionBId,
    level: connection.infrastructure.level,
    routes: connectionRoutes(
      connection.infrastructure.transportModes,
      options.routeFamilyByTransportModeId ?? {},
    ),
    capacity: connection.infrastructure.capacity,
    utilization: connection.currentState.utilization,
    congestion: connection.currentState.congestion,
    disrupted: connection.currentState.disrupted,
  };
}

function deriveTransport(
  state: WorldState,
  region: WorldState["regions"][string],
  options: BuildRegionVisualProfileOptions,
): RegionVisualTransport | undefined {
  let best: RegionVisualTransport | undefined;
  for (const id of region.connections.connectionIds) {
    for (const route of buildConnectionVisualProfile(state, id, options)?.routes ?? []) {
      const transport = route.family ? LAND_ROUTE_TRANSPORT[route.family] : undefined;
      if (transport && (!best || TRANSPORT_RANK[transport] > TRANSPORT_RANK[best]))
        best = transport;
    }
  }
  return best;
}

/** Stabilne zakodowanie tekstowe każdego wizualnie istotnego pola (kolejność nigdy nie zależy od iteracji kluczy obiektu). */
function serializeVisualState(
  profile: Omit<RegionVisualProfile, "vignetteSeed">,
): string {
  return [
    profile.terrain,
    profile.climate,
    profile.elevationClass,
    profile.fertility,
    profile.water,
    profile.vegetation,
    profile.settlement ?? "",
    (profile.industry ?? [])
      .map((i) => `${i.sector}:${i.scale ?? ""}:${i.state}`)
      .join(","),
    profile.extraction.map((e) => `${e.depositId}:${e.state}`).join(","),
    profile.resources.map((r) => r.resourceDefinitionId).join(","),
    profile.transport ?? "",
    profile.landmarkResourceDefinitionId ?? "",
  ].join("|");
}

export function buildRegionVisualProfileReadModel(
  state: WorldState,
  regionId: string,
  options: BuildRegionVisualProfileOptions = {},
): RegionVisualProfile | undefined {
  const region = state.regions[regionId];
  if (!region) return undefined;

  const industry = deriveIndustry(state, region, options.sectorByCompanyArchetypeId);
  const activeSectors = (industry ?? [])
    .filter((entry) => entry.activeCompanies > 0)
    .map((entry) => entry.sector);
  const deposits = knownDeposits(state, region);
  const extraction = deriveExtraction(
    deposits,
    options.extractionFamilyByResourceId ?? {},
  );
  const resources = deriveResources(deposits, extraction);

  const base = {
    regionId,
    terrain: region.geography.terrain,
    climate: region.geography.climate,
    elevationClass: region.geography.elevationClass,
    fertility: deriveFertility(region.geography.fertility),
    water: deriveWater(region.geography),
    vegetation: deriveVegetation(region, activeSectors),
    settlement: deriveSettlement(state, region),
    industry,
    extraction,
    resources,
    transport: deriveTransport(state, region, options),
    energy: undefined,
    landmarkResourceDefinitionId: deriveLandmark(resources),
  };

  return {
    ...base,
    vignetteSeed: fnv1a32(
      `${String(state.world.seed)}:${regionId}:${serializeVisualState(base)}`,
    ),
  };
}
