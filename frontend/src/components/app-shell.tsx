import { NavLink, Link } from "react-router-dom";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/components/theme-provider";
import { ObiOneWordmark } from "@/components/obione-logo";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/api/types";

const ROLE_LABELS: Record<Role, string> = {
  consultant: "Consultor",
  admin: "Admin",
  client: "Cliente",
};

/** Initials from a display name (falls back to the first email char). */
function initials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return email.charAt(0).toUpperCase();
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === "/projects"}
      className={({ isActive }) =>
        cn(
          "rounded-md px-2.5 py-1.5 text-sm transition-colors",
          isActive
            ? "text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground",
        )
      }
    >
      {children}
    </NavLink>
  );
}

/**
 * Authenticated app shell: a sticky header (logo + role-aware nav + user menu)
 * over a unified-width content area. Wraps the authenticated routes via
 * <Outlet>. The nav mirrors the route guards — "Cockpit" is staff-only — but it
 * is presentation only; access is enforced server-side and by RequireRole.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { theme, toggle } = useTheme();
  const user = auth.user;
  const isStaff = user ? user.role !== "client" : false;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6">
          <Link to="/" className="shrink-0" aria-label="ObiOne — início">
            <ObiOneWordmark />
          </Link>

          <nav className="flex items-center gap-1" aria-label="Navegação principal">
            <NavItem to="/projects">Projetos</NavItem>
            {isStaff && <NavItem to="/portfolio/cockpit">Cockpit</NavItem>}
            <NavItem to="/feed">Novidades</NavItem>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
              title={theme === "dark" ? "Tema claro" : "Tema escuro"}
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 gap-2 px-2"
                    aria-label="Menu do usuário"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="text-xs">
                        {initials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium sm:inline">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                    <span className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-normal text-muted-foreground">
                      <Monitor className="size-3" />
                      {ROLE_LABELS[user.role]}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={auth.logout}>
                    <LogOut className="size-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
