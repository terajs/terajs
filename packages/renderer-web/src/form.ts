import { createAction, type ActionState } from "@terajs/runtime";
import { jsx } from "./jsx-runtime";

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
}

export interface FormProps<TResult = unknown> {
  action?: string | ((context: FormSubmitContext<TResult>) => Promise<TResult> | TResult);
  resetOnSuccess?: boolean;
  children?: any | ((state: FormRenderState<TResult>) => any);
  onSubmit?: (event: SubmitEvent) => void;
  onSuccess?: (result: TResult, context: FormSubmitContext<TResult>) => void;
  onError?: (error: unknown, context: FormSubmitContext<TResult>) => void;
  [key: string]: unknown;
}

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

export function Form<TResult = unknown>(props: FormProps<TResult>): Node {
  const {
    action,
    resetOnSuccess,
    children,
    onSubmit,
    onSuccess,
    onError,
    ...rest
  } = props;
  const enhancedAction = typeof action === "function" ? action : undefined;
  const submission = createAction<[FormSubmitContext<TResult>], TResult>((context) => {
    if (!enhancedAction) {
      throw new Error("Terajs Form: no enhanced action handler is configured.");
    }

    return enhancedAction(context);
  });

  const renderState: FormRenderState<TResult> = {
    pending: submission.pending,
    data: submission.data,
    latest: submission.latest,
    error: submission.error,
    state: submission.state
  };

  return jsx("form", {
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

      try {
        const result = await submission.run(context);
        if (resetOnSuccess) {
          form.reset();
        }
        onSuccess?.(result, context);
      } catch (error) {
        onError?.(error, context);
      }
    },
    children: typeof children === "function" ? children(renderState) : children
  });
}