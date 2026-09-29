import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useTranslation } from "react-i18next";
import {
  selectWorldAnalysis,
  type WorldView,
  type WorldWhyView,
  type WorldWhyContext,
} from "@first-cause/simulation";
import {
  FCSection,
  FCMetric,
  FCTextButton,
  FCTabs,
  FCRegionVignette,
} from "../../components/fc/index.js";
import { FCLivingAtlas } from "./FCLivingAtlas.js";
import {
  MAP_MODES,
  OVERLAYS,
  MODE_METRICS,
  CHANGE_METRICS,
  type ChangeMetric,
  type FlowLens,
} from "./atlas-model.js";
import { regionPopulationFact } from "./population-mode.js";
import { useWorldStore } from "./world-store.js";
import "./world.css";

export function WorldScreen() {
  const { t, i18n } = useTranslation();
  const ui = useWorldStore();
  const [view, setView] = useState<WorldView>();
  const [why, setWhy] = useState<WorldWhyView>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [regionTab, setRegionTab] = useState("overview");
  const [details, setDetails] = useState(false);
  // Moduły wspierające startują zwinięte: pierwszy ekran należy do Atlasu (§26.3 G, §19).
  const [openModules, setOpenModules] = useState<readonly string[]>([]);
  const whyModule = useRef<HTMLDetailsElement>(null);
  const sequence = useRef(0);
  const whySequence = useRef(0);
  useEffect(() => {
    // Nowe wyjaśnienie WHY? nie może zostać ukryte w zwiniętym module.
    if (!why) return;
    setOpenModules((current) =>
      current.includes("why") ? current : [...current, "why"],
    );
    whyModule.current?.scrollIntoView?.({ block: "nearest" });
  }, [why]);
  useEffect(() => {
    useWorldStore.getState().set({ analysisScope: { kind: "WORLD" } });
  }, []);
  useEffect(() => {
    if (
      view &&
      ui.analysisScope.kind === "REGION" &&
      !view.current.regions.some((r) => r.regionId === ui.selectedEntityId)
    )
      ui.set({ analysisScope: { kind: "WORLD" } });
  }, [view, ui]);
  useEffect(() => {
    setWhy(undefined);
  }, [ui.analysisScope, ui.timelineCursor, ui.comparisonWindow]);
  const refresh = useCallback(async () => {
    const requestId = ++sequence.current;
    try {
      const result = await window.firstCauseWorld.getWorld(
        ui.comparisonWindow,
        ui.timelineCursor,
      );
      if (requestId === sequence.current) {
        setView(result);
        setError(undefined);
      }
    } catch (e) {
      if (requestId === sequence.current) setError(String(e));
    }
  }, [ui.comparisonWindow, ui.timelineCursor]);
  useEffect(() => {
    let stopped = false;
    const requestSequence = sequence;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await refresh();
      if (!stopped) timer = setTimeout(() => void poll(), 1000);
    };
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
      requestSequence.current++;
    };
  }, [refresh]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (details) setDetails(false);
        else if (ui.focusMode) ui.set({ focusMode: false });
        else {
          ui.set({
            selectedEntityId: undefined,
            selectedEventId: undefined,
            flowLens: "off",
          });
          setWhy(undefined);
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [details, ui]);
  async function command(action: () => Promise<WorldView>) {
    setBusy(true);
    try {
      await action();
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function explain(factId: string, context?: WorldWhyContext) {
    const id = ++whySequence.current;
    const handoff = context ?? {
      scope: ui.analysisScope,
      itemId: factId,
      itemKind: "cause" as const,
    };
    const cursor = ui.timelineCursor;
    const isCurrent = () => {
      const latest = useWorldStore.getState();
      return (
        id === whySequence.current &&
        latest.timelineCursor === cursor &&
        JSON.stringify(latest.analysisScope) === JSON.stringify(handoff.scope)
      );
    };
    try {
      const result = await window.firstCauseWorld.explain(
        factId,
        ui.timelineCursor ?? view?.current.summary.currentTick,
        handoff,
      );
      if (isCurrent()) setWhy(result);
    } catch (e) {
      if (isCurrent()) setError(String(e));
    }
  }
  if (!view)
    return (
      <FCSection title={t("nav.world")}>
        <p role={error ? "alert" : "status"}>{error ?? t("world.loading")}</p>
        {error && (
          <FCTextButton onClick={() => void refresh()}>{t("world.retry")}</FCTextButton>
        )}
      </FCSection>
    );
  const snapshot = view.current;
  const region = snapshot.regions.find((r) => r.regionId === ui.selectedEntityId);
  const scope =
    ui.analysisScope.kind === "REGION" && !region
      ? { kind: "WORLD" as const }
      : ui.analysisScope;
  const analysis = selectWorldAnalysis(snapshot, scope, ui.comparisonWindow);
  const format = (value: number) =>
    new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(value);
  // R4: pełna liczba w inspektorze; brak danych ≠ 0 (nigdy „NaN” ani „0”).
  const formatRegionPopulation = (r: (typeof snapshot.regions)[number]) => {
    const fact = regionPopulationFact(r);
    return fact.kind === "known" ? format(fact.value) : t("world.population.noDataLabel");
  };
  const resources = [
    ...new Set(
      snapshot.regions.flatMap((r) => r.deposits.map((d) => d.resourceDefinitionId)),
    ),
  ].sort();
  const discoveries = [
    ...new Set(
      snapshot.regions.flatMap((r) => Object.keys(r.technology?.discoveries ?? {})),
    ),
  ].sort();
  const resourceId = ui.resourceId || resources[0] || "";
  const discoveryId = ui.discoveryId || discoveries[0] || "";
  const context = {
    ...(view.baseline ? { baseline: view.baseline } : {}),
    resourceId,
    discoveryId,
    changeMetric: ui.changeMetric,
  };
  const historyMissing = !view.baseline;
  const selectedEvent = view.events.find((e) => e.id === ui.selectedEventId);
  const eventTitle = (event: WorldView["events"][number]) =>
    t(`content.eventType.${event.eventType}.name`, {
      defaultValue: event.eventType.replaceAll("_", " "),
    });
  const factTitle = (type: string) =>
    t(`content.eventType.${type}.name`, {
      defaultValue: t(`world.fact.${type}`, { defaultValue: type.replaceAll("_", " ") }),
    });
  const rankByPopulation = ui.mapMode === "population" || ui.mapMode === "terrain";
  const rankValue = (r: (typeof snapshot.regions)[number]) =>
    MODE_METRICS[rankByPopulation ? "population" : ui.mapMode](r, snapshot, context);
  const ranking = snapshot.regions
    .filter((r) => rankValue(r) !== undefined)
    .sort((a, b) => (rankValue(b) ?? 0) - (rankValue(a) ?? 0));
  const recentEvents = view.events
    .filter((e) => e.endTick >= snapshot.summary.currentTick - ui.comparisonWindow * 12)
    .slice(0, 6);
  const focusEvent = (event: WorldView["events"][number]) => {
    ui.set({
      selectedEventId: event.id,
      selectedEntityId: event.regionRefs[0],
      focusMode: true,
      mapMode:
        event.category === "technology"
          ? "technology"
          : event.category === "resources"
            ? "resources"
            : ui.mapMode,
    });
    setWhy(undefined);
    if (event.primaryFactRefs[0])
      void explain(event.primaryFactRefs[0], {
        scope: useWorldStore.getState().analysisScope,
        itemKind: "event",
        itemId: event.id,
        ...(event.regionRefs[0] ? { regionId: event.regionRefs[0] } : {}),
      });
  };
  const target = why?.facts.find((f) => f.id === why.explanation.target);
  const causes = why
    ? [
        ...why.explanation.primaryCauses,
        ...why.explanation.significantCauses,
        ...why.explanation.limitingFactors,
      ]
    : [];
  // World Pulse: istniejące agregaty Read Modelu; zmiana liczona względem okna porównania.
  const pulse = (
    [
      ["population", t("world.population"), (w) => w.summary.totalPopulation],
      [
        "production",
        t("world.production"),
        (w) => w.regions.reduce((sum, r) => sum + r.production, 0),
      ],
      ["companies", t("world.activeCompanies"), (w) => w.summary.activeCompanyCount],
      ["settlements", t("world.settlements"), (w) => w.summary.settlementCount],
    ] as const satisfies readonly (readonly [
      string,
      string,
      (world: WorldView["current"]) => number,
    ])[]
  ).map(([id, label, value]) => ({
    id,
    label,
    current: value(snapshot),
    delta: view.baseline ? value(snapshot) - value(view.baseline) : undefined,
  }));
  const signed = (value: number) => `${value > 0 ? "+" : ""}${format(value)}`;
  const moduleProps = (id: string) => ({
    open: openModules.includes(id),
    onToggle: (open: boolean) =>
      setOpenModules((current) =>
        open ? [...current.filter((m) => m !== id), id] : current.filter((m) => m !== id),
      ),
  });
  return (
    <div className="fc-world" data-testid="world-screen">
      <div className="fc-world__stage">
        <header className="fc-world__bar" aria-label={t("world.time")}>
          <div className="fc-world__clock">
            <strong title={snapshot.summary.worldName}>
              {snapshot.summary.worldName}
            </strong>
            <span className="fc-data">
              {t("world.year", { year: snapshot.summary.currentDate.year })} ·{" "}
              {t("world.month", { month: snapshot.summary.currentDate.month })} ·{" "}
              {t("world.tickCount", { tick: snapshot.summary.currentTick })}
              {ui.timelineCursor !== undefined && ` · ${t("world.historical")}`}
            </span>
          </div>
          <dl
            className="fc-world__pulse"
            aria-label={t("world.pulse")}
            title={t("world.comparison", { years: ui.comparisonWindow })}
          >
            {pulse.map((metric) => (
              <div key={metric.id}>
                <dt>{metric.label}</dt>
                <dd>
                  <span className="fc-data">{format(metric.current)}</span>{" "}
                  <span
                    className={`fc-data fc-world__delta${
                      metric.delta === undefined || metric.delta === 0
                        ? ""
                        : metric.delta > 0
                          ? " fc-world__delta--up"
                          : " fc-world__delta--down"
                    }`}
                  >
                    {metric.delta === undefined ? "Δ —" : signed(metric.delta)}
                  </span>
                </dd>
              </div>
            ))}
            <span className="fc-caption">
              {t("world.pulseWindow", { years: ui.comparisonWindow })}
            </span>
          </dl>
          <div className="fc-world__speed" role="group" aria-label={t("world.speed")}>
            {[0, 1, 2, 4, 10, 100].map((speed) => (
              <button
                key={speed}
                disabled={busy || ui.timelineCursor !== undefined}
                aria-pressed={view.speed === speed}
                onClick={() => void command(() => window.firstCauseWorld.setSpeed(speed))}
              >
                {speed === 0 ? t("world.pause") : `×${speed}`}
              </button>
            ))}
            <button
              disabled={busy || ui.timelineCursor !== undefined}
              onClick={() => void command(() => window.firstCauseWorld.step(12))}
            >
              {t("world.advanceYear")}
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
        </header>
        <section className="fc-world__atlas" aria-label={t("world.atlas")}>
          <div className="fc-world__atlas-toolbar">
            <FCTabs
              aria-label={t("world.mapMode")}
              activeId={ui.mapMode}
              onChange={(id) =>
                ui.set({
                  mapMode: id as typeof ui.mapMode,
                  resourceId,
                  discoveryId,
                  flowLens: id === "trade" ? "trade" : "off",
                })
              }
              tabs={MAP_MODES.map((id) => ({
                id,
                label: t(`world.mode.${id}`),
                disabled: id === "political",
              }))}
            />
            <div className="fc-world__atlas-tools">
              <label>
                {t("world.window")}{" "}
                <select
                  value={ui.comparisonWindow}
                  onChange={(e) => ui.set({ comparisonWindow: Number(e.target.value) })}
                >
                  {[1, 5, 10, 25, 50].map((year) => (
                    <option key={year} value={year}>
                      {year}Y
                    </option>
                  ))}
                </select>
              </label>
              {ui.mapMode === "change" && (
                <label>
                  {t("world.changeMetric")}{" "}
                  <select
                    aria-label={t("world.changeMetric")}
                    value={ui.changeMetric}
                    onChange={(e) =>
                      ui.set({ changeMetric: e.target.value as ChangeMetric })
                    }
                  >
                    {CHANGE_METRICS.map((id) => (
                      <option key={id} value={id}>
                        {t(`world.change.${id}`)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {(ui.mapMode === "resources" ||
                (ui.mapMode === "change" && ui.changeMetric === "resources")) && (
                <label>
                  {t("world.resource")}{" "}
                  <select
                    aria-label={t("world.resource")}
                    value={resourceId}
                    onChange={(e) => ui.set({ resourceId: e.target.value })}
                  >
                    {resources.map((id) => (
                      <option key={id} value={id}>
                        {t(`content.resource.${id}.name`)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {(ui.mapMode === "technology" ||
                (ui.mapMode === "change" && ui.changeMetric === "technology")) && (
                <label>
                  {t("world.discovery")}{" "}
                  <select
                    aria-label={t("world.discovery")}
                    value={discoveryId}
                    onChange={(e) => ui.set({ discoveryId: e.target.value })}
                  >
                    {discoveries.map((id) => (
                      <option key={id} value={id}>
                        {t(`content.discovery.${id}.name`)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                {t("world.flowLens")}{" "}
                <select
                  value={ui.flowLens}
                  onChange={(e) => ui.set({ flowLens: e.target.value as FlowLens })}
                >
                  {["off", "trade", "migration", "technology"].map((id) => (
                    <option key={id} value={id} disabled={id === "migration"}>
                      {t(`world.flow.${id}`)}
                    </option>
                  ))}
                </select>
              </label>
              {ui.flowLens !== "off" && (
                <select
                  aria-label={t("world.flowLimit")}
                  value={ui.flowLimit}
                  onChange={(e) => ui.set({ flowLimit: Number(e.target.value) })}
                >
                  <option value={3}>Top 3</option>
                  <option value={5}>Top 5</option>
                  <option value={999999}>{t("world.all")}</option>
                </select>
              )}
              <details className="fc-world__overlays">
                <summary>{t("world.overlays")}</summary>
                <div>
                  {OVERLAYS.map((overlay) => (
                    <label key={overlay}>
                      <input
                        type="checkbox"
                        checked={ui.overlays.includes(overlay)}
                        disabled={["borders", "rivers", "railways"].includes(overlay)}
                        onChange={() =>
                          ui.set({
                            overlays: ui.overlays.includes(overlay)
                              ? ui.overlays.filter((o) => o !== overlay)
                              : [...ui.overlays, overlay],
                          })
                        }
                      />
                      {t(`world.overlay.${overlay}`)}
                    </label>
                  ))}
                  <p>{t("world.noGeometry")}</p>
                </div>
              </details>
              <label className="fc-world__region-picker">
                {t("world.selectRegion")}{" "}
                <select
                  value={ui.selectedEntityId ?? ""}
                  onChange={(e) => {
                    ui.set({
                      selectedEntityId: e.target.value || undefined,
                      selectedEventId: undefined,
                      focusMode: false,
                    });
                    setWhy(undefined);
                  }}
                >
                  <option value="">{t("world.selectRegion")}</option>
                  {snapshot.regions.map((r) => (
                    <option key={r.regionId} value={r.regionId}>
                      {r.name} · {formatRegionPopulation(r)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <FCLivingAtlas
            view={view}
            resourceId={resourceId}
            discoveryId={discoveryId}
            caption={
              <p className="fc-world__mode-caption">
                {t(`world.metric.${ui.mapMode}`)}
                {/* R4: Population pokazuje stan bieżący; historia dotyczy tylko Δ Change. */}
                {ui.mapMode === "change" && historyMissing
                  ? ` · ${t("world.historyMissing")}`
                  : ""}
                {ui.flowLens !== "off" &&
                  ` · ${
                    ui.flowLens === "technology"
                      ? t("world.diffusionSource")
                      : t("world.flowMagnitude")
                  }`}
              </p>
            }
          />
        </section>
        <aside className="fc-world__region" aria-label={t("world.inspector")}>
          <FCSection title={region?.name ?? t("world.selectedRegion")}>
            {!region ? (
              <p className="fc-world__empty">{t("world.selectPrompt")}</p>
            ) : (
              <>
                <p className="fc-caption">
                  {t(`world.terrain.${region.profile.terrain}`)}
                </p>
                <FCRegionVignette profile={region.profile} size="large" />
                <FCTabs
                  aria-label={t("world.regionTabs")}
                  activeId={regionTab}
                  onChange={setRegionTab}
                  tabs={[
                    "overview",
                    "economy",
                    "population",
                    "resources",
                    "connections",
                  ].map((id) => ({ id, label: t(`world.tab.${id}`) }))}
                />
                {(regionTab === "overview" || regionTab === "population") && (
                  <FCMetric
                    label={t("world.population")}
                    value={formatRegionPopulation(region)}
                  />
                )}
                {(regionTab === "overview" || regionTab === "economy") && (
                  <>
                    <FCMetric
                      label={t("world.production")}
                      value={format(region.production)}
                    />
                    <FCMetric
                      label={t("world.activeCompanies")}
                      value={format(region.companies)}
                    />
                  </>
                )}
                {(regionTab === "overview" || regionTab === "resources") && (
                  <div className="fc-world__rows">
                    {region.deposits.map((d) => (
                      <p key={d.depositId}>
                        <span>
                          {t(`content.resource.${d.resourceDefinitionId}.name`)}
                        </span>
                        <span className="fc-data">
                          {d.quantity === undefined
                            ? t("world.unknown")
                            : format(d.quantity)}
                        </span>
                      </p>
                    ))}
                  </div>
                )}
                {regionTab === "population" &&
                  region.settlements.map((s) => (
                    <FCMetric
                      key={s.settlementId}
                      label={s.name}
                      value={format(s.population)}
                    />
                  ))}
                {regionTab === "connections" &&
                  region.connectedRegionIds.map((id) => (
                    <FCTextButton
                      key={id}
                      onClick={() => ui.set({ selectedEntityId: id })}
                    >
                      {snapshot.regions.find((r) => r.regionId === id)?.name}
                    </FCTextButton>
                  ))}
                <div className="fc-world__inspector-actions">
                  <FCTextButton onClick={() => setDetails(!details)}>
                    {t("world.regionDetails")}
                  </FCTextButton>
                  <FCTextButton
                    disabled={
                      !view.events.some((e) => e.regionRefs.includes(region.regionId))
                    }
                    onClick={() => {
                      const event = view.events.find((e) =>
                        e.regionRefs.includes(region.regionId),
                      );
                      if (event) focusEvent(event);
                    }}
                  >
                    WHY?
                  </FCTextButton>
                </div>
                {details && (
                  <div className="fc-world__detail">
                    <h3>{t("world.regionDetails")}</h3>
                    <FCMetric
                      label={t("world.housingPressure")}
                      value={format(region.housingPressure)}
                    />
                    <FCMetric
                      label={t("world.migrationAttraction")}
                      value={format(region.migrationAttraction)}
                    />
                    <FCMetric
                      label={t("world.infrastructure")}
                      value={format(region.infrastructure)}
                    />
                  </div>
                )}
              </>
            )}
          </FCSection>
          {region && (
            <FCSection title={t("world.keyProcesses")}>
              {region.latestExplainedChange && (
                <div className="fc-world__latest-change">
                  <span className="fc-caption">{t("world.latestExplainedChange")}</span>
                  <FCTextButton
                    onClick={() => {
                      if (region.latestExplainedChange)
                        void explain(region.latestExplainedChange.factId, {
                          scope,
                          itemKind: "region",
                          itemId: region.regionId,
                          regionId: region.regionId,
                        });
                    }}
                  >
                    {factTitle(region.latestExplainedChange.type)} · WHY?
                  </FCTextButton>
                </div>
              )}
              <FCMetric
                label={t("world.settlementPressure")}
                value={format(region.settlementPressure)}
              />
              <FCMetric
                label={t("world.migrationAttraction")}
                value={format(region.migrationAttraction)}
              />
              <FCMetric
                label={t("world.housingPressure")}
                value={format(region.housingPressure)}
              />
            </FCSection>
          )}
        </aside>
        <section className="fc-world__analysis" aria-label={t("world.analysis.label")}>
          <div
            className="fc-world__scope"
            role="group"
            aria-label={t("world.analysis.scope")}
          >
            <button
              aria-pressed={scope.kind === "WORLD"}
              onClick={() => ui.set({ analysisScope: { kind: "WORLD" } })}
            >
              {t("world.analysis.world")}
            </button>
            <span aria-hidden="true"> | </span>
            <button
              disabled={!region}
              aria-pressed={scope.kind === "REGION"}
              onClick={() =>
                region &&
                ui.set({ analysisScope: { kind: "REGION", regionId: region.regionId } })
              }
            >
              {region?.name ?? t("world.selectedRegion")}
            </button>
            <span className="fc-caption">
              {" "}
              · {t("world.tick", { tick: analysis.tick })} ·{" "}
              {t("world.comparison", { years: ui.comparisonWindow })}
            </span>
          </div>
          <div className="fc-world__analysis-modules">
            <section data-testid="analysis-causes" data-scope={scope.kind}>
              <FCSection title={t("world.analysis.causes")}>
                {analysis.causes.length === 0 && (
                  <p className="fc-caption">{t("world.noCauses")}</p>
                )}
                {analysis.causes.map((cause) => (
                  <div key={cause.id}>
                    <FCTextButton
                      onClick={() =>
                        void explain(cause.effectFactId, {
                          scope,
                          itemKind: "cause",
                          itemId: cause.id,
                          regionId: cause.effectRegionId,
                        })
                      }
                    >
                      {factTitle(cause.type)} ·{" "}
                      {
                        snapshot.regions.find((r) => r.regionId === cause.effectRegionId)
                          ?.name
                      }{" "}
                      · WHY?
                    </FCTextButton>
                    {cause.contribution < 0 && <small>{t("world.limiting")}</small>}
                  </div>
                ))}
              </FCSection>
            </section>
            <section data-testid="analysis-consequences" data-scope={scope.kind}>
              <FCSection title={t("world.analysis.consequences")}>
                <p className="fc-caption">{t("world.analysis.noForecast")}</p>
              </FCSection>
            </section>
            <section className="fc-world__quick-actions" data-testid="quick-actions">
              <FCSection title={t("world.analysis.actions")}>
                <FCTextButton onClick={() => ui.set({ focusMode: false, zoomLevel: 1 })}>
                  {t("world.analysis.worldView")}
                </FCTextButton>
                <FCTextButton
                  disabled={!region}
                  onClick={() => ui.set({ focusMode: true })}
                >
                  {t("world.showMap")}
                </FCTextButton>
                <FCTextButton disabled={!region} onClick={() => setDetails(true)}>
                  {t("world.analysis.details")}
                </FCTextButton>
                <FCTextButton
                  disabled={!region?.latestExplainedChange}
                  onClick={() =>
                    region?.latestExplainedChange &&
                    void explain(region.latestExplainedChange.factId, {
                      scope,
                      itemKind: "region",
                      itemId: region.regionId,
                      regionId: region.regionId,
                    })
                  }
                >
                  WHY?
                </FCTextButton>
              </FCSection>
            </section>
          </div>
        </section>
      </div>
      <div className="fc-world__support">
        <FCSupportModule
          className="fc-world__recent"
          title={t("world.recentEvents")}
          meta={String(recentEvents.length)}
          {...moduleProps("events")}
        >
          {recentEvents.length === 0 && (
            <p className="fc-caption">{t("world.noEvents")}</p>
          )}
          <ol className="fc-world__events">
            {recentEvents.map((event) => (
              <li key={event.id}>
                <button
                  aria-pressed={ui.selectedEventId === event.id}
                  onMouseEnter={() => ui.set({ hoveredRegionId: event.regionRefs[0] })}
                  onMouseLeave={() => ui.set({ hoveredRegionId: undefined })}
                  onFocus={() => ui.set({ hoveredRegionId: event.regionRefs[0] })}
                  onBlur={() => ui.set({ hoveredRegionId: undefined })}
                  onClick={() => focusEvent(event)}
                >
                  <span className="fc-data">
                    {t("world.tick", { tick: event.endTick })}
                  </span>
                  <strong>
                    {
                      snapshot.regions.find((r) => r.regionId === event.regionRefs[0])
                        ?.name
                    }
                  </strong>
                  {eventTitle(event)}
                  <small>
                    {t("world.significance")} {format(event.significance.total)}
                  </small>
                </button>
              </li>
            ))}
          </ol>
          {selectedEvent && (
            <FCTextButton onClick={() => focusEvent(selectedEvent)}>
              {t("world.focusEvent")}
            </FCTextButton>
          )}
        </FCSupportModule>
        <FCSupportModule
          className="fc-world__timeline"
          title={t("world.timeline")}
          meta={ui.timelineCursor === undefined ? t("world.live") : t("world.historical")}
          {...moduleProps("timeline")}
        >
          <label>
            {ui.timelineCursor === undefined ? t("world.live") : t("world.historical")} ·{" "}
            {t("world.tick", { tick: snapshot.summary.currentTick })}
            <input
              aria-label={t("world.timeline")}
              type="range"
              min={view.availableTicks[0] ?? 0}
              max={view.liveTick}
              value={snapshot.summary.currentTick}
              onChange={(e) => {
                const tick = Number(e.target.value);
                void command(async () => {
                  const result = await window.firstCauseWorld.setSpeed(0);
                  ui.set({ timelineCursor: tick, selectedEventId: undefined });
                  whySequence.current++;
                  setWhy(undefined);
                  return result;
                });
              }}
            />
          </label>
          <FCTextButton onClick={() => ui.set({ timelineCursor: undefined })}>
            {t("world.returnLive")}
          </FCTextButton>
          <div className="fc-world__timeline-events">
            {view.events.slice(0, 16).map((event) => (
              <button
                key={event.id}
                title={`${event.endTick}: ${eventTitle(event)}`}
                onClick={() => focusEvent(event)}
              >
                {event.endTick} · {eventTitle(event)}
              </button>
            ))}
          </div>
          <p className="fc-caption">{t("world.sessionHistory")}</p>
        </FCSupportModule>
        <FCSupportModule
          className="fc-world__why"
          title={t("world.why")}
          meta={target ? factTitle(target.type) : undefined}
          detailsRef={whyModule}
          {...moduleProps("why")}
        >
          {!why ? (
            <p>{t("world.whyPrompt")}</p>
          ) : (
            <>
              <strong>{target ? factTitle(target.type) : "WHY?"}</strong>
              {why.context && (
                <p className="fc-caption">
                  {why.context.scope.kind === "WORLD"
                    ? t("world.analysis.world")
                    : snapshot.regions.find(
                        (r) =>
                          r.regionId ===
                          (why.context!.scope.kind === "REGION"
                            ? why.context!.scope.regionId
                            : ""),
                      )?.name}{" "}
                  · {t("world.tick", { tick: why.tick })}
                </p>
              )}
              {causes.length === 0 && <p>{t("world.noCauses")}</p>}
              <div className="fc-world__causes">
                {causes.map((cause) => {
                  const fact = why.facts.find((f) => f.id === cause.factId);
                  return (
                    <div key={cause.edgeId}>
                      <button onClick={() => void explain(cause.factId)}>
                        {factTitle(cause.type)}
                      </button>
                      <small>
                        {cause.contribution < 0 ? t("world.limiting") : t("world.cause")}{" "}
                        · {t(`world.strength.${cause.band}`)}
                      </small>
                      {fact && (
                        <FCTextButton
                          onClick={() =>
                            ui.set({
                              selectedEntityId: fact.location.regionId,
                              focusMode: true,
                              causalLink: target
                                ? {
                                    from: fact.location.regionId,
                                    to: target.location.regionId,
                                  }
                                : undefined,
                            })
                          }
                        >
                          {t("world.showMap")}
                        </FCTextButton>
                      )}
                    </div>
                  );
                })}
              </div>
              <strong>{t("world.consequences")}</strong>
              {why.consequences.length === 0 && <p>{t("world.noConsequences")}</p>}
              {why.consequences.map((fact) => (
                <div key={fact.id}>
                  <FCTextButton onClick={() => void explain(fact.id)}>
                    {factTitle(fact.type)}
                  </FCTextButton>
                  <FCTextButton
                    onClick={() =>
                      ui.set({
                        selectedEntityId: fact.location.regionId,
                        focusMode: true,
                        causalLink: target
                          ? { from: target.location.regionId, to: fact.location.regionId }
                          : undefined,
                      })
                    }
                  >
                    {t("world.showMap")}
                  </FCTextButton>
                </div>
              ))}
            </>
          )}
        </FCSupportModule>
        <FCSupportModule
          className="fc-world__ranking"
          title={t("world.topRegions")}
          meta={t(`world.mode.${rankByPopulation ? "population" : ui.mapMode}`)}
          {...moduleProps("ranking")}
        >
          <ol>
            {ranking.slice(0, 5).map((r) => (
              <li key={r.regionId}>
                <FCTextButton
                  onClick={() =>
                    ui.set({ selectedEntityId: r.regionId, focusMode: true })
                  }
                >
                  {r.name}
                </FCTextButton>
                <span className="fc-data">{format(rankValue(r)!)}</span>
              </li>
            ))}
          </ol>
          {ranking.length === 0 && <p>{t("world.noData")}</p>}
        </FCSupportModule>
      </div>
    </div>
  );
}

/**
 * Moduł wspierający (Golden UI World v1.3 §26.3 G): zwijany nagłówek; treść
 * rozwija się pod pierwszym ekranem, więc nie odbiera Atlasowi wysokości.
 */
function FCSupportModule({
  title,
  meta,
  className,
  open,
  onToggle,
  detailsRef,
  children,
}: {
  readonly title: string;
  readonly meta?: string | undefined;
  readonly className: string;
  readonly open: boolean;
  readonly onToggle: (open: boolean) => void;
  readonly detailsRef?: RefObject<HTMLDetailsElement>;
  readonly children: ReactNode;
}) {
  return (
    <details
      ref={detailsRef}
      className={`fc-world__module ${className}`}
      open={open}
      onToggle={(event) => {
        if (event.currentTarget.open !== open) onToggle(event.currentTarget.open);
      }}
    >
      <summary>
        <h2 className="fc-section-title">{title}</h2>
        {meta && <span className="fc-caption">{meta}</span>}
      </summary>
      <div className="fc-world__module-body">{children}</div>
    </details>
  );
}
