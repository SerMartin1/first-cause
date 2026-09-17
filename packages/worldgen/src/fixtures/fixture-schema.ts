import { z } from "zod";

/**
 * Structural schema for a hand-written world fixture JSON document
 * (Implementation Roadmap M4, IMPL-005). Mirrors the `Create*Input`
 * shapes in `@first-cause/entities` field-for-field -- this is the
 * `JSON -> Zod` half of the fixture pipeline; `createWorldState`
 * (called by `load-world-fixture.ts`) does the semantic/referential
 * validation.
 *
 * Deliberately generic: nothing here, or in any other file in this
 * package, may reference the identity of any one reference scenario
 * -- World Generation Spec SS16 holds the procedural generator to that
 * rule, and a fixture loader is held to the same one, so scenario data
 * and engine code never blur together.
 */
const IdSchema = z.string().min(1);

const WorldFixtureSchema = z.object({
  world: z.object({
    id: IdSchema,
    seed: z.union([z.string(), z.number()]),
    name: z.string().min(1),
    configuration: z.object({
      regionCount: z.number().int().nonnegative(),
      worldSizePreset: z.string().min(1),
    }),
    startDate: z
      .object({ year: z.number().int(), month: z.number().int().min(1).max(12) })
      .optional(),
  }),

  continents: z
    .array(
      z.object({
        id: IdSchema,
        name: z.string().min(1),
        tags: z.array(z.string()).optional(),
      }),
    )
    .default([]),

  regions: z
    .array(
      z.object({
        id: IdSchema,
        continentId: IdSchema,
        name: z.string().min(1),
        geography: z.object({
          terrain: z.enum([
            "plains",
            "hills",
            "mountains",
            "forest",
            "desert",
            "wetland",
          ]),
          climate: z.enum([
            "temperate",
            "continental",
            "arid",
            "tropical",
            "cold",
            "mediterranean",
          ]),
          area: z.number().nonnegative(),
          fertility: z.number().min(0).max(1),
          waterAccess: z.boolean(),
          coastal: z.boolean(),
          elevationClass: z.enum(["lowland", "upland", "highland"]),
        }),
      }),
    )
    .default([]),

  connections: z
    .array(
      z.object({
        id: IdSchema,
        regionAId: IdSchema,
        regionBId: IdSchema,
        geography: z.object({
          physicalDistance: z.number().nonnegative(),
          terrainDifficulty: z.number().nonnegative(),
          seasonalModifier: z.number().nonnegative(),
        }),
        infrastructure: z
          .object({
            level: z.number().nonnegative(),
            transportModes: z.array(z.string()).default([]),
            capacity: z.number().nonnegative(),
          })
          .optional(),
        friction: z
          .object({
            security: z.number().nonnegative(),
            borderFriction: z.number().nonnegative(),
          })
          .optional(),
      }),
    )
    .default([]),

  resourceDeposits: z
    .array(
      z.object({
        id: IdSchema,
        resourceDefinitionId: IdSchema,
        regionId: IdSchema,
        initialQuantity: z.number().nonnegative(),
        quality: z.number().min(0).max(1).optional(),
        depth: z.number().nonnegative().optional(),
        accessibility: z.number().min(0).max(1).optional(),
        renewable: z.boolean(),
        renewableState: z
          .object({
            regenerationRate: z.number().nonnegative(),
            sustainableYield: z.number().nonnegative(),
            carryingCapacity: z.number().nonnegative(),
          })
          .optional(),
      }),
    )
    .default([]),

  settlements: z
    .array(
      z.object({
        id: IdSchema,
        regionId: IdSchema,
        name: z.string().min(1),
        foundedTick: z.number().int().nonnegative(),
        stage: z
          .enum(["CAMP", "HAMLET", "VILLAGE", "TOWN", "CITY", "METROPOLIS"])
          .optional(),
      }),
    )
    .default([]),

  populationCohorts: z
    .array(
      z.object({
        id: IdSchema,
        regionId: IdSchema,
        settlementId: IdSchema.optional(),
        ageGroup: z.enum([
          "AGE_0_14",
          "AGE_15_24",
          "AGE_25_44",
          "AGE_45_64",
          "AGE_65_PLUS",
        ]),
        population: z.number().int().nonnegative(),
        economicClass: z.enum(["POOR", "WORKING", "MIDDLE", "WEALTHY", "ELITE"]),
        skillLevel: z.enum(["UNSKILLED", "SKILLED", "SPECIALIST"]),
      }),
    )
    .default([]),

  inventories: z
    .array(
      z.object({
        id: IdSchema,
        ownerType: z.enum(["region", "company", "settlement"]),
        ownerId: IdSchema,
        locationRegionId: IdSchema,
        capacity: z
          .object({
            general: z.number().nonnegative().default(0),
            refrigerated: z.number().nonnegative().default(0),
            secure: z.number().nonnegative().default(0),
            hazardous: z.number().nonnegative().default(0),
          })
          .optional(),
      }),
    )
    .default([]),

  companies: z
    .array(
      z.object({
        id: IdSchema,
        archetypeId: IdSchema,
        name: z.string().min(1),
        foundedTick: z.number().int().nonnegative(),
        regionId: IdSchema,
        settlementId: IdSchema.optional(),
        ownerType: z.enum(["individual", "company", "state"]),
        ownerEntityId: IdSchema,
        inventoryId: IdSchema,
        initialCash: z.number().nonnegative().optional(),
        /** Etap 1 tick-loop integration: seeds `workforce.wageOffer` (required positive before `labor/employment.matchEmployment` can hire, see that module's doc comment). */
        initialWageOffer: z.number().positive().optional(),
        /** Etap 1 tick-loop integration: seeds `Company.production` -- a fixture is otherwise indistinguishable from a company producing nothing (`createCompany` defaults capacity/utilization to 0). */
        production: z
          .object({
            productionMethodId: IdSchema,
            capacity: z.number().nonnegative(),
            utilization: z.number().min(0).max(1),
          })
          .optional(),
      }),
    )
    .default([]),

  markets: z
    .array(
      z.object({
        id: IdSchema,
        regionId: IdSchema,
        /** Etap 1 tick-loop integration: good id -> BaseContentPrice, seeded via `markets/price-adjustment.initializeMarketGood` (a fixture market otherwise has no `goods` entries at all, so `updateMarketGood` has nothing to advance). */
        goods: z.record(z.number().positive()).optional(),
      }),
    )
    .default([]),

  technologyStates: z.array(z.object({ id: IdSchema, regionId: IdSchema })).default([]),
});

export type WorldFixtureDocument = z.infer<typeof WorldFixtureSchema>;

export function parseWorldFixtureDocument(
  raw: unknown,
):
  | { readonly ok: true; readonly document: WorldFixtureDocument }
  | { readonly ok: false; readonly errors: readonly string[] } {
  const result = WorldFixtureSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    };
  }
  return { ok: true, document: result.data };
}
