import { useEffect, useState } from "react";

// Persisted flag so the first-run onboarding shows once per browser. Bump the
// version suffix to re-introduce it after a significant change to the flow.
const SEEN_KEY = "obione-onboarding-v1";

/**
 * Drives the first-access onboarding. Auto-opens once for a logged-in user who
 * has not seen it; closing it (skip, finish, ESC or the X) marks it as seen.
 * `reopen` lets the "Como funciona" trigger replay it at any time.
 */
export function useOnboarding() {
  const [open, setOpen] = useState(false);

  // Client-only: localStorage is unavailable during SSR, so gate on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("obione-auth");
      const hasToken = !!raw && !!JSON.parse(raw)?.access_token;
      const seen = localStorage.getItem(SEEN_KEY) === "true";
      if (hasToken && !seen) setOpen(true);
    } catch {
      /* noop */
    }
  }, []);

  const markSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, "true");
    } catch {
      /* noop */
    }
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) markSeen();
  };

  const reopen = () => setOpen(true);

  return { open, onOpenChange, reopen };
}
