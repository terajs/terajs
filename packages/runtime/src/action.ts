import { signal, type Signal } from "@terajs/reactivity";
import type { MutationQueue } from "./queue/mutationQueue.js";

export type ActionState = "idle" | "pending" | "success" | "error" | "queued";

export interface ActionQueueOptions {
  queue: MutationQueue;
  type?: string;
  maxRetries?: number;
  shouldQueue?: (error: unknown) => boolean;
}

export type QueuedActionResult<TResult> =
  | {
      status: "success";
      result: TResult;
    }
  | {
      status: "queued";
      mutationId: string;
      error: unknown;
    };

export interface Action<TArgs extends unknown[] = unknown[], TResult = unknown> {
  data: Signal<TResult | undefined>;
  error: Signal<unknown>;
  state: Signal<ActionState>;
  pending: () => boolean;
  latest: () => TResult | undefined;
  promise: () => Promise<TResult> | null;
  run: (...args: TArgs) => Promise<TResult>;
  runQueued: (queueOptions: ActionQueueOptions, ...args: TArgs) => Promise<QueuedActionResult<TResult>>;
  reset: () => void;
}

export interface ActionOptions<TResult> {
  id?: string;
  initialValue?: TResult;
  clearDataOnRun?: boolean;
}

/**
 * Creates an async action with reactive state tracking.
 *
 * Use actions for user-triggered mutations and request lifecycles where UI needs
 * consistent access to pending/success/error/queued state.
 *
 * @typeParam TArgs Argument tuple accepted by the action handler.
 * @typeParam TResult Resolved return type of the action handler.
 * @param handler Action implementation invoked by `run`.
 * @param options Optional action identity and initial-state configuration.
 * @returns Action API with run/reset helpers and reactive signals.
 */
export function createAction<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => Promise<TResult> | TResult,
  options: ActionOptions<TResult> = {}
): Action<TArgs, TResult> {
  const data = signal<TResult | undefined>(options.initialValue);
  const error = signal<unknown>(undefined);
  const state = signal<ActionState>(options.initialValue === undefined ? "idle" : "success");
  const queueType = normalizeQueueType(options.id ?? handler.name ?? "anonymous");

  let currentPromise: Promise<TResult> | null = null;
  let activeRunCount = 0;
  let latestRunId = 0;

  const run = async (...args: TArgs): Promise<TResult> => {
    latestRunId += 1;
    const runId = latestRunId;
    activeRunCount += 1;
    currentPromise = Promise.resolve(handler(...args));
    error.set(undefined);
    state.set("pending");

    if (options.clearDataOnRun === true) {
      data.set(undefined);
    }

    try {
      const result = await currentPromise;
      if (runId === latestRunId) {
        data.set(result);
        error.set(undefined);
        state.set("success");
      }

      return result;
    } catch (actionError) {
      if (runId === latestRunId) {
        error.set(actionError);
        state.set("error");
      }

      throw actionError;
    } finally {
      activeRunCount = Math.max(0, activeRunCount - 1);
      if (activeRunCount === 0 && currentPromise && runId === latestRunId) {
        currentPromise = null;
      }
    }
  };

  const runQueued = async (
    queueOptions: ActionQueueOptions,
    ...args: TArgs
  ): Promise<QueuedActionResult<TResult>> => {
    try {
      const result = await run(...args);
      return {
        status: "success",
        result
      };
    } catch (actionError) {
      if (queueOptions.shouldQueue && !queueOptions.shouldQueue(actionError)) {
        throw actionError;
      }

      const type = queueOptions.type ?? queueType;
      queueOptions.queue.register(type, (payload) => {
        if (!Array.isArray(payload)) {
          throw new Error("Terajs Action queue payload must be an arguments array.");
        }

        return handler(...(payload as TArgs));
      });

      const queued = await queueOptions.queue.enqueue({
        type,
        payload: args,
        maxRetries: queueOptions.maxRetries
      });

      state.set("queued");

      return {
        status: "queued",
        mutationId: queued.id,
        error: actionError
      };
    }
  };

  return {
    data,
    error,
    state,
    pending: () => state() === "pending",
    latest: () => data(),
    promise: () => currentPromise,
    run,
    runQueued,
    reset: () => {
      currentPromise = null;
      activeRunCount = 0;
      latestRunId += 1;
      data.set(options.initialValue);
      error.set(undefined);
      state.set(options.initialValue === undefined ? "idle" : "success");
    }
  };
}

function normalizeQueueType(value: string): string {
  const normalized = value.trim().replace(/\s+/g, "-");
  if (normalized.length === 0) {
    return "action:anonymous";
  }

  if (normalized.startsWith("action:")) {
    return normalized;
  }

  return `action:${normalized}`;
}