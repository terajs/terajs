export interface ValidationIssue {
  path?: string;
  message: string;
  code?: string;
}

export interface ValidationResult<TValue = unknown> {
  valid: boolean;
  value?: TValue;
  issues: ValidationIssue[];
}

export type Validator<TInput, TValue = TInput> = (
  input: TInput
) => ValidationResult<TValue> | Promise<ValidationResult<TValue>>;

export interface SafeParseSchema<TInput, TValue = TInput> {
  safeParse(input: TInput):
    | { success: true; data: TValue }
    | { success: false; error: unknown };
}

export interface ParseSchema<TInput, TValue = TInput> {
  parse(input: TInput): TValue;
}

type SchemaLike<TInput, TValue = TInput> = SafeParseSchema<TInput, TValue> | ParseSchema<TInput, TValue>;

/**
 * Creates a runtime-neutral validator from a schema adapter.
 *
 * Supported schema contracts:
 * - `safeParse(input)` returning `{ success, data | error }`
 * - `parse(input)` throwing on invalid input
 */
export function createSchemaValidator<TInput, TValue = TInput>(
  schema: SchemaLike<TInput, TValue>
): Validator<TInput, TValue> {
  return (input: TInput) => {
    if (hasSafeParse(schema)) {
      const result = schema.safeParse(input);
      if (result.success) {
        return {
          valid: true,
          value: result.data,
          issues: []
        };
      }

      return {
        valid: false,
        issues: normalizeValidationIssues(result.error)
      };
    }

    try {
      const value = schema.parse(input);
      return {
        valid: true,
        value,
        issues: []
      };
    } catch (error) {
      return {
        valid: false,
        issues: normalizeValidationIssues(error)
      };
    }
  };
}

function hasSafeParse<TInput, TValue>(
  schema: SchemaLike<TInput, TValue>
): schema is SafeParseSchema<TInput, TValue> {
  return typeof (schema as SafeParseSchema<TInput, TValue>).safeParse === "function";
}

function normalizeValidationIssues(error: unknown): ValidationIssue[] {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const issuesValue = record.issues;

    if (Array.isArray(issuesValue)) {
      const issues = issuesValue
        .map((issue) => normalizeIssueEntry(issue))
        .filter((issue): issue is ValidationIssue => issue !== null);

      if (issues.length > 0) {
        return issues;
      }
    }

    if (typeof record.message === "string" && record.message.length > 0) {
      return [{ message: record.message }];
    }
  }

  if (typeof error === "string" && error.length > 0) {
    return [{ message: error }];
  }

  return [{ message: "Validation failed" }];
}

function normalizeIssueEntry(value: unknown): ValidationIssue | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const issue = value as Record<string, unknown>;
  const message = typeof issue.message === "string" && issue.message.length > 0
    ? issue.message
    : "Validation failed";

  let path: string | undefined;
  if (typeof issue.path === "string" && issue.path.length > 0) {
    path = issue.path;
  } else if (Array.isArray(issue.path)) {
    path = issue.path
      .map((segment) => String(segment))
      .filter((segment) => segment.length > 0)
      .join(".");
  }

  const code = typeof issue.code === "string" && issue.code.length > 0
    ? issue.code
    : undefined;

  return {
    message,
    path,
    code
  };
}