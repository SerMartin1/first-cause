/**
 * Deterministic iteration order (audit P0-03: SIM-005). `Object.entries`
 * preserves insertion order, which is a property of *how the caller built
 * the record*, not of its content -- summing/reducing over it directly
 * makes the result depend on that insertion order (floating-point
 * addition is not associative), so two callers passing the exact same
 * recipe/demand-source *content* in a different key order get a
 * different canonical outcome. Sorting by key first removes that
 * dependency: the result depends only on the content, never on how it
 * was assembled.
 */
export function sortedEntries<TValue>(
  record: Readonly<Record<string, TValue>>,
): readonly (readonly [string, TValue])[] {
  return Object.entries(record).sort(([a], [b]) => a.localeCompare(b));
}
