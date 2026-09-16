import { assertFinite } from "./validation.js";

/**
 * Canonical serialization (Technology Stack Decision SS83): object keys
 * sorted lexicographically, `Map` entries sorted by (canonical) key,
 * `Set` values sorted, `undefined` object fields omitted -- so two
 * structurally-equal states always produce byte-identical output
 * regardless of insertion order. Used by `core/checksum.ts` and by save
 * (M20+).
 *
 * This is a determinism tool, not a general-purpose JSON replacement:
 * non-finite numbers are rejected (a real invariant violation, not
 * something to silently coerce to `null` the way `JSON.stringify` does),
 * and functions/symbols/bigint are unsupported.
 */
export function canonicalStringify(value: unknown): string {
  return stringifyValue(value);
}

function quoteString(value: string): string {
  return JSON.stringify(value);
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  const type = typeof value;

  if (type === "boolean") {
    return value ? "true" : "false";
  }

  if (type === "number") {
    assertFinite(value as number, "canonicalStringify(number)");
    return String(value);
  }

  if (type === "string") {
    return quoteString(value as string);
  }

  if (Array.isArray(value)) {
    return `[${value.map((element) => stringifyValue(element)).join(",")}]`;
  }

  if (value instanceof Map) {
    const entries = Array.from(value.entries())
      .map(
        ([key, entryValue]) => [stringifyValue(key), stringifyValue(entryValue)] as const,
      )
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const body = entries.map(([key, entryValue]) => `[${key},${entryValue}]`).join(",");
    return `{"__type":"Map","entries":[${body}]}`;
  }

  if (value instanceof Set) {
    const values = Array.from(value.values())
      .map((entryValue) => stringifyValue(entryValue))
      .sort();
    return `{"__type":"Set","values":[${values.join(",")}]}`;
  }

  if (type === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .filter((key) => obj[key] !== undefined)
      .sort();
    const body = keys
      .map((key) => `${quoteString(key)}:${stringifyValue(obj[key])}`)
      .join(",");
    return `{${body}}`;
  }

  throw new TypeError(`canonicalStringify: unsupported value of type "${type}"`);
}
