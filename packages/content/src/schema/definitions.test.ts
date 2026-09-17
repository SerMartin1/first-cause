import { describe, expect, it } from "vitest";
import { ResourceDefinitionSchema } from "./resource-definition.js";
import { GoodDefinitionSchema } from "./good-definition.js";
import { CompanyArchetypeDefinitionSchema } from "./company-archetype-definition.js";
import { ProductionMethodDefinitionSchema } from "./production-method-definition.js";
import { DiscoveryDefinitionSchema } from "./discovery-definition.js";
import { ServiceDefinitionSchema } from "./service-definition.js";
import { TransportModeDefinitionSchema } from "./transport-mode-definition.js";
import { InterventionDefinitionSchema } from "./intervention-definition.js";
import { EventTypeDefinitionSchema } from "./event-type-definition.js";
import { ChronicleTemplateDefinitionSchema } from "./chronicle-template-definition.js";

/**
 * One minimal valid fixture per content type (Content-Localization-Spec
 * SS41-SS50), proving the `JSON -> Zod` half of the M2 pipeline for every
 * type the roadmap's M2 "Moduły" lists -- not just the two (Resource,
 * Good) exercised in depth by `loaders/content-pack.test.ts`.
 */
const CASES = [
  {
    name: "ResourceDefinition",
    schema: ResourceDefinitionSchema,
    valid: {
      id: "iron_ore",
      nameKey: "content.resource.iron_ore.name",
      category: "mineral",
      renewable: false,
      basePrice: 6,
      implementationPhase: "VS",
    },
    requiredFieldToOmit: "renewable",
  },
  {
    name: "GoodDefinition",
    schema: GoodDefinitionSchema,
    valid: {
      id: "flour",
      nameKey: "content.good.flour.name",
      category: "food_intermediate",
      basePrice: 4,
      implementationPhase: "VS",
    },
    requiredFieldToOmit: "category",
  },
  {
    name: "CompanyArchetypeDefinition",
    schema: CompanyArchetypeDefinitionSchema,
    valid: {
      id: "grain_farm",
      nameKey: "content.company_archetype.grain_farm.name",
      sector: "agriculture",
      capitalRequirement: 1000,
      implementationPhase: "VS",
    },
    requiredFieldToOmit: "capitalRequirement",
  },
  {
    name: "ProductionMethodDefinition",
    schema: ProductionMethodDefinitionSchema,
    valid: {
      id: "manual_farming",
      nameKey: "content.production_method.manual_farming.name",
      implementationPhase: "VS",
    },
    requiredFieldToOmit: "implementationPhase",
  },
  {
    name: "DiscoveryDefinition",
    schema: DiscoveryDefinitionSchema,
    valid: {
      id: "basic_smelting",
      nameKey: "content.discovery.basic_smelting.name",
      primaryDomainId: "metallurgy",
      tier: 1,
      implementationPhase: "VS",
    },
    requiredFieldToOmit: "tier",
  },
  {
    name: "ServiceDefinition",
    schema: ServiceDefinitionSchema,
    valid: {
      id: "basic_healthcare",
      nameKey: "content.service.basic_healthcare.name",
      category: "health",
      implementationPhase: "VS",
    },
    requiredFieldToOmit: "category",
  },
  {
    name: "TransportModeDefinition",
    schema: TransportModeDefinitionSchema,
    valid: {
      id: "cart_road",
      nameKey: "content.transport_mode.cart_road.name",
      implementationPhase: "VS",
    },
    requiredFieldToOmit: "implementationPhase",
  },
  {
    name: "InterventionDefinition",
    schema: InterventionDefinitionSchema,
    valid: {
      id: "reveal_resource",
      nameKey: "content.intervention.reveal_resource.name",
      category: "knowledge",
      cooldown: 0,
      rootFactType: "resource_discovered",
      implementationPhase: "VS",
    },
    requiredFieldToOmit: "rootFactType",
  },
  {
    name: "EventTypeDefinition",
    schema: EventTypeDefinitionSchema,
    valid: {
      id: "harvest_failure",
      nameKey: "content.event_type.harvest_failure.name",
      category: "agriculture",
      implementationPhase: "VS",
    },
    requiredFieldToOmit: "category",
  },
  {
    name: "ChronicleTemplateDefinition",
    schema: ChronicleTemplateDefinitionSchema,
    valid: {
      id: "resource_discovered_template",
      factOrEventType: "resource_discovered",
      titleKey: "chronicle.resource_discovered.title",
      bodyKey: "chronicle.resource_discovered.body",
      implementationPhase: "VS",
    },
    requiredFieldToOmit: "bodyKey",
  },
] as const;

describe("content definition schemas", () => {
  for (const testCase of CASES) {
    describe(testCase.name, () => {
      it("accepts a minimal valid definition", () => {
        const result = testCase.schema.safeParse(testCase.valid);
        expect(result.success).toBe(true);
      });

      it(`rejects a definition missing "${testCase.requiredFieldToOmit}"`, () => {
        const broken = { ...testCase.valid };
        delete (broken as Record<string, unknown>)[testCase.requiredFieldToOmit];

        const result = testCase.schema.safeParse(broken);
        expect(result.success).toBe(false);
      });

      it("rejects a non-snake_case id", () => {
        const broken = { ...testCase.valid, id: "Not Snake Case" };
        const result = testCase.schema.safeParse(broken);
        expect(result.success).toBe(false);
      });

      it("rejects an invalid implementationPhase", () => {
        const broken = { ...testCase.valid, implementationPhase: "ALPHA" };
        const result = testCase.schema.safeParse(broken);
        expect(result.success).toBe(false);
      });
    });
  }

  /**
   * `basePrice` (M8 "Dane"/BaseContentPrice) is optional -- most content
   * loading tests never set it -- but must respect `price > 0` (Entity
   * Data Model SS15) whenever a definition does provide one.
   */
  describe("basePrice (Resource/Good only)", () => {
    for (const testCase of [CASES[0], CASES[1]]) {
      it(`${testCase.name} accepts omitting basePrice`, () => {
        const withoutPrice = { ...testCase.valid };
        delete (withoutPrice as Record<string, unknown>).basePrice;
        expect(testCase.schema.safeParse(withoutPrice).success).toBe(true);
      });

      it(`${testCase.name} rejects a zero or negative basePrice`, () => {
        expect(
          testCase.schema.safeParse({ ...testCase.valid, basePrice: 0 }).success,
        ).toBe(false);
        expect(
          testCase.schema.safeParse({ ...testCase.valid, basePrice: -1 }).success,
        ).toBe(false);
      });
    }
  });
});
