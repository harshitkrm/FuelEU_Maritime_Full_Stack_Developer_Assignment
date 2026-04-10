import { describe, expect, it } from "vitest";

describe("api client module", () => {
  it("exports api object", async () => {
    const { api } = await import("./api-client.js");
    expect(api).toBeDefined();
    expect(typeof api.getRoutes).toBe("function");
  });
});
