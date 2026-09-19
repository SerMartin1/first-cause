import type {
  ArchitectInterventionTarget,
  Connection,
  Region,
  WorldState,
} from "@first-cause/entities";
import { setDomainKnowledge } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { discoverDeposit } from "../resources/deposit-lifecycle.js";
import { clamp } from "../economy/company-ai/decision-framework.js";

/**
 * Effect handlery VS-INT-01..05 (`architect/interventions`, M16,
 * Architect Intervention & Influence Spec SS181 "Effect Handler: każdy
 * typ interwencji ma jawny handler zmieniający tylko dozwolone pola").
 * Kluczowane po `definitionId` -- zamknięta taksonomia 5 kanonicznych VS
 * interwencji (ARCH-006), nie per-instancyjny branch w generycznym
 * systemie (AGENTS.md reguła 8: to samo uzasadnienie co
 * `INDUSTRY_BY_SECTOR` w UI-F1's `region-visual-profile-read-model.ts`).
 * Nowa interwencja = nowy handler + wpis w `INTERVENTION_EFFECT_HANDLERS`
 * (SS180 "Content Extension"), nie przebudowa tego modułu.
 */
export interface InterventionEffectContext {
  readonly state: WorldState;
  readonly target: ArchitectInterventionTarget;
  readonly parameters: Readonly<Record<string, number>>;
  readonly tick: number;
}

export interface InterventionEffectResult {
  readonly worldState: WorldState;
  readonly facts: readonly FactInput[];
}

export interface InterventionEffectHandler {
  /** Błędy specyficzne dla TEGO typu (istnienie targetu, jego kształt) -- allowedScopes/parameter min-max/Influence/cooldown to `validation.ts`, nie tutaj. */
  readonly validateTarget: (
    state: WorldState,
    target: ArchitectInterventionTarget,
  ) => readonly string[];
  readonly apply: (context: InterventionEffectContext) => InterventionEffectResult;
}

function requireRegion(state: WorldState, target: ArchitectInterventionTarget): Region | undefined {
  const regionId = target.entityIds[0];
  return regionId ? state.regions[regionId] : undefined;
}

const revealResourceDeposit: InterventionEffectHandler = {
  validateTarget(state, target) {
    const depositId = target.entityIds[0];
    if (!depositId || !state.resourceDeposits[depositId]) {
      return [`ResourceDeposit "${String(depositId)}" does not exist`];
    }
    return [];
  },
  apply({ state, target, tick }) {
    const depositId = target.entityIds[0]!;
    const deposit = state.resourceDeposits[depositId]!;
    const { deposit: nextDeposit, facts: naturalFacts } = discoverDeposit(deposit, {
      tick,
      targetStatus: "DISCOVERED",
      discoveredByEntityId: "architect",
      confidence: 1,
    });
    // ARCH-007: interwencja MUSI utworzyć Root Fact nawet, gdy złoże było
    // już DISCOVERED/ASSESSED wcześniej -- `discoverDeposit` samo w sobie
    // (M5, dzielone z naturalnym odkryciem) w takim przypadku nic nie
    // zwraca, więc tu dokładamy fallback zamiast zmieniać tę współdzieloną
    // funkcję pod jednego wołającego.
    const facts: readonly FactInput[] =
      naturalFacts.length > 0
        ? naturalFacts
        : [
            {
              type: "resource_discovered",
              subject: { entityType: "resourceDeposit", entityId: depositId },
              location: { regionId: deposit.regionId },
              values: { before: deposit.discovery.status, after: deposit.discovery.status },
            },
          ];

    return {
      worldState: {
        ...state,
        resourceDeposits: { ...state.resourceDeposits, [depositId]: nextDeposit },
      },
      facts,
    };
  },
};

const fertilityShift: InterventionEffectHandler = {
  validateTarget(state, target) {
    return requireRegion(state, target) ? [] : [`Region "${target.entityIds[0]}" does not exist`];
  },
  apply({ state, target, parameters }) {
    const region = requireRegion(state, target)!;
    const before = region.geography.fertility;
    const after = clamp(before + (parameters.magnitude ?? 0), 0, 1);
    const nextRegion: Region = {
      ...region,
      geography: { ...region.geography, fertility: after },
    };

    // ARCH-007: zawsze dokładnie jeden fakt, nawet gdy clamp zniwelował
    // efekt do zera -- interwencja gracza jest realnym wydarzeniem, nie
    // podlega temu samemu "pomiń zerową deltę" co autonomiczna akumulacja
    // per-tick (`technology/knowledge.ts`).
    const facts: readonly FactInput[] = [
      {
        type: "region_fertility_shifted",
        subject: { entityType: "region", entityId: region.id },
        location: { regionId: region.id },
        values: { before, after, delta: after - before },
      },
    ];

    return {
      worldState: { ...state, regions: { ...state.regions, [region.id]: nextRegion } },
      facts,
    };
  },
};

const knowledgeInjection: InterventionEffectHandler = {
  validateTarget(state, target) {
    const [regionId, domainId] = target.entityIds;
    const region = regionId ? state.regions[regionId] : undefined;
    if (!region) return [`Region "${String(regionId)}" does not exist`];
    if (!domainId) return ["Knowledge Injection requires a knowledge domain id"];
    const technologyStateId = region.knowledge.technologyStateId;
    if (!technologyStateId || !state.technologyStates[technologyStateId]) {
      return [`Region "${region.id}" has no TechnologyState to inject knowledge into`];
    }
    return [];
  },
  apply({ state, target, parameters }) {
    const [regionId, domainId] = target.entityIds as [string, string];
    const region = state.regions[regionId]!;
    const technologyState = state.technologyStates[region.knowledge.technologyStateId!]!;
    const before = technologyState.knowledge[domainId] ?? 0;
    const after = clamp(before + Math.abs(parameters.magnitude ?? 0), 0, 100);
    const nextTechnologyState = setDomainKnowledge(technologyState, domainId, after);

    // ARCH-007: patrz komentarz w `fertilityShift` powyżej.
    const facts: readonly FactInput[] = [
      {
        type: "knowledge_increased",
        subject: { entityType: "knowledge_domain", entityId: domainId },
        location: { regionId: region.id },
        values: { before, after, delta: after - before },
      },
    ];

    return {
      worldState: {
        ...state,
        technologyStates: {
          ...state.technologyStates,
          [technologyState.id]: nextTechnologyState,
        },
      },
      facts,
    };
  },
};

const tradeFrictionShift: InterventionEffectHandler = {
  validateTarget(state, target) {
    const connectionId = target.entityIds[0];
    if (!connectionId || !state.connections[connectionId]) {
      return [`Connection "${String(connectionId)}" does not exist`];
    }
    return [];
  },
  apply({ state, target, parameters }) {
    const connectionId = target.entityIds[0]!;
    const connection = state.connections[connectionId]!;
    const before = connection.friction.borderFriction;
    const after = Math.max(0, before + (parameters.magnitude ?? 0));
    const nextConnection: Connection = {
      ...connection,
      friction: { ...connection.friction, borderFriction: after },
    };

    // ARCH-007: patrz komentarz w `fertilityShift` powyżej.
    const facts: readonly FactInput[] = [
      {
        type: "trade_friction_shifted",
        subject: { entityType: "connection", entityId: connection.id },
        location: { regionId: connection.regionAId },
        values: { before, after, delta: after - before },
      },
    ];

    return {
      worldState: {
        ...state,
        connections: { ...state.connections, [connectionId]: nextConnection },
      },
      facts,
    };
  },
};

/**
 * VS Instant-only (SS7): brak modelu Sustained/tymczasowego czasu trwania
 * na dziś, więc "temporary drought" (SS161) jest tu jednorazowym,
 * natychmiastowym skokiem `environment.waterStress` -- pełny czasowy
 * dryf wymaga Duration/Sustained, poza zakresem M16 (TODO: przyszły
 * milestone, jeśli Sustained interventions wejdą do zakresu).
 */
const environmentalShock: InterventionEffectHandler = {
  validateTarget(state, target) {
    return requireRegion(state, target) ? [] : [`Region "${target.entityIds[0]}" does not exist`];
  },
  apply({ state, target, parameters }) {
    const region = requireRegion(state, target)!;
    const before = region.environment.waterStress;
    const after = clamp(before + Math.abs(parameters.magnitude ?? 0), 0, 1);
    const nextRegion: Region = {
      ...region,
      environment: { ...region.environment, waterStress: after },
    };

    // ARCH-007: patrz komentarz w `fertilityShift` powyżej.
    const facts: readonly FactInput[] = [
      {
        type: "environmental_shock_applied",
        subject: { entityType: "region", entityId: region.id },
        location: { regionId: region.id },
        values: { before, after, delta: after - before },
      },
    ];

    return {
      worldState: { ...state, regions: { ...state.regions, [region.id]: nextRegion } },
      facts,
    };
  },
};

export const INTERVENTION_EFFECT_HANDLERS: Readonly<
  Record<string, InterventionEffectHandler>
> = {
  reveal_resource_deposit: revealResourceDeposit,
  fertility_shift: fertilityShift,
  knowledge_injection: knowledgeInjection,
  trade_friction_shift: tradeFrictionShift,
  environmental_shock: environmentalShock,
};
