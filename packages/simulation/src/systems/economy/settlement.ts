import type { Company, Inventory } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { roundMoney } from "../../core/rounding.js";
import { assertNonNegative } from "../../core/validation.js";
import { addToInventory, removeFromInventory } from "./inventory.js";

/**
 * Physical + financial settlement (Etap 1 tick-loop integration). Nic w
 * M7-M11 dotąd nie przenosiło dóbr między inventory firmy/regionu ani nie
 * zapisywało `Company.finance` -- audytowe P0-01 wprost wymienia ten
 * brak. Te funkcje domykają fizyczny/finansowy obieg wokół już
 * istniejących, przetestowanych systemów (production/market/trade), bez
 * zmiany ich własnej logiki. Ten sam styl co reszta silnika: czyste
 * funkcje, `{ nowy stan, facts }`, fail-loud tylko tam, gdzie wywołujący
 * już popełnił błąd -- braki fizyczne (za mało w inventory) są tu
 * *oczekiwanym* stanem świata, więc rozliczają się częściowo zamiast
 * rzucać.
 */

export interface SettleProductionSaleInput {
  readonly companyInventory: Inventory;
  readonly regionInventory: Inventory;
  readonly goodId: string;
  /** `Market.goods[goodId].localPrice` obserwowana przez wywołującego (DATA-006). */
  readonly price: number;
  /** Ile jednostek firma trzyma jako bufor -- reszta ponad to jest sprzedawana. */
  readonly targetBufferQuantity: number;
}

export interface SettleProductionSaleResult {
  readonly companyInventory: Inventory;
  readonly regionInventory: Inventory;
  readonly quantitySold: number;
  readonly revenue: number;
  readonly facts: readonly FactInput<number>[];
}

/**
 * Sprzedaje nadwyżkę firmowego inventory (ponad `targetBufferQuantity`)
 * do inventory regionu -- most fizyczny między `production.ts` (M7) a
 * `markets/*`/`population/consumption.ts` (M8/M9), których dziś nic nie
 * łączy fizycznie. Nie mutuje `Company.finance` -- firma może sprzedawać
 * kilka dóbr w jednym ticku, a rozliczenie gotówkowe jest jedną,
 * zsumowaną operacją (`applyCompanyFinances`), żeby uniknąć podwójnego
 * naliczania przy wielu wywołaniach tej funkcji dla jednej firmy.
 */
export function settleProductionSale(
  input: SettleProductionSaleInput,
): SettleProductionSaleResult {
  const price = assertNonNegative(input.price, "settleProductionSale().price");
  const targetBufferQuantity = assertNonNegative(
    input.targetBufferQuantity,
    "settleProductionSale().targetBufferQuantity",
  );

  const available = input.companyInventory.items[input.goodId]?.quantity ?? 0;
  const quantitySold = Math.max(0, available - targetBufferQuantity);

  if (quantitySold <= 0) {
    return {
      companyInventory: input.companyInventory,
      regionInventory: input.regionInventory,
      quantitySold: 0,
      revenue: 0,
      facts: [],
    };
  }

  const removal = removeFromInventory(input.companyInventory, input.goodId, quantitySold);
  const addition = addToInventory(input.regionInventory, input.goodId, quantitySold);

  const facts: FactInput<number>[] = [];
  if (removal.fact) facts.push(removal.fact);
  if (addition.fact) facts.push(addition.fact);

  return {
    companyInventory: removal.inventory,
    regionInventory: addition.inventory,
    quantitySold,
    revenue: quantitySold * price,
    facts,
  };
}

export interface ApplyCompanyFinancesInput {
  readonly company: Company;
  /** Suma `settleProductionSale(...).revenue` na tę firmę w tym ticku. */
  readonly revenue: number;
  /** Suma kosztów tego ticku (dziś: tylko płace -- `wageOffer * employees`). */
  readonly costs: number;
}

export interface ApplyCompanyFinancesResult {
  readonly company: Company;
  readonly facts: readonly FactInput<number>[];
}

/**
 * Jedno, zsumowane rozliczenie `Company.finance` na tick: dotąd (po
 * M7-M11) te pola były martwe -- `company-ai/financial-health.ts` już je
 * czyta, ale nic ich nie zapisywało. `revenue`/`costs`/`profit` opisują
 * *ten* tick (Simulation Model SS26 traktuje 1 tick jako 1 miesiąc), nie
 * wartość skumulowaną -- tak samo jak `Company.production.outputLastTick`.
 */
export function applyCompanyFinances(
  input: ApplyCompanyFinancesInput,
): ApplyCompanyFinancesResult {
  const revenue = roundMoney(
    assertNonNegative(input.revenue, "applyCompanyFinances().revenue"),
  );
  const costs = roundMoney(
    assertNonNegative(input.costs, "applyCompanyFinances().costs"),
  );
  const profit = roundMoney(revenue - costs);
  const { company } = input;

  const nextCompany: Company = {
    ...company,
    finance: {
      ...company.finance,
      revenue,
      costs,
      profit,
      cash: roundMoney(company.finance.cash + profit),
    },
  };

  const facts: FactInput<number>[] = [];
  if (nextCompany.finance.cash !== company.finance.cash) {
    facts.push({
      type: "company_finances_settled",
      subject: { entityType: "company", entityId: company.id },
      location: { regionId: company.regionId },
      values: {
        before: company.finance.cash,
        after: nextCompany.finance.cash,
        delta: profit,
      },
    });
  }

  return { company: nextCompany, facts };
}

export interface SettleHouseholdPurchaseInput {
  readonly regionInventory: Inventory;
  readonly goodId: string;
  /** Fizyczna ilość pożądana (`spent / price`, już policzone przez wywołującego z `population/consumption.ts`). */
  readonly desiredQuantity: number;
}

export interface SettleHouseholdPurchaseResult {
  readonly regionInventory: Inventory;
  /** < desiredQuantity gdy w regionie zabrakło zapasu -- fizyczna niedostępność, nie błąd wywołania. */
  readonly quantityPurchased: number;
  readonly facts: readonly FactInput<number>[];
}

/**
 * Odejmuje fizyczną ilość kupioną przez gospodarstwa domowe z inventory
 * regionu. `population/consumption.ts` (M9) liczy tylko pieniężny
 * `spent` -- nic dotąd nie ściągało za to prawdziwych dóbr (audytowe
 * P0-01/P1 "needs zależne od dostępności dóbr"). Ogranicza do
 * dostępnego stocku zamiast rzucać -- brak towaru na półce jest
 * normalnym stanem świata, nie pomyłką wywołującego.
 */
export function settleHouseholdPurchase(
  input: SettleHouseholdPurchaseInput,
): SettleHouseholdPurchaseResult {
  const desiredQuantity = assertNonNegative(
    input.desiredQuantity,
    "settleHouseholdPurchase().desiredQuantity",
  );
  if (desiredQuantity <= 0) {
    return { regionInventory: input.regionInventory, quantityPurchased: 0, facts: [] };
  }

  const available = input.regionInventory.items[input.goodId]?.quantity ?? 0;
  const quantityPurchased = Math.min(desiredQuantity, available);
  if (quantityPurchased <= 0) {
    return { regionInventory: input.regionInventory, quantityPurchased: 0, facts: [] };
  }

  const removal = removeFromInventory(
    input.regionInventory,
    input.goodId,
    quantityPurchased,
  );

  return {
    regionInventory: removal.inventory,
    quantityPurchased,
    facts: removal.fact ? [removal.fact] : [],
  };
}

export interface SettleTradeFlowInput {
  readonly exportingInventory: Inventory;
  readonly importingInventory: Inventory;
  readonly goodId: string;
  /** `evaluateTradeFlow(...).importedQuantity` (trade/flows.ts, M10) -- decyzja już podjęta, tu tylko fizyczne przeniesienie. */
  readonly desiredQuantity: number;
}

export interface SettleTradeFlowResult {
  readonly exportingInventory: Inventory;
  readonly importingInventory: Inventory;
  /** < desiredQuantity gdy eksportujący region faktycznie nie ma tyle na stanie. */
  readonly quantityMoved: number;
  readonly facts: readonly FactInput<number>[];
}

/**
 * Fizycznie przenosi dobra między inventory dwóch regionów po decyzji
 * `evaluateTradeFlow` (trade/flows.ts, M10). `evaluateTradeFlow` samo w
 * sobie nigdy nie dotyka Inventory (audytowe P0-01: "importedQuantity nie
 * oznacza przeniesienia dóbr") -- tu ta ilość staje się rzeczywistym
 * ruchem towaru, dodatkowo ograniczonym do realnego stanu eksportującego
 * inventory (silniejsze niż `evaluateTradeFlow`'s `exportableSurplus`,
 * które jest tylko `supply - demand`, nie sprawdzeniem fizycznego stocku).
 */
export function settleTradeFlow(input: SettleTradeFlowInput): SettleTradeFlowResult {
  const desiredQuantity = assertNonNegative(
    input.desiredQuantity,
    "settleTradeFlow().desiredQuantity",
  );
  if (desiredQuantity <= 0) {
    return {
      exportingInventory: input.exportingInventory,
      importingInventory: input.importingInventory,
      quantityMoved: 0,
      facts: [],
    };
  }

  const available = input.exportingInventory.items[input.goodId]?.quantity ?? 0;
  const quantityMoved = Math.min(desiredQuantity, available);
  if (quantityMoved <= 0) {
    return {
      exportingInventory: input.exportingInventory,
      importingInventory: input.importingInventory,
      quantityMoved: 0,
      facts: [],
    };
  }

  const removal = removeFromInventory(
    input.exportingInventory,
    input.goodId,
    quantityMoved,
  );
  const addition = addToInventory(input.importingInventory, input.goodId, quantityMoved);

  const facts: FactInput<number>[] = [];
  if (removal.fact) facts.push(removal.fact);
  if (addition.fact) facts.push(addition.fact);

  return {
    exportingInventory: removal.inventory,
    importingInventory: addition.inventory,
    quantityMoved,
    facts,
  };
}
