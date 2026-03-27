import { describe, expect, it } from "vitest";

import { detectFrameworkFromPackageJson } from "../../packages/create-dfactory/src/index.ts";

describe("create-dfactory framework detection", () => {
  it("defaults to react when no package.json data is present", () => {
    expect(detectFrameworkFromPackageJson(undefined)).toBe("react");
  });

  it("detects vue projects from dependencies", () => {
    expect(
      detectFrameworkFromPackageJson({
        dependencies: {
          vue: "^3.5.21"
        }
      })
    ).toBe("vue");
  });

  it("detects vue projects from nuxt dependencies", () => {
    expect(
      detectFrameworkFromPackageJson({
        devDependencies: {
          nuxt: "^3.17.0"
        }
      })
    ).toBe("vue");
  });

  it("detects react projects from dependencies", () => {
    expect(
      detectFrameworkFromPackageJson({
        dependencies: {
          react: "^19.1.1"
        }
      })
    ).toBe("react");
  });

  it("prefers vue when both vue and react are present", () => {
    expect(
      detectFrameworkFromPackageJson({
        dependencies: {
          react: "^19.1.1",
          vue: "^3.5.21"
        }
      })
    ).toBe("vue");
  });
});
