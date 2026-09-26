import type { TechnologyState } from "@first-cause/entities";
import { setDomainKnowledge } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import type { RngStream } from "../../core/rng.js";
import { clamp } from "../economy/company-ai/decision-framework.js";
import { stochasticRound } from "../population/demography.js";
import { TIER_KNOWLEDGE_THRESHOLD_TODO_TUNING } from "./discoveries.js";

/**
 * Regionalna akumulacja wiedzy (`technology/knowledge`, M15, AI Decision
 * Model §62: Discovery Engine czyta "Knowledge" jako pierwsze wejście).
 * `KNOWLEDGE_GAIN_TODO_TUNING`: jedynym kanonicznie dostępnym wejściem na
 * tym etapie jest populacja (Simulation Model §14.1 wymienia też industry
 * concentration/specjalistów/edukację, ale te wymagają mapowań
 * domena<->archetyp, których warstwa contentu jeszcze nie ma -- świadomie
 * odłożone, nie wymyślone, AGENTS.md "configurable placeholder + TODO
 * tuning").
 *
 * Model tempa (decyzja właściciela 2026-09-26, wariant B + „trudniejsze
 * wyższe tiery”): `gain = rate · (p / pRef)^0.5 · (1 − K/100)` na domenę
 * na tick. Pierwiastek: wiedza rośnie z liczbą możliwych wymian między
 * ludźmi, mniej niż liniowo; pusty region nie zdobywa wiedzy. Czynnik
 * `(1 − K/100)`: malejący przyrost -- każdy kolejny punkt wiedzy jest
 * trudniejszy. Parametry skalibrowane benchmarkiem pod zaakceptowane pasma
 * docelowe (Roadmap v0.6, „Technology pacing”); OPEN-004 (TODO tuning).
 */
export const KNOWLEDGE_GAIN_TODO_TUNING = {
  ratePerTickAtReference: 0.0283,
  referencePopulation: 20_000,
  populationExponent: 0.5,
} as const;

/** Czysta funkcja przyrostu wiedzy jednej domeny w jednym ticku (przed zaokrągleniem stochastycznym). */
export function knowledgeGainPerTick(population: number, knowledge: number): number {
  if (!(population > 0)) return 0;
  const scale = Math.pow(
    population / KNOWLEDGE_GAIN_TODO_TUNING.referencePopulation,
    KNOWLEDGE_GAIN_TODO_TUNING.populationExponent,
  );
  const remaining = clamp(1 - knowledge / 100, 0, 1);
  return KNOWLEDGE_GAIN_TODO_TUNING.ratePerTickAtReference * scale * remaining;
}

export interface AccumulateRegionalKnowledgeInput {
  readonly technologyState: TechnologyState;
  readonly domainIds: readonly string[];
  readonly population: number;
  readonly rng: RngStream;
}

export interface AccumulateRegionalKnowledgeResult {
  readonly technologyState: TechnologyState;
  readonly facts: readonly FactInput<number>[];
}

/**
 * READ (`technologyState`/`population`/`domainIds`) -> CALCULATE (przyrost
 * per domena) -> VALIDATE (clamp 0..100) -> COMMIT (`setDomainKnowledge`)
 * -> EMIT FACTS (`knowledge_increased` wyłącznie przy przekroczeniu progu
 * tieru -- Causality Engine §7 „Fact Granularity”: zwykły przyrost wiedzy
 * nie jest zdarzeniem; zdarzeniem jest zmiana tego, co region może odkryć.
 * Decyzja właściciela 2026-09-26).
 */
export function accumulateRegionalKnowledge(
  input: AccumulateRegionalKnowledgeInput,
): AccumulateRegionalKnowledgeResult {
  const { population, rng } = input;
  let technologyState = input.technologyState;
  const facts: FactInput<number>[] = [];

  for (const domainId of [...input.domainIds].sort()) {
    const before = technologyState.knowledge[domainId] ?? 0;
    const gain = knowledgeGainPerTick(population, before);
    const after = clamp(before + stochasticRound(gain, rng), 0, 100);

    if (after === before) continue;

    technologyState = setDomainKnowledge(technologyState, domainId, after);
    const crossesTierThreshold = TIER_KNOWLEDGE_THRESHOLD_TODO_TUNING.some(
      (threshold) => threshold > 0 && before < threshold && after >= threshold,
    );
    if (!crossesTierThreshold) continue;
    facts.push({
      type: "knowledge_increased",
      subject: { entityType: "knowledge_domain", entityId: domainId },
      location: { regionId: technologyState.regionId },
      values: { before, after, delta: after - before },
    });
  }

  return { technologyState, facts };
}
