import { create } from "zustand";
import type { WorldAnalysisScope } from "@first-cause/simulation";
import type { MapMode, Overlay, FlowLens, ChangeMetric } from "./atlas-model.js";
interface WorldUiState {
  analysisScope: WorldAnalysisScope;
  mapMode: MapMode;
  changeMetric: ChangeMetric;
  comparisonWindow: number;
  overlays: readonly Overlay[];
  zoomLevel: number;
  selectedEntityId: string | undefined;
  selectedEventId: string | undefined;
  hoveredRegionId: string | undefined;
  flowLens: FlowLens;
  flowLimit: number;
  timelineCursor: number | undefined;
  focusMode: boolean;
  causalLink: { readonly from: string; readonly to: string } | undefined;
  resourceId: string;
  discoveryId: string;
  /** R4B Handel: rozwinięty towar w tabeli Handlu i wskazany partner (tylko prezentacja). */
  tradeGoodId: string | undefined;
  tradePartnerId: string | undefined;
  set: (patch: Partial<Omit<WorldUiState, "set">>) => void;
}
export const useWorldStore = create<WorldUiState>((set) => ({
  analysisScope: { kind: "WORLD" },
  mapMode: "terrain",
  changeMetric: "population",
  comparisonWindow: 1,
  overlays: ["settlements", "names", "connections", "events"],
  zoomLevel: 1,
  selectedEntityId: undefined,
  selectedEventId: undefined,
  hoveredRegionId: undefined,
  flowLens: "off",
  flowLimit: 3,
  timelineCursor: undefined,
  focusMode: false,
  causalLink: undefined,
  resourceId: "",
  discoveryId: "",
  tradeGoodId: undefined,
  tradePartnerId: undefined,
  set: (patch) =>
    set((state) => ({
      ...("selectedEntityId" in patch && patch.selectedEntityId !== state.selectedEntityId
        ? { analysisScope: { kind: "WORLD" as const } }
        : {}),
      ...(("selectedEntityId" in patch ||
        "timelineCursor" in patch ||
        patch.focusMode === false) &&
      !("causalLink" in patch)
        ? { causalLink: undefined }
        : {}),
      // R4B: zmiana wybranego regionu albo trybu mapy usuwa rozwinięcie i wskazanie
      // partnera -- szczegóły poprzedniego regionu nie zostają na mapie ani w tabeli.
      ...(("selectedEntityId" in patch &&
        patch.selectedEntityId !== state.selectedEntityId) ||
      ("mapMode" in patch && patch.mapMode !== state.mapMode)
        ? { tradeGoodId: undefined, tradePartnerId: undefined }
        : {}),
      ...patch,
    })),
}));
