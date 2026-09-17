import type { Company } from "@first-cause/entities";

/**
 * Company jako stan produkcyjny (Entity Data Model SS19): `production.ts`
 * (M7) jest jedynym miejscem, które zmienia `Company.production` --
 * finanse (`finance.revenue/costs`) i AI (`OBSERVE -> DECIDE -> ACT`)
 * należą do M8 (ceny) i M11 (Company AI), więc tu nie ma dla nich pola
 * do wypełnienia.
 */
export interface ApplyProductionToCompanyInput {
  readonly company: Company;
  readonly productionMethodId: string;
  /** Suma jednostek wszystkich wyprodukowanych dóbr w tym ticku. */
  readonly outputQuantity: number;
  /** Faktycznie zużyte ilości (resource + good id -> ilość) w tym ticku. */
  readonly inputRequirements: Readonly<Record<string, number>>;
}

export function applyProductionToCompany(input: ApplyProductionToCompanyInput): Company {
  return {
    ...input.company,
    production: {
      ...input.company.production,
      productionMethodId: input.productionMethodId,
      outputLastTick: input.outputQuantity,
      inputRequirements: input.inputRequirements,
    },
  };
}
