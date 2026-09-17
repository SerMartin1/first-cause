import { describe, expect, it } from "vitest";
import { createCompany } from "@first-cause/entities";
import { applyProductionToCompany } from "./companies.js";

function buildCompany() {
  return createCompany({
    id: "company_001",
    archetypeId: "grain_farm",
    name: "Test Farm",
    foundedTick: 0,
    regionId: "region_001",
    ownerType: "individual",
    ownerEntityId: "cohort_001",
    inventoryId: "inventory_001",
  });
}

describe("applyProductionToCompany", () => {
  it("records the production method, output total and input requirements for this tick", () => {
    const next = applyProductionToCompany({
      company: buildCompany(),
      productionMethodId: "manual_farming",
      outputQuantity: 8,
      inputRequirements: { grain: 10 },
    });

    expect(next.production.productionMethodId).toBe("manual_farming");
    expect(next.production.outputLastTick).toBe(8);
    expect(next.production.inputRequirements).toEqual({ grain: 10 });
  });

  it("leaves every other field of the company untouched", () => {
    const company = buildCompany();
    const next = applyProductionToCompany({
      company,
      productionMethodId: "manual_farming",
      outputQuantity: 0,
      inputRequirements: {},
    });

    expect(next.finance).toBe(company.finance);
    expect(next.workforce).toBe(company.workforce);
    expect(next.status).toBe(company.status);
  });
});
