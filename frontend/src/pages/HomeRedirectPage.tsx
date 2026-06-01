import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

export function HomeRedirectPage() {
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
  if (auth.user.role === "client") {
    return <Navigate to="/projects" replace />;
  }
  return <Navigate to="/portfolio/cockpit" replace />;
}
