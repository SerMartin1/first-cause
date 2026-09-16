import { describe, expect, it } from "vitest";
import { createCompany } from "./company.js";

describe("createCompany", () => {
  it("starts active, not distressed/bankrupt, with zeroed finance/production/workforce", () => {
    const company = createCompany({
      id: "company_001",
      archetypeId: "crop_farm",
      name: "Black Mountain Farm",
      foundedTick: 0,
      regionId: "region_001",
      ownerType: "individual",
      ownerEntityId: "cohort_001",
      inventoryId: "inventory_001",
    });

    expect(company.status).toEqual({ active: true, distressed: false, bankrupt: false });
    expect(company.finance.cash).toBe(0);
    expect(company.production.capacity).toBe(0);
    expect(company.closedTick).toBeUndefined();
  });

  it("rejects a negative foundedTick", () => {
    expect(() =>
      createCompany({
        id: "company_001",
        archetypeId: "crop_farm",
        name: "X",
        foundedTick: -1,
        regionId: "region_001",
        ownerType: "individual",
        ownerEntityId: "cohort_001",
        inventoryId: "inventory_001",
      }),
    ).toThrow(RangeError);
  });
});
