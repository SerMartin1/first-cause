import { assertSafeInteger } from "./validation.js";

/**
 * Command boundary (Save/Determinism Spec SS26-28, SAVE-006): commands
 * are only ever drained and applied at a tick boundary, never mid-tick.
 * Two commands scheduled for the same tick get a stable, deterministic
 * relative order from a monotonic enqueue-time sequence -- never from
 * wall-clock or random ordering. See ADR-001 SS6.
 *
 * M1 ships the generic boundary only; concrete Command payload types
 * belong to the systems that need them (M3+).
 */
export interface QueuedCommand<TCommand> {
  readonly scheduledForTick: number;
  readonly sequence: number;
  readonly command: TCommand;
}

export interface CommandBoundaryState<TCommand> {
  readonly nextSequence: number;
  readonly queue: readonly QueuedCommand<TCommand>[];
}

export class CommandBoundary<TCommand> {
  private nextSequence: number;
  private queue: QueuedCommand<TCommand>[];

  constructor(state?: CommandBoundaryState<TCommand>) {
    this.nextSequence = state?.nextSequence ?? 0;
    this.queue = state ? [...state.queue] : [];
  }

  enqueue(scheduledForTick: number, command: TCommand): QueuedCommand<TCommand> {
    if (!Number.isInteger(scheduledForTick) || scheduledForTick < 0) {
      throw new RangeError(
        `CommandBoundary.enqueue: scheduledForTick must be a non-negative integer, got ${String(scheduledForTick)}`,
      );
    }
    const sequence = this.nextSequence;
    this.nextSequence = assertSafeInteger(
      this.nextSequence + 1,
      "CommandBoundary.nextSequence",
    );
    const entry: QueuedCommand<TCommand> = { scheduledForTick, sequence, command };
    this.queue.push(entry);
    return entry;
  }

  /**
   * Removes and returns every command scheduled for `tick`, ordered by
   * enqueue sequence (deterministic even if `enqueue` calls for the same
   * tick happened in a different relative order than their sequence
   * numbers would suggest -- it never does, but the sort makes the
   * guarantee explicit rather than relying on array insertion order).
   */
  drain(tick: number): QueuedCommand<TCommand>[] {
    const due: QueuedCommand<TCommand>[] = [];
    const remaining: QueuedCommand<TCommand>[] = [];
    for (const entry of this.queue) {
      if (entry.scheduledForTick === tick) {
        due.push(entry);
      } else {
        remaining.push(entry);
      }
    }
    due.sort((a, b) => a.sequence - b.sequence);
    this.queue = remaining;
    return due;
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  getState(): CommandBoundaryState<TCommand> {
    return { nextSequence: this.nextSequence, queue: [...this.queue] };
  }
}

export function createCommandBoundary<TCommand>(): CommandBoundary<TCommand> {
  return new CommandBoundary<TCommand>();
}
