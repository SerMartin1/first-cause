/**
 * Generic index-building helper (Technology Stack Decision SS34: World
 * State keeps explicit runtime indexes/caches; "cache must be
 * reconstructible"). Groups a list of items by a key extracted from
 * each item, sorting both the group keys and each group's members so
 * the result never depends on the input array's iteration/insertion
 * order (SIM-005 -- no iteration-order dependence).
 */
export function groupIdsBy<T>(
  items: readonly T[],
  keyOf: (item: T) => string | undefined,
  idOf: (item: T) => string,
): ReadonlyMap<string, readonly string[]> {
  const grouped = new Map<string, string[]>();

  for (const item of items) {
    const key = keyOf(item);
    if (key === undefined) continue;
    const list = grouped.get(key);
    if (list) {
      list.push(idOf(item));
    } else {
      grouped.set(key, [idOf(item)]);
    }
  }

  const result = new Map<string, readonly string[]>();
  for (const key of [...grouped.keys()].sort()) {
    result.set(key, [...grouped.get(key)!].sort());
  }
  return result;
}

export function toById<T extends { readonly id: string }>(
  items: readonly T[],
): Readonly<Record<string, T>> {
  const byId: Record<string, T> = {};
  for (const item of items) {
    byId[item.id] = item;
  }
  return byId;
}
