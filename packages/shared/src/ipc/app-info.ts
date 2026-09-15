export interface AppInfo {
  readonly appVersion: string;
  readonly engineVersion: string;
  readonly environment: "development" | "production" | "test";
  /** Host OS platform identifier (e.g. "win32", "darwin", "linux"). */
  readonly platform: string;
}
