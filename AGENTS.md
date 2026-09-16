# Agent Instructions -- FIRST CAUSE

These rules apply to any agent (Claude Code, Codex, or otherwise)
working in this repository. They summarize obligations that are
explained in full in `docs/FIRST-CAUSE-Canonical-Decisions-v0.1.md`
and `docs/FIRST-CAUSE-Implementation-Roadmap-v0.2.md`.

1. **Read `docs/FIRST-CAUSE-Canonical-Decisions-v0.1.md` first.** If
   something in another spec conflicts with it, the Canonical
   Decisions document wins. Do not resolve a conflict by picking
   whichever answer is easier to implement.
2. **Read the current milestone in
   `docs/FIRST-CAUSE-Implementation-Roadmap-v0.2.md`** before writing
   code. Its per-milestone "Documentation Readiness" field tells you
   which specs to read for that milestone specifically.
3. **Implement only the current milestone.** Do not build a system
   described in a FULL/future spec just because it exists on paper --
   check whether it is active in the current milestone/Vertical Slice
   scope first.
4. **Never use `Math.random()` (or any uncontrolled randomness) in
   Simulation Core.** All randomness goes through the seeded,
   named-stream deterministic RNG (introduced in `M1`).
5. **The UI never mutates World State directly.** All player actions
   go through explicit Commands; the renderer only ever reads Read
   Models.
6. **Simulation Core never imports UI or Electron.** `packages/simulation`,
   `packages/entities`, `packages/worldgen` (and future
   `packages/causality`, `packages/chronicle`) must stay independent of
   React and Electron so they can run headless (`pnpm sim:run`).
7. **Content is data-driven.** New resources, goods, company
   archetypes, production methods and discoveries are added as JSON
   content definitions validated by Zod schemas -- not as new engine
   code branches.
8. **Never hardcode content-specific exceptions in generic systems.**
   No `if company === "steelworks"` or `if region === "black_mountain"`
   in engine code. Black Mountain is a data fixture, not a special
   code path.
9. **Determinism is P0, from the first commit.** It is not a feature
   added later. Every mutation follows
   `READ -> CALCULATE -> VALIDATE -> COMMIT -> EMIT FACTS`.
10. **Changing the UI locale (EN/PL/...) never affects Simulation
    State, the RNG, or the World checksum.**
11. **Profile before optimizing.** Correctness and determinism come
    first; do not introduce clever/parallel/cached shortcuts before a
    profiler has shown they are needed.
12. **Before ending a work session, run and report the real result
    of:** `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`
    (and `pnpm test:e2e` when relevant). Never report PASS for a
    command that did not actually pass.
13. **After every change to this repository, add an entry to
    `CHANGELOG.md`** (newest first) under today's date (`YYYY-MM-DD`,
    a new heading if today doesn't have one yet), briefly describing
    what changed and why. This applies to doc changes, roadmap
    updates, and code changes alike -- not only milestone completions.

## If a tuning value or mechanic is undecided

Use a configurable placeholder/default and mark it `TODO tuning`. Do
not invent a new mechanic to fill the gap -- flag it instead and, if it
genuinely blocks the milestone, stop and say so rather than guessing.
