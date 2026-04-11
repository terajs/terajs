import {
  createAction,
  type ActionState,
  type MutationQueue,
  type QueuedActionResult,
  type ValidationIssue,
  type ValidationResult,
  type Validator
} from "@terajs/runtime";
import { signal } from "@terajs/reactivity";
import { jsx } from "./jsx-runtime.js";
import { template } from "./template.js";

export type FormValue = FormDataEntryValue;
export type FormValues = Record<string, FormValue | FormValue[]>;

export interface FormSubmitContext<TResult = unknown> {
  form: HTMLFormElement;
  formData: FormData;
  values: FormValues;
  submitter: HTMLElement | null;
  method: string;
}

export interface FormRenderState<TResult = unknown> {
  pending: () => boolean;
  data: () => TResult | undefined;
  latest: () => TResult | undefined;
  error: () => unknown;
  state: () => ActionState;
  validationIssues: () => ValidationIssue[];
}

export interface FormProps<TResult = unknown> {
  action?: string | ((context: FormSubmitContext<TResult>) => Promise<TResult> | TResult);
  validate?: Validator<FormValues>;
  queue?: MutationQueue;
  queueType?: string;
  queueMaxRetries?: number;
  shouldQueue?: (error: unknown) => boolean;
  resetOnSuccess?: boolean;
  children?: any | ((state: FormRenderState<TResult>) => any);
  onSubmit?: (event: SubmitEvent) => void;
  onSuccess?: (result: TResult, context: FormSubmitContext<TResult>) => void;
  onError?: (error: unknown, context: FormSubmitContext<TResult>) => void;
  onValidationError?: (result: ValidationResult<FormValues>, context: FormSubmitContext<TResult>) => void;
  onQueued?: (result: Extract<QueuedActionResult<TResult>, { status: "queued" }>, context: FormSubmitContext<TResult>) => void;
  [key: string]: unknown;
}

export interface SubmitButtonProps<TResult = unknown> {
  formState?: FormRenderState<TResult>;
  disableOnPending?: boolean;
  children?: any;
  [key: string]: unknown;
}

export interface FormStatusProps<TResult = unknown> {
  formState?: FormRenderState<TResult>;
  idle?: any | ((state: FormRenderState<TResult>) => any);
  pending?: any | ((state: FormRenderState<TResult>) => any);
  success?: any | ((state: FormRenderState<TResult>) => any);
  error?: any | ((error: unknown, state: FormRenderState<TResult>) => any);
}

const formStateRegistry = new WeakMap<HTMLFormElement, FormRenderState<unknown>>();

function normalizeMethod(
  form: HTMLFormElement,
  submitter: HTMLElement | null,
  fallback: unknown
): string {
  if (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) {
    const submitterMethod = submitter.getAttribute("formmethod") ?? submitter.formMethod;
    if (submitterMethod) {
      return submitterMethod.toUpperCase();
    }
  }

  if (typeof fallback === "string" && fallback.length > 0) {
    return fallback.toUpperCase();
  }

  return (form.getAttribute("method") ?? form.method ?? "GET").toUpperCase();
}

function appendSubmitterValue(formData: FormData, submitter: HTMLElement | null): void {
  if (!(submitter instanceof HTMLButtonElement) && !(submitter instanceof HTMLInputElement)) {
    return;
  }

  const name = submitter.getAttribute("name") ?? submitter.name;
  if (!name) {
    return;
  }

  const value = submitter.getAttribute("value") ?? submitter.value ?? "";
  if (!formData.has(name)) {
    formData.append(name, value);
  }
}

/**
 * Converts FormData entries into a plain object.
 *
 * Duplicate keys are represented as arrays to preserve all submitted values.
 */
export function formDataToObject(formData: FormData): FormValues {
  const values: FormValues = {};

  for (const [key, value] of formData.entries()) {
    const previous = values[key];

    if (previous === undefined) {
      values[key] = value;
      continue;
    }

    values[key] = Array.isArray(previous)
      ? [...previous, value]
      : [previous, value];
  }

  return values;
}

function createSubmitContext<TResult>(
  form: HTMLFormElement,
  submitter: HTMLElement | null,
  method: unknown
): FormSubmitContext<TResult> {
  const formData = new FormData(form);
  appendSubmitterValue(formData, submitter);

  return {
    form,
    formData,
    values: formDataToObject(formData),
    submitter,
    method: normalizeMethod(form, submitter, method)
  };
}

function getRegisteredFormState<TResult = unknown>(form: HTMLFormElement | null): FormRenderState<TResult> | undefined {
  if (!form) {
    return undefined;
  }

  return formStateRegistry.get(form) as FormRenderState<TResult> | undefined;
}

function resolveNearestFormState<TResult = unknown>(
  element: Element | null,
  fallback?: FormRenderState<TResult>
): FormRenderState<TResult> | undefined {
  if (fallback) {
    return fallback;
  }

  const nearestForm = element?.closest("form");
  return nearestForm instanceof HTMLFormElement
    ? getRegisteredFormState<TResult>(nearestForm)
    : undefined;
}

function resolveStatusContent<TResult>(
  value: any,
  state: FormRenderState<TResult>
): any {
  if (typeof value === "function") {
    if (state.state() === "error") {
      return value(state.error(), state);
    }

    return value(state);
  }

  return value;
}

function normalizeStatusContent(value: any): Node {
  if (value == null || value === false || value === true) {
    return document.createTextNode("");
  }

  if (value instanceof Node) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    return document.createTextNode(String(value));
  }

  throw new Error("Terajs FormStatus: unsupported status content.");
}

/**
 * Enhanced form primitive for action-based submissions.
 *
 * Supports queue-aware submission, optional validation, and render-state
 * signals that can be consumed by child helpers.
 */
export function Form<TResult = unknown>(props: FormProps<TResult>): Node {
  const {
    action,
    validate,
    queue,
    queueType,
    queueMaxRetries,
    shouldQueue,
    resetOnSuccess,
    children,
    onSubmit,
    onSuccess,
    onError,
    onValidationError,
    onQueued,
    ...rest
  } = props;
  const enhancedAction = typeof action === "function" ? action : undefined;
  const submission = createAction<[FormSubmitContext<TResult>], TResult>((context) => {
    if (!enhancedAction) {
      throw new Error("Terajs Form: no enhanced action handler is configured.");
    }

    return enhancedAction(context);
  });
  const validationIssues = signal<ValidationIssue[]>([]);

  const renderState: FormRenderState<TResult> = {
    pending: submission.pending,
    data: submission.data,
    latest: submission.latest,
    error: submission.error,
    state: submission.state,
    validationIssues
  };

  const formNode = jsx("form", {
    ...rest,
    action: typeof action === "string" ? action : undefined,
    "data-state": submission.state,
    "data-pending": () => submission.pending() ? "true" : undefined,
    "aria-busy": () => submission.pending() ? "true" : undefined,
    onSubmit: async (event: SubmitEvent) => {
      onSubmit?.(event);
      if (event.defaultPrevented || !enhancedAction) {
        return;
      }

      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement | null;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      const context = createSubmitContext<TResult>(form, (event as SubmitEvent).submitter as HTMLElement | null, rest.method);
      validationIssues.set([]);

      if (validate) {
        const validation = await validate(context.values);
        if (!validation.valid) {
          validationIssues.set(validation.issues);
          onValidationError?.(validation, context);
          return;
        }

        if (validation.value) {
          context.values = validation.value;
        }
      }

      try {
        const outcome = queue
          ? await submission.runQueued(
              {
                queue,
                type: queueType,
                maxRetries: queueMaxRetries,
                shouldQueue
              },
              context
            )
          : {
              status: "success",
              result: await submission.run(context)
            } as QueuedActionResult<TResult>;

        if (outcome.status === "queued") {
          onQueued?.(outcome, context);
          return;
        }

        const result = outcome.result;
        if (resetOnSuccess) {
          form.reset();
        }
        onSuccess?.(result, context);
      } catch (error) {
        onError?.(error, context);
      }
    },
    children: typeof children === "function" ? children(renderState) : children
  }) as HTMLFormElement;

  formStateRegistry.set(formNode, renderState as FormRenderState<unknown>);
  return formNode;
}

/**
 * Submit button helper that binds to nearest Form render state by default.
 */
export function SubmitButton<TResult = unknown>(props: SubmitButtonProps<TResult>): Node {
  const {
    formState,
    disableOnPending = true,
    type,
    children,
    ...rest
  } = props;
  const resolvedFormState = signal<FormRenderState<TResult> | undefined>(formState);

  const button = jsx("button", {
    ...rest,
    type: type ?? "submit",
    disabled: () => {
      const disabled = rest.disabled;
      if (typeof disabled === "function") {
        return disabled();
      }

      if (disabled !== undefined) {
        return disabled;
      }

      return disableOnPending ? resolvedFormState()?.pending() === true : undefined;
    },
    "data-state": () => resolvedFormState()?.state(),
    "data-pending": () => resolvedFormState()?.pending() ? "true" : undefined,
    "aria-busy": () => resolvedFormState()?.pending() ? "true" : undefined,
    children
  }) as HTMLButtonElement;

  queueMicrotask(() => {
    const nextState = resolveNearestFormState(button, formState);
    if (nextState) {
      resolvedFormState.set(nextState);
    }
  });

  return button;
}

/**
 * Status renderer for idle/pending/success/error form states.
 */
export function FormStatus<TResult = unknown>(props: FormStatusProps<TResult>): Node {
  const resolvedFormState = signal<FormRenderState<TResult> | undefined>(props.formState);
  let anchor: HTMLSpanElement | null = null;
  let lookupScheduled = false;

  return template(() => {
    const state = resolvedFormState();
    anchor = document.createElement("span");

    if (!state) {
      if (!lookupScheduled) {
        lookupScheduled = true;
        queueMicrotask(() => {
          const nextState = resolveNearestFormState(anchor, props.formState);
          if (nextState) {
            resolvedFormState.set(nextState);
          }
        });
      }

      return anchor;
    }

    const variant = state.state();
    const content = variant === "pending"
      ? props.pending
      : variant === "success"
        ? props.success
        : variant === "error"
          ? props.error
          : props.idle;

    return normalizeStatusContent(resolveStatusContent(content, state));
  });
}