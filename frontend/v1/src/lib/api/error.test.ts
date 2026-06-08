import { describe, it, expect } from "vitest";
import { ApiError } from "./error";

describe("ApiError", () => {
  it("carries status, code and message and is an Error", () => {
    const e = new ApiError(401, "unauthorized", "Bad token");
    expect(e.status).toBe(401);
    expect(e.code).toBe("unauthorized");
    expect(e.message).toBe("Bad token");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ApiError");
  });
});
