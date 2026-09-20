import type { CausalEdgeType, CausalFactor } from "@first-cause/causality";

/**
 * `PendingCausalLink` (M17 plumbing): tick-lokalny towarzysz `FactInput`,
 * który pozwala systemowi zadeklarować "ten nowy fakt był spowodowany
 * tym innym faktem" BEZ potrzeby realnego `SimulationFact.id` -- `FactStore.
 * emit` przydziela je tylko wtedy, gdy `WorldRunner.step()`
 * (`core/world-runner.ts`) faktycznie zacommituje tablicę `facts` tego
 * ticka. Trzymane całkowicie osobno od `FactInput`/`SimulationFact`
 * (nigdy pole na żadnym z nich): `FactStore` jest append-only, a fakt z
 * TEGO ticka nie ma jeszcze id w momencie, gdy system go dopisuje, więc
 * wbudowanie `causes` prosto na fakcie (jak sugeruje minimalny model
 * SS4 Causality Engine Spec) wymagałoby mutacji już wyemitowanego
 * faktu -- dokładnie tego, czego własny doc comment `FactStore` mówi,
 * że fakt nigdy nie może zrobić. `CausalEdge` (własny obiekt,
 * `@first-cause/causality`) to miejsce, gdzie kończy ROZWIĄZANY, realny
 * link (`core/causal-resolution.ts`).
 */
export type PendingCausalSource =
  | { readonly kind: "sameBatch"; readonly index: number }
  | { readonly kind: "priorFact"; readonly factId: string }
  | { readonly kind: "external"; readonly key: string };

export interface PendingCausalLink {
  /** Index w tablicy `facts`, którą zbudował system produkujący ten link (PRZED jakimkolwiek zewnętrznym przesunięciem -- patrz `offsetCausalLinks`). */
  readonly targetIndex: number;
  readonly source: PendingCausalSource;
  readonly type: CausalEdgeType;
  readonly factor: CausalFactor;
  /** Czytelny mechanizm -- staje się `CausalEdge.mechanism` (CAUS-003: edge istnieje tylko dlatego, że system, który zna PRZYCZYNĘ, go stworzył). */
  readonly mechanism: string;
  /** Nazwa systemu produkującego -- staje się `CausalEdge.system`. */
  readonly system: string;
}

/**
 * Podsystem (np. `updateMarketGood`) buduje WŁASNE, małe tablice
 * `facts`/`causalLinks` z `targetIndex`/`sameBatch.index` względne do
 * JEGO WŁASNEJ tablicy. Wywołujący, który scala tę tablicę do większej
 * (np. `economy-tick.ts`'s tablica `facts` per region) musi przesunąć
 * każdy index o to, ile faktów już go poprzedzało -- to jest właśnie
 * to przesunięcie, zastosowane jednolicie, żeby żadne miejsce wywołania
 * nie musiało ręcznie liczyć arytmetyki.
 */
export function offsetCausalLinks(
  links: readonly PendingCausalLink[],
  baseIndex: number,
): readonly PendingCausalLink[] {
  if (baseIndex === 0) return links;
  return links.map((link) => ({
    ...link,
    targetIndex: link.targetIndex + baseIndex,
    source:
      link.source.kind === "sameBatch"
        ? { kind: "sameBatch", index: link.source.index + baseIndex }
        : link.source,
  }));
}

/**
 * Znak `CausalFactor.contribution` to WŁASNY kierunkowy nacisk czynnika
 * (np. "popyt powyżej referencji podnosi cenę"), niezależny od tego, co
 * zrobił jakikolwiek INNY czynnik, czy jaki był efekt netto (własny
 * przykład Causality Engine Spec SS25: koszt mieszkania zostaje
 * czynnikiem DAMPENING -0.28 nawet w regionie, który ogólnie rośnie).
 * To mapuje ten znak na typ edge konsekwentnie w każdym systemie --
 * pozytywny = wspiera efekt, negatywny = działa przeciw niemu.
 */
export function directionalEdgeType(
  contribution: number,
  positive: CausalEdgeType = "CONTRIBUTING",
  negative: CausalEdgeType = "DAMPENING",
): CausalEdgeType {
  return contribution >= 0 ? positive : negative;
}
