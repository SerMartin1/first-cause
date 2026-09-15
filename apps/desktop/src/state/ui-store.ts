import { create } from "zustand";

/**
 * Zustand store -- presentation state only (SS46). Never a home for
 * canonical World State: the simulation lives in the worker, not here.
 */
interface UiState {
  readonly isDeveloperOverlayOpen: boolean;
  toggleDeveloperOverlay: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isDeveloperOverlayOpen: false,
  toggleDeveloperOverlay: () =>
    set((state) => ({
      isDeveloperOverlayOpen: !state.isDeveloperOverlayOpen,
    })),
}));
