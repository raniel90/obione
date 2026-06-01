import "@testing-library/jest-dom/vitest";

// Node 25 ships a built-in Web Storage API behind the `--localstorage-file`
// flag that Vitest workers pass without a value. The resulting native
// `localStorage`/`sessionStorage` globals are unusable (no `getItem`,
// `setItem`, etc.) and shadow jsdom's working implementations. We restore
// jsdom's storage by reassigning the globals from `window._localStorage` /
// `window._sessionStorage`, which jsdom always exposes internally.
const jsdomWindow = window as unknown as {
  _localStorage?: Storage;
  _sessionStorage?: Storage;
};

if (jsdomWindow._localStorage) {
  try {
    Object.defineProperty(globalThis, "localStorage", {
      value: jsdomWindow._localStorage,
      configurable: true,
      writable: true,
    });
  } catch {
    // already defined non-configurably (e.g. on second worker init); leave as-is
  }
  try {
    Object.defineProperty(window, "localStorage", {
      value: jsdomWindow._localStorage,
      configurable: true,
      writable: true,
    });
  } catch {
    // already defined non-configurably (e.g. on second worker init); leave as-is
  }
}

if (jsdomWindow._sessionStorage) {
  try {
    Object.defineProperty(globalThis, "sessionStorage", {
      value: jsdomWindow._sessionStorage,
      configurable: true,
      writable: true,
    });
  } catch {
    // already defined non-configurably (e.g. on second worker init); leave as-is
  }
  try {
    Object.defineProperty(window, "sessionStorage", {
      value: jsdomWindow._sessionStorage,
      configurable: true,
      writable: true,
    });
  } catch {
    // already defined non-configurably (e.g. on second worker init); leave as-is
  }
}
