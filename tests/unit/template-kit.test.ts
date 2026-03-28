import { describe, expect, it } from "vitest";

import { defineTemplate } from "@dfactory/template-kit";
import type { ZodTypeAny } from "zod";

describe("template-kit", () => {
  it("creates template definitions with optional pdf config and examples", async () => {
    const schema = {
      safeParse(value: unknown) {
        if (typeof value === "object" && value !== null && "name" in value) {
          return { success: true, data: value };
        }
        return { success: false, error: { message: "name is required" } };
      }
    } as unknown as ZodTypeAny;

    const template = defineTemplate({
      meta: {
        id: "welcome",
        title: "Welcome",
        framework: "react",
        version: "1.0.0"
      },
      schema,
      pdf: {
        toc: {
          enabled: true
        }
      },
      examples: [
        {
          name: "default",
          payload: {
            name: "Alice"
          }
        }
      ],
      render(payload, context) {
        return `<main class="${context?.helpers.markerClass("avoidBreak") ?? ""}">Hi ${payload.name}</main>`;
      }
    });

    expect(template.meta.title).toBe("Welcome");
    expect(template.pdf?.toc?.enabled).toBe(true);
    expect(template.examples?.[0]?.name).toBe("default");
    const result = schema.safeParse({ name: "Alice" });
    expect(result.success).toBe(true);
  });
});
