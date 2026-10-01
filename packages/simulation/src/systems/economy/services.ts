import type { Company, Inventory } from "@first-cause/entities";
import { assertNonNegative } from "../../core/validation.js";
import { consignmentOf } from "./consignment.js";

/**
 * Etap 4B naprawy gospodarki (decyzja właściciela 2026-10-01, Canonical
 * §52L): minimalny model usługodawców -- Firma transportowa (C24) i Firma
 * budowlana (C23) z Vertical Slice Spec §25/§27. Usługa jest niemagazynowalną
 * zdolnością (Production-Economy Master §7): `pracownicy × unitsPerEmployee`
 * na tick, liczone z pracowników po decyzji o zatrudnieniu w tym ticku
 * (zatrudnieni pracują w miesiącu, za który dostają płacę; usługodawcy są
 * przetwarzani przed klientami). Pracownik jest zatrudniony w
 * jednej firmie naraz (zwykły rynek pracy), więc nie liczy się do kilku
 * działalności jednocześnie.
 *
 * Rola usługi w silniku wynika z `ServiceDefinition.category` (content):
 * `transport` albo `construction` -- dwie generyczne role, bez wyjątków dla
 * konkretnych firm czy regionów.
 */
export type ServiceKind = "transport" | "construction";

export interface ServiceProviderProfile {
  readonly archetypeId: string;
  readonly serviceId: string;
  readonly kind: ServiceKind;
  /** Jednostki usługi na pracownika na tick (transport: jednostki ładunku; budowa: jednostki pracy). */
  readonly unitsPerEmployee: number;
  /** Kapitał startowy z `CompanyArchetypeDefinition.capitalRequirement` -- przekazywany przez inwestora. */
  readonly capitalRequirement: number;
  /** Tylko budowa: jednostki pracy jednej rozbudowy mocy (`capacityModel.capacityExpansionWorkUnits`). */
  readonly expansionWorkUnits: number;
}

/** Most content → silnik (wołany przez `worldgen`, jak `parseProductionRecipe`). */
export function parseServiceProviderProfile(input: {
  readonly archetypeId: string;
  readonly serviceId: string;
  readonly category: string;
  readonly capacityModel: Readonly<Record<string, unknown>>;
  readonly capitalRequirement: number;
}): ServiceProviderProfile | undefined {
  if (input.category !== "transport" && input.category !== "construction") return undefined;
  const units = Number(input.capacityModel.unitsPerEmployee ?? 0);
  const work = Number(input.capacityModel.capacityExpansionWorkUnits ?? 0);
  return {
    archetypeId: input.archetypeId,
    serviceId: input.serviceId,
    kind: input.category,
    unitsPerEmployee: assertNonNegative(units, `${input.serviceId}.capacityModel.unitsPerEmployee`),
    capitalRequirement: assertNonNegative(
      input.capitalRequirement,
      `${input.archetypeId}.capitalRequirement`,
    ),
    expansionWorkUnits: assertNonNegative(
      work,
      `${input.serviceId}.capacityModel.capacityExpansionWorkUnits`,
    ),
  };
}

/** Klucz popytu na usługę w `Company.market.expectedDemand` (popyt zgłoszony w ostatnim ticku). */
export const SERVICE_DEMAND_KEY = "service";

/** Zdolność usługi w tym ticku (pracownicy po decyzji o zatrudnieniu). */
export function serviceCapacity(company: Company, profile: ServiceProviderProfile): number {
  if (!company.status.active) return 0;
  return company.workforce.employees * profile.unitsPerEmployee;
}

/** Planowani pracownicy usługodawcy: popyt z ostatniego ticka / wydajność (całe osoby). */
export function plannedServiceEmployees(
  company: Company,
  profile: ServiceProviderProfile,
): number {
  const demand = company.market.expectedDemand[SERVICE_DEMAND_KEY] ?? 0;
  if (!(demand > 0) || !(profile.unitsPerEmployee > 0)) return 0;
  return Math.ceil(demand / profile.unitsPerEmployee - 1e-9);
}

/**
 * Cena jednostkowa lotu właściciela w magazynie: cena wyładunku zapisana przy
 * przywozie (`Inventory.consignmentPrice`), a bez wpisu -- cena lokalna rynku
 * (towar wyprodukowany w regionie).
 */
export function lotUnitPrice(
  inventory: Inventory,
  itemId: string,
  ownerId: string,
  localPrice: number,
): number {
  return inventory.consignmentPrice?.[itemId]?.[ownerId] ?? localPrice;
}

/**
 * Średnia cena zakupu z magazynu przy zakupie pro rata (tak działa
 * `takeConsignment`): loty właścicieli po ich cenach, część bez właściciela
 * po cenie lokalnej.
 */
export function blendedUnitPrice(
  inventory: Inventory,
  itemId: string,
  localPrice: number,
): number {
  const stock = inventory.items[itemId]?.quantity ?? 0;
  if (!(stock > 0)) return localPrice;
  const owners = consignmentOf(inventory, itemId);
  let owned = 0;
  let value = 0;
  for (const [ownerId, quantity] of Object.entries(owners)) {
    const q = Math.min(quantity, stock);
    owned += q;
    value += q * lotUnitPrice(inventory, itemId, ownerId, localPrice);
  }
  const scale = owned > stock ? stock / owned : 1;
  return (value * scale + Math.max(0, stock - owned * scale) * localPrice) / stock;
}

/**
 * Po przywozie: cena wyładunku lotu właściciela w magazynie importera --
 * średnia ważona istniejącego lotu i nowej dostawy (ilości sprzed i po).
 */
export function withLandedPrice(
  inventory: Inventory,
  itemId: string,
  ownerId: string,
  quantityBefore: number,
  quantityAdded: number,
  landedPrice: number,
): Inventory {
  const prior = inventory.consignmentPrice?.[itemId]?.[ownerId];
  const total = quantityBefore + quantityAdded;
  const price =
    prior === undefined || !(quantityBefore > 0) || !(total > 0)
      ? landedPrice
      : (prior * quantityBefore + landedPrice * quantityAdded) / total;
  return {
    ...inventory,
    consignmentPrice: {
      ...(inventory.consignmentPrice ?? {}),
      [itemId]: { ...(inventory.consignmentPrice?.[itemId] ?? {}), [ownerId]: price },
    },
  };
}

/** Usuwa ceny lotów właścicieli, których towaru w magazynie już nie ma. */
export function pruneLotPrices(inventory: Inventory, itemId: string): Inventory {
  const prices = inventory.consignmentPrice?.[itemId];
  if (!prices) return inventory;
  const owners = consignmentOf(inventory, itemId);
  const kept = Object.fromEntries(
    Object.entries(prices)
      .filter(([ownerId]) => (owners[ownerId] ?? 0) > 0)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  const consignmentPrice = { ...(inventory.consignmentPrice ?? {}) };
  if (Object.keys(kept).length > 0) consignmentPrice[itemId] = kept;
  else delete consignmentPrice[itemId];
  return { ...inventory, consignmentPrice };
}
