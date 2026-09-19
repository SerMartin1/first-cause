import type { SettlementStage, Terrain, WorldState } from "@first-cause/entities";
import { fnv1a32 } from "../core/hash.js";

/**
 * RegionVisualProfileReadModel (UI-F1 "Procedural Region Visual
 * Identity", `UI-Visual-Design-System-v1.0.md` SS18, `UI-Implementation-
 * Spec-v1.0.md` SS13). Pipeline wg SS18.1/SS13.1:
 * `simulation state -> RegionVisualProfile -> deterministic SVG/2D
 * composition -> region vignette`. Ten moduł to tylko pierwsza strzałka
 * -- `FCRegionVignette` (apps/desktop) odpowiada za drugą.
 *
 * Każde pole wywiedzione z realnych danych `WorldState`/contentu (SS18.9
 * "NO DECORATION WITHOUT INFORMATION" -- żadne pole nie może sugerować
 * struktury, która nie istnieje). Pola bez dzisiejszego źródła danych
 * (`infrastructure`, `energy` -- nie istnieje jeszcze system inwestycji
 * infrastrukturalnej ani energii, ten sam znany brak co M12-M14's audyt
 * już odnotował dla `Connection.infrastructure.level`/`Settlement.
 * condition.attractiveness`) są uczciwie `undefined`, nie fabrykowane --
 * ten sam idiom "undefined = brak danych" co reszta tego katalogu.
 */
export type RegionVisualTerrain = Terrain;
export type RegionVisualWater = "coast" | "river" | "none";
export type RegionVisualVegetation =
  | "dense_forest"
  | "sparse_forest"
  | "grassland"
  | "fields"
  | "none";
export type RegionVisualSettlementStage = Exclude<SettlementStage, "CAMP">;
export type RegionVisualTransport = "trail" | "road" | "railway" | "highway";
export type RegionVisualIndustry =
  | "mine"
  | "workshop"
  | "farm"
  | "factory"
  | "industrial_complex"
  | "shipyard"
  | "energy";

export interface RegionVisualProfile {
  readonly regionId: string;
  readonly terrain: RegionVisualTerrain;
  readonly water: RegionVisualWater;
  readonly vegetation: RegionVisualVegetation;
  /** `undefined`: brak settlementu, albo największy settlement jest wciąż CAMP-em (SS18.9 -- obóz nie ma widocznej struktury osadniczej wartej pokazania). */
  readonly settlement: RegionVisualSettlementStage | undefined;
  /** `undefined`: region nie ma żadnego archetypu firmy o znanym sektorze (nie podano `sectorByCompanyArchetypeId`, albo nic nie pasuje). */
  readonly industry: RegionVisualIndustry | undefined;
  /** `undefined`: brak połączenia z infrastrukturą (`Connection.infrastructure.level === 0` wszędzie, albo brak połączeń). */
  readonly transport: RegionVisualTransport | undefined;
  /** Zawsze `undefined` na razie -- nie istnieje jeszcze system energii (domena SS18.4, nie osobna warstwa renderu; zasili warstwę infrastruktury, gdy pojawią się realne dane energetyczne). */
  readonly energy: undefined;
  /** Dominujący DISCOVERED/ASSESSED, niewyczerpany typ zasobu w regionie, jeśli jakiś wyraźnie dominuje liczbą złóż. `undefined`, gdy żadne złoże się nie kwalifikuje albo żadne nie dominuje jednoznacznie. */
  readonly landmarkResourceDefinitionId: string | undefined;
  /** `hash(worldSeed + regionId + visualState)` (SS18.6/SS13.2) -- deterministyczny selektor wariantu kompozycji, nigdy `Math.random()`. */
  readonly vignetteSeed: number;
}

const SETTLEMENT_STAGE_RANK: Readonly<Record<SettlementStage, number>> = {
  CAMP: 0,
  HAMLET: 1,
  VILLAGE: 2,
  TOWN: 3,
  CITY: 4,
  METROPOLIS: 5,
};

/**
 * Rodzina sektorów -> wizualna kategoria przemysłu. Zamknięta taksonomia
 * prezentacyjna (7-wartościowe słownictwo przemysłu z SS18.3), nie
 * przypadek pojedynczej firmy (AGENTS.md reguła 8) -- rozszerzaj tę
 * tabelę, nigdy nie rozgałęziaj gdzie indziej na konkretny
 * `archetypeId`/`sector`, gdy content doda nową rodzinę sektorów.
 */
const INDUSTRY_BY_SECTOR: Readonly<Record<string, RegionVisualIndustry>> = {
  agriculture: "farm",
  food_processing: "workshop",
  mining: "mine",
  quarrying: "mine",
  metallurgy: "factory",
  manufacturing: "factory",
  construction: "workshop",
  energy: "energy",
  shipbuilding: "shipyard",
};

const AGRICULTURE_SECTORS: ReadonlySet<string> = new Set(["agriculture"]);

/** TODO tuning (AGENTS.md): progi poniżej to konfigurowalne placeholdery, nie wartości z kanonu. */
const FOREST_SPARSE_PRESSURE_THRESHOLD = 0.5;
const GRASSLAND_FERTILITY_THRESHOLD = 0.4;
const TRANSPORT_LEVEL_ROAD_THRESHOLD = 2;
const TRANSPORT_LEVEL_RAILWAY_THRESHOLD = 4;
const TRANSPORT_LEVEL_HIGHWAY_THRESHOLD = 6;

function deriveWater(
  geography: WorldState["regions"][string]["geography"],
): RegionVisualWater {
  if (geography.coastal) return "coast";
  if (geography.waterAccess) return "river";
  return "none";
}

function deriveVegetation(
  region: WorldState["regions"][string],
  sectorIds: readonly string[],
): RegionVisualVegetation {
  if (region.geography.terrain === "forest") {
    return region.environment.forestPressure > FOREST_SPARSE_PRESSURE_THRESHOLD
      ? "sparse_forest"
      : "dense_forest";
  }
  if (sectorIds.some((sector) => AGRICULTURE_SECTORS.has(sector))) return "fields";
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

function deriveTransport(
  state: WorldState,
  region: WorldState["regions"][string],
): RegionVisualTransport | undefined {
  const maxLevel = region.connections.connectionIds
    .map((id) => state.connections[id]?.infrastructure.level ?? 0)
    .reduce((max, level) => Math.max(max, level), 0);
  if (maxLevel <= 0) return undefined;
  if (maxLevel >= TRANSPORT_LEVEL_HIGHWAY_THRESHOLD) return "highway";
  if (maxLevel >= TRANSPORT_LEVEL_RAILWAY_THRESHOLD) return "railway";
  if (maxLevel >= TRANSPORT_LEVEL_ROAD_THRESHOLD) return "road";
  return "trail";
}

function deriveIndustry(sectorIds: readonly string[]): RegionVisualIndustry | undefined {
  for (const sector of sectorIds) {
    const industry = INDUSTRY_BY_SECTOR[sector];
    if (industry) return industry;
  }
  return undefined;
}

function deriveLandmark(
  state: WorldState,
  region: WorldState["regions"][string],
): string | undefined {
  const counts = new Map<string, number>();
  for (const depositId of region.resources.depositIds) {
    const deposit = state.resourceDeposits[depositId];
    if (!deposit) continue;
    if (deposit.depleted || deposit.economicallyExhausted) continue;
    if (deposit.discovery.status !== "DISCOVERED" && deposit.discovery.status !== "ASSESSED") {
      continue;
    }
    counts.set(
      deposit.resourceDefinitionId,
      (counts.get(deposit.resourceDefinitionId) ?? 0) + 1,
    );
  }
  if (counts.size === 0) return undefined;

  const sortedByCountThenId = [...counts.entries()].sort((a, b) =>
    a[1] !== b[1] ? b[1] - a[1] : a[0].localeCompare(b[0]),
  );
  const [topId, topCount] = sortedByCountThenId[0]!;
  const runnerUp = sortedByCountThenId[1];
  if (runnerUp && runnerUp[1] === topCount) return undefined; // brak jednoznacznej dominacji
  return topId;
}

/** Stabilne zakodowanie tekstowe każdego wizualnie istotnego pola, do hashowania `vignetteSeed` (kolejność nigdy nie może zależeć od iteracji kluczy obiektu). */
function serializeVisualState(
  profile: Omit<RegionVisualProfile, "vignetteSeed">,
): string {
  return [
    profile.terrain,
    profile.water,
    profile.vegetation,
    profile.settlement ?? "",
    profile.industry ?? "",
    profile.transport ?? "",
    profile.landmarkResourceDefinitionId ?? "",
  ].join("|");
}

export interface BuildRegionVisualProfileOptions {
  /**
   * `companyArchetypeId -> sector` (pochodzi z contentu, np.
   * `LoadEconomyContentResult.sectorByCompanyArchetypeId` z
   * `@first-cause/worldgen`). `packages/simulation` nigdy nie czyta
   * contentu samodzielnie (AGENTS.md reguła 6) -- wołający rozwiązuje
   * sektory i podaje je tutaj, ten sam wzorzec co `discoveryEligibilityRulesById`
   * już ustanowił dla M15.
   */
  readonly sectorByCompanyArchetypeId?: Readonly<Record<string, string>>;
}

export function buildRegionVisualProfileReadModel(
  state: WorldState,
  regionId: string,
  options: BuildRegionVisualProfileOptions = {},
): RegionVisualProfile | undefined {
  const region = state.regions[regionId];
  if (!region) return undefined;

  const sectorByArchetypeId = options.sectorByCompanyArchetypeId ?? {};
  const sectorIds = [
    ...new Set(
      region.economy.companyIds
        .map((id) => state.companies[id]?.archetypeId)
        .filter((id): id is string => id !== undefined)
        .map((archetypeId) => sectorByArchetypeId[archetypeId])
        .filter((sector): sector is string => sector !== undefined),
    ),
  ].sort();

  const base = {
    regionId,
    terrain: region.geography.terrain,
    water: deriveWater(region.geography),
    vegetation: deriveVegetation(region, sectorIds),
    settlement: deriveSettlement(state, region),
    industry: deriveIndustry(sectorIds),
    transport: deriveTransport(state, region),
    energy: undefined,
    landmarkResourceDefinitionId: deriveLandmark(state, region),
  };

  return {
    ...base,
    vignetteSeed: fnv1a32(`${String(state.world.seed)}:${regionId}:${serializeVisualState(base)}`),
  };
}
