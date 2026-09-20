import { pruneCausalMemory, type CausalEdge, type SimulationFact } from "@first-cause/causality";
import { collectHistoricalAnchorFactIds } from "@first-cause/chronicle";
import type { WorldRunnerState } from "@first-cause/simulation";

/**
 * History Compaction (SS77-83, SAVE-related risk PERF-007 "biggest save
 * size risk is history, not regions"). Pure `WorldRunnerState ->
 * WorldRunnerState`: does not mutate a live `WorldRunner` (it has no API
 * for partial state replacement, only `getState()`/`fromState()`) --
 * `save-load.ts` calls this on the state `runner.getState()` already
 * produced, before building the envelope.
 *
 * Reuses `@first-cause/causality`'s `pruneCausalMemory` (already the
 * real HOT/WARM/PERMANENT implementation, `WorldRunner.
 * maybePruneCausalMemory` calls the exact same function on its own
 * interval) and the exact same `extraMustKeepFactIds` bridge to
 * `@first-cause/chronicle`'s Historical Anchors that `WorldRunner`
 * already established (SS135, `historical-anchor.ts`) -- this is not a
 * new compaction algorithm, only the entry point that runs it once,
 * unconditionally, at save time regardless of whether `WorldRunner`'s
 * own `causalPruneIntervalTicks` happens to line up with this tick.
 *
 * Chronicle's OWN history (`entryStore`/`activeProcess`) is NOT
 * compacted here -- CH-12 Historical Compression (SS82's "Time Series
 * Downsampling" applied to Chronicle Entries specifically) does not
 * exist yet (P1, roadmap's own "nie blokuje VS"). Compacting only the
 * causal fact/edge layer is real, useful shrinkage on its own (SS72:
 * facts/edges/Decision Snapshots are the dominant save-size risk, not
 * Chronicle's comparatively small entry count) -- not pretending to
 * solve a problem CH-12 hasn't been built to solve yet.
 */
export function compactWorldRunnerState(
  state: WorldRunnerState,
  currentTick: number,
): WorldRunnerState {
  const facts: readonly SimulationFact[] = state.factStore.facts;
  const edges: readonly CausalEdge[] = state.causalEdgeStore.edges;
  const architectInfluenceByFactId = new Map(Object.entries(state.architectInfluenceByFactId));

  const pruned = pruneCausalMemory({
    facts,
    edges,
    architectInfluenceByFactId,
    currentTick,
    extraMustKeepFactIds: collectHistoricalAnchorFactIds(state.chronicle.entryStore.entries),
  });

  return {
    ...state,
    factStore: {
      // `nextSequence` is NEVER reset by compaction -- pruned/aggregated
      // facts vacate their ids, but a future `FactStore.emit` must still
      // never reissue one (same reasoning as `FactStore.fromState`'s own
      // doc comment).
      facts: pruned.facts,
      nextSequence: state.factStore.nextSequence,
    },
    causalEdgeStore: {
      edges: pruned.edges,
      nextSequence: state.causalEdgeStore.nextSequence,
    },
    architectInfluenceByFactId: Object.fromEntries(pruned.architectInfluenceByFactId),
  };
}
