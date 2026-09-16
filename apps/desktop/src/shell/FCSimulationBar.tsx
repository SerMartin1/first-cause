export type WorkerConnectionState = "connecting" | "online" | "offline";

export interface FCSimulationBarProps {
  readonly workerState: WorkerConnectionState;
  readonly workerStatusLabel: string;
  readonly engineVersion?: string;
}

/**
 * FCSimulationBar (UI Visual Design System v1.0 SS49.2). Shows only
 * real, currently-available state (Simulation Worker connection +
 * engine version) -- no tick/date/speed controls yet: no continuously
 * running tick loop is wired into the desktop app until a real system
 * drives one (M5+ economic systems still run headless/under test only,
 * `packages/simulation`'s `HeadlessRunner`). Adding those controls now
 * would mean UI that looks functional but is not (Visual Design System
 * SS2.1 "Information before decoration").
 */
export function FCSimulationBar({
  workerState,
  workerStatusLabel,
  engineVersion,
}: FCSimulationBarProps) {
  return (
    <div className={`fc-simulation-bar fc-simulation-bar--${workerState}`}>
      <span className="fc-simulation-bar__status fc-label" data-testid="worker-status">
        {workerStatusLabel}
      </span>
      {engineVersion ? (
        <span className="fc-simulation-bar__version fc-caption">{engineVersion}</span>
      ) : null}
    </div>
  );
}
