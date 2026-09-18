import { InvariantViolationError } from "./validation.js";

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

/**
 * Audytowe P1-05: dwie encje o tym samym `id` w tej samej liście po
 * cichu nadpisywały się nawzajem (ostatnia w kolejności wygrywała, druga
 * po prostu znikała z widoczności) -- to samo ryzyko utraty encji co
 * P0-01/P0-02's kolizje ID kohort migrantów, tylko o warstwę niżej,
 * współdzielone przez każdy typ encji, który przechodzi przez tę
 * funkcję. `label` (nazwa typu, np. "Company") jest opcjonalny tylko
 * dla wstecznej zgodności istniejących wywołań spoza `world-state.ts` --
 * `createWorldState` przekazuje go zawsze.
 */
export function toById<T extends { readonly id: string }>(
  items: readonly T[],
  label?: string,
): Readonly<Record<string, T>> {
  const byId: Record<string, T> = {};
  for (const item of items) {
    if (item.id in byId) {
      throw new InvariantViolationError(
        `Duplicate ${label ?? "entity"} id "${item.id}" -- the second occurrence would silently overwrite the first`,
      );
    }
    byId[item.id] = item;
  }
  return byId;
}
