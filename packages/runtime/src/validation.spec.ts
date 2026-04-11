import { describe, expect, it } from "vitest";
import { createSchemaValidator } from "./validation";

describe("createSchemaValidator", () => {
  it("supports safeParse schema adapters", () => {
    const validator = createSchemaValidator<{ name?: string }, { name: string }>({
      safeParse(input) {
        if (typeof input.name === "string" && input.name.length > 0) {
          return {
            success: true,
            data: { name: input.name }
          };
        }

        return {
          success: false,
          error: {
            issues: [
              {
                path: ["name"],
                message: "Name is required",
                code: "too_small"
              }
            ]
          }
        };
      }
    });

    expect(validator({ name: "Ada" })).toEqual({
      valid: true,
      value: { name: "Ada" },
      issues: []
    });

    expect(validator({})).toEqual({
      valid: false,
      issues: [
        {
          path: "name",
          message: "Name is required",
          code: "too_small"
        }
      ]
    });
  });

  it("supports parse schema adapters that throw errors", () => {
    const validator = createSchemaValidator<{ age: unknown }, { age: number }>({
      parse(input) {
        if (typeof input.age !== "number") {
          throw new Error("Age must be numeric");
        }

        return {
          age: input.age
        };
      }
    });

    expect(validator({ age: 42 })).toEqual({
      valid: true,
      value: { age: 42 },
      issues: []
    });

    expect(validator({ age: "x" })).toEqual({
      valid: false,
      issues: [
        {
          message: "Age must be numeric"
        }
      ]
    });
  });

  it("falls back to generic issues when error shape is unknown", () => {
    const validator = createSchemaValidator<string>({
      parse() {
        throw 404;
      }
    });

    expect(validator("value")).toEqual({
      valid: false,
      issues: [
        {
          message: "Validation failed"
        }
      ]
    });
  });
});
