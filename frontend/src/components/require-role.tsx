import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/api/types";

interface Props {
  role: Role | Role[];
  children: ReactNode;
}

export function RequireRole({ role, children }: Props) {
  const auth = useAuth();
  if (auth.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }
  if (auth.status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(auth.user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
