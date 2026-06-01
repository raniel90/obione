import { describe, it, expect, beforeEach } from "vitest";
import {
  TOKEN_STORAGE_KEY,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from "./token";

describe("token storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("setStoredToken writes to localStorage under the canonical key", () => {
    setStoredToken("abc");
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("abc");
  });

  it("getStoredToken returns null when nothing is stored", () => {
    expect(getStoredToken()).toBeNull();
  });

  it("getStoredToken returns the stored token", () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "xyz");
    expect(getStoredToken()).toBe("xyz");
  });

  it("clearStoredToken removes the token", () => {
    setStoredToken("abc");
    clearStoredToken();
    expect(getStoredToken()).toBeNull();
  });
});
