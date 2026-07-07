import { useEffect, useState } from "react";
import { getCurrentUser } from "@/services/authService";
import type { User } from "@/types/user";

export interface CurrentUserState {
  user: User | null;
  /** True while the initial user fetch is in flight. */
  loading: boolean;
  /** Convenience: profileCode === "CLIENT". */
  isClient: boolean;
  /** Convenience: profileCode is CONSULTANT or ADMIN. */
  isStaff: boolean;
}

/**
 * Returns the authenticated user and role-derived booleans.
 *
 * Single source of truth: delegates to `getCurrentUser()` (reads from
 * localStorage + /auth/me) and re-syncs on storage events (cross-tab logout).
 * Do not call `getCurrentUser()` separately when you just need role gating —
 * use this hook instead.
 */
export function useCurrentUser(): CurrentUserState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const sync = () => {
      getCurrentUser()
        .then((u) => {
          if (!cancelled) {
            setUser(u);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    };

    sync();
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isClient = user?.profileCode === "CLIENT";
  const isStaff = user?.profileCode === "CONSULTANT" || user?.profileCode === "ADMIN";

  return { user, loading, isClient, isStaff };
}
