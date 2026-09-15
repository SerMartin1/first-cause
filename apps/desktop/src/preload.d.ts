import type { FirstCauseApi } from "@first-cause/shared";

declare global {
  interface Window {
    readonly firstCause: FirstCauseApi;
  }
}

export {};
