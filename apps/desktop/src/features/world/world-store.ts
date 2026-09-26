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
      ...patch,
    })),
}));
