import { fnv1a32 } from "@first-cause/simulation";
import type { RegionVisualProfile } from "@first-cause/simulation";

/**
 * FCRegionVignette (UI-F1 "Procedural Region Visual Identity",
 * `UI-Visual-Design-System-v1.0.md` SS18, `UI-Implementation-Spec-v1.0.md`
 * SS13). Druga połowa pipeline'u z SS18.1:
 * `RegionVisualProfile -> deterministic SVG/2D composition -> region
 * vignette` (pierwsza połowa, `WorldState -> RegionVisualProfile`, to
 * `buildRegionVisualProfileReadModel` z `@first-cause/simulation`).
 *
 * SS18.7 (zaktualizowane 2026-09-20, decyzja użytkownika): agent
 * kodujący nadal nie projektuje stylu ani nie generuje obrazów
 * samodzielnie -- moduły biblioteki assetów mogą teraz powstawać przez
 * generator obrazów AI, ale wyłącznie pod nadzorem i zatwierdzeniem
 * użytkownika. Taka zatwierdzona biblioteka jeszcze nie istnieje
 * (`/assets/region-vignette/` z SS18.8 nie jest wypełniona), więc
 * każda warstwa poniżej renderuje na razie neutralne, abstrakcyjne
 * znaczniki wyłącznie z Design Tokens (nigdy pikturalną sylwetkę
 * góry/drzewa/domu), których pozycja/liczba/przezroczystość jest
 * deterministyczną funkcją profilu. To, za co agent *jest*
 * odpowiedzialny wg SS18.7 -- pipeline, reguły kompozycji,
 * deterministyczne warianty, skalowanie i mapowanie danych na warstwy
 * -- jest w pełni realne; tylko *wygląd* znaczników jest placeholderem,
 * wymiennym per warstwa (docelowo na zatwierdzone assety) bez dotykania
 * tej logiki mapowania.
 */
export type FCRegionVignetteSize = "small" | "large";

const SIZE_DIMENSIONS: Readonly<Record<FCRegionVignetteSize, { width: number; height: number }>> =
  {
    // SS18.2: hover ~120x70, Region Selected/Detail ~400x120.
    small: { width: 120, height: 70 },
    large: { width: 400, height: 120 },
  };

export interface FCRegionVignetteProps {
  readonly profile: RegionVisualProfile;
  readonly size?: FCRegionVignetteSize;
  readonly className?: string;
}

/** Deterministyczny wybór wariantu 0..(count-1) z `vignetteSeed` + soli specyficznej dla warstwy -- nigdy `Math.random()` (SS18.6/SS13.2). */
function pickVariant(seed: number, salt: string, count: number): number {
  if (count <= 0) return 0;
  return fnv1a32(salt, seed >>> 0) % count;
}

const TERRAIN_ELEVATION_TIER: Readonly<Record<RegionVisualProfile["terrain"], number>> = {
  wetland: 0,
  desert: 0,
  plains: 0,
  forest: 1,
  hills: 1,
  mountains: 2,
};

const VEGETATION_DENSITY: Readonly<Record<RegionVisualProfile["vegetation"], number>> = {
  none: 0,
  sparse_forest: 1,
  grassland: 1,
  fields: 2,
  dense_forest: 3,
};

const SETTLEMENT_TIER: Readonly<Record<NonNullable<RegionVisualProfile["settlement"]>, number>> =
  {
    HAMLET: 1,
    VILLAGE: 2,
    TOWN: 3,
    CITY: 4,
    METROPOLIS: 5,
  };

const TRANSPORT_TIER: Readonly<Record<NonNullable<RegionVisualProfile["transport"]>, number>> = {
  trail: 1,
  road: 2,
  railway: 3,
  highway: 4,
};

interface LayerBandProps {
  readonly width: number;
  readonly height: number;
}

export function FCTerrainLayer({
  terrain,
  water,
  width,
  height,
  seed,
}: LayerBandProps & {
  readonly terrain: RegionVisualProfile["terrain"];
  readonly water: RegionVisualProfile["water"];
  readonly seed: number;
}) {
  const tier = TERRAIN_ELEVATION_TIER[terrain];
  const baseline = height * 0.82;
  const tickCount = tier * 2;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const variant = pickVariant(seed, `terrain:${i}`, 3);
    const tickHeight = (height * 0.06) * (tier + 1) * (0.7 + variant * 0.15);
    const x = (width / (tickCount + 1)) * (i + 1);
    return (
      <line
        key={i}
        className="fc-region-vignette__mark fc-region-vignette__mark--terrain"
        x1={x}
        y1={baseline}
        x2={x}
        y2={baseline - tickHeight}
      />
    );
  });

  return (
    <g aria-hidden="true">
      <line
        className="fc-region-vignette__mark fc-region-vignette__mark--terrain"
        x1={0}
        y1={baseline}
        x2={width}
        y2={baseline}
      />
      {ticks}
      {water !== "none" && (
        <line
          className="fc-region-vignette__mark fc-region-vignette__mark--water"
          x1={0}
          y1={height - height * 0.06}
          x2={water === "coast" ? width : width * 0.6}
          y2={height - height * 0.06}
        />
      )}
    </g>
  );
}

export function FCVegetationLayer({
  vegetation,
  width,
  height,
  seed,
}: LayerBandProps & {
  readonly vegetation: RegionVisualProfile["vegetation"];
  readonly seed: number;
}) {
  const density = VEGETATION_DENSITY[vegetation];
  if (density === 0) return null;

  const count = density * 3;
  const baseline = height * 0.78;
  const marks = Array.from({ length: count }, (_, i) => {
    const variant = pickVariant(seed, `vegetation:${i}`, 4);
    const x = (width / (count + 1)) * (i + 1) + variant;
    const markHeight = height * 0.07;
    return (
      <rect
        key={i}
        className="fc-region-vignette__mark fc-region-vignette__mark--vegetation"
        x={x - 1}
        y={baseline - markHeight}
        width={2}
        height={markHeight}
      />
    );
  });

  return <g aria-hidden="true">{marks}</g>;
}

export function FCSettlementLayer({
  settlement,
  width,
  height,
}: LayerBandProps & { readonly settlement: RegionVisualProfile["settlement"] }) {
  if (!settlement) return null;

  const tier = SETTLEMENT_TIER[settlement];
  const baseline = height * 0.82;
  const marks = Array.from({ length: tier }, (_, i) => {
    const markHeight = height * (0.1 + (i % 3) * 0.03);
    const x = width * 0.15 + (width * 0.6 * i) / Math.max(tier - 1, 1);
    return (
      <rect
        key={i}
        className="fc-region-vignette__mark fc-region-vignette__mark--settlement"
        x={x - 2}
        y={baseline - markHeight}
        width={4}
        height={markHeight}
      />
    );
  });

  return <g aria-hidden="true">{marks}</g>;
}

export function FCTransportLayer({
  transport,
  width,
  height,
}: LayerBandProps & { readonly transport: RegionVisualProfile["transport"] }) {
  if (!transport) return null;

  const tier = TRANSPORT_TIER[transport];
  const y = height * 0.9;
  const dashArray = transport === "trail" ? "2,3" : transport === "railway" ? "6,2" : undefined;

  return (
    <g aria-hidden="true">
      <line
        className="fc-region-vignette__mark fc-region-vignette__mark--transport"
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        strokeWidth={tier}
        strokeDasharray={dashArray}
      />
    </g>
  );
}

/**
 * Zawsze renderuje nic: nie istnieje jeszcze źródło danych o inwestycji
 * infrastrukturalnej (`Connection.infrastructure.level` żyje dla
 * transportu, ale osobny sygnał port/grid/airport/utilities -- nie).
 * Istnieje jako osobny komponent, żeby katalog 7 warstw z SS18.3/SS8.5
 * był kompletny, a podłączenie realnych danych później nie wymagało
 * zmian w kompozycji powyżej tego pliku.
 */
export function FCInfrastructureLayer(_props: LayerBandProps) {
  return null;
}

export function FCIndustryLayer({
  industry,
  width,
  height,
}: LayerBandProps & { readonly industry: RegionVisualProfile["industry"] }) {
  // M21-VIS-R2: `industry[]` -- jeden znacznik na sektor (maks. 4), zamknięty sektor bez wypełnienia.
  if (!industry?.length) return null;

  const y = height * 0.3;
  return (
    <g aria-hidden="true">
      {industry.slice(0, 4).map((entry, i) => {
        const x = width * 0.82 - i * 12;
        return (
          <rect
            key={entry.sector}
            className="fc-region-vignette__mark fc-region-vignette__mark--industry"
            x={x - 4}
            y={y - 4}
            width={8}
            height={8}
            fillOpacity={entry.state === "closed" ? 0 : undefined}
          />
        );
      })}
    </g>
  );
}

export function FCLandmarkLayer({
  landmarkResourceDefinitionId,
  width,
  height,
}: LayerBandProps & {
  readonly landmarkResourceDefinitionId: RegionVisualProfile["landmarkResourceDefinitionId"];
}) {
  if (!landmarkResourceDefinitionId) return null;

  const cx = width * 0.5;
  const cy = height * 0.22;
  const r = Math.min(width, height) * 0.05;
  return (
    <g aria-hidden="true">
      <path
        className="fc-region-vignette__mark fc-region-vignette__mark--landmark"
        d={`M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`}
      />
    </g>
  );
}

function describeProfile(profile: RegionVisualProfile): string {
  const parts = [
    `terrain: ${profile.terrain}`,
    `water: ${profile.water}`,
    `vegetation: ${profile.vegetation}`,
  ];
  if (profile.settlement) parts.push(`settlement: ${profile.settlement}`);
  if (profile.industry?.length)
    parts.push(`industry: ${profile.industry.map((entry) => entry.sector).join(" + ")}`);
  if (profile.extraction.length)
    parts.push(
      `extraction: ${profile.extraction.map((entry) => entry.resourceDefinitionId).join(" + ")}`,
    );
  if (profile.transport) parts.push(`transport: ${profile.transport}`);
  if (profile.landmarkResourceDefinitionId) {
    parts.push(`landmark: ${profile.landmarkResourceDefinitionId}`);
  }
  return parts.join(", ");
}

export function FCRegionVignette({
  profile,
  size = "large",
  className,
}: FCRegionVignetteProps) {
  const { width, height } = SIZE_DIMENSIONS[size];

  return (
    <svg
      className={["fc-region-vignette", className].filter(Boolean).join(" ")}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={describeProfile(profile)}
      data-vignette-seed={profile.vignetteSeed}
    >
      <rect className="fc-region-vignette__bg" x={0} y={0} width={width} height={height} />
      <FCTerrainLayer
        terrain={profile.terrain}
        water={profile.water}
        width={width}
        height={height}
        seed={profile.vignetteSeed}
      />
      <FCVegetationLayer
        vegetation={profile.vegetation}
        width={width}
        height={height}
        seed={profile.vignetteSeed}
      />
      <FCSettlementLayer settlement={profile.settlement} width={width} height={height} />
      <FCTransportLayer transport={profile.transport} width={width} height={height} />
      <FCInfrastructureLayer width={width} height={height} />
      <FCIndustryLayer industry={profile.industry} width={width} height={height} />
      <FCLandmarkLayer
        landmarkResourceDefinitionId={profile.landmarkResourceDefinitionId}
        width={width}
        height={height}
      />
    </svg>
  );
}
