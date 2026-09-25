import type { FirstCauseApi } from "@first-cause/shared";
import type { WorldApi } from "@first-cause/simulation";

declare global {
  interface Window {
    readonly firstCause: FirstCauseApi;
    readonly firstCauseWorld: WorldApi;
  }
}

export {};
