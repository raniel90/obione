import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Users,
  Settings,
  Search,
  Moon,
  Sun,
  Bell,
  Upload,
  Plus,
  LogIn,
  LogOut,
} from "lucide-react";
import { ObiOneMark, ObiOneWordmark } from "@/components/obione-logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn, getUserInitials } from "@/lib/utils";
import { useEffect, useState } from "react";
import { projects } from "@/lib/mock-data";
import { getCurrentUser, logout } from "@/services/authService";
import type { User } from "@/types/user";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { label: "Observatório", to: "/", icon: LayoutDashboard, match: (p: string) => p === "/" },
  { label: "Projetos", to: "/projects", icon: FolderKanban, match: (p: string) => p.startsWith("/projects") },
  { label: "Domínios", to: "/domains", icon: Layers, match: (p: string) => p.startsWith("/domains") },
  { label: "Comunidade", to: "/community", icon: Users, match: (p: string) => p.startsWith("/community") },
  { label: "Configurações", to: "/settings", icon: Settings, match: (p: string) => p.startsWith("/settings") },
] as const;

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center px-5 border-b border-sidebar-border">
        <Link to="/">
          <ObiOneWordmark />
        </Link>
      </div>

      <div className="px-3 py-4">
        <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Navegação
        </p>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-3">
        <div className="rounded-lg border border-sidebar-border bg-background/40 p-3">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Observatório ativo
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            9 projetos monitorados em 6 domínios.
          </p>
        </div>
      </div>
    </aside>
  );
}

function useAuthSession() {
  const [session, setSession] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        const raw = localStorage.getItem("obione-auth");
        const hasToken = !!raw && !!JSON.parse(raw)?.access_token;
        if (cancelled) return;

        setSession(hasToken);
        if (!hasToken) {
          setUser(null);
          return;
        }

        const current = await getCurrentUser();
        if (!cancelled) setUser(current);
      } catch {
        if (!cancelled) {
          setSession(false);
          setUser(null);
        }
      }
    };

    sync();
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", sync);
    };
  }, []);

  const signOut = () => {
    logout();
    setSession(false);
    setUser(null);
  };

  return { session, user, signOut };
}

function useBreadcrumb(): { label: string; to?: string }[] {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumbs: { label: string; to?: string }[] = [{ label: "Observatório", to: "/" }];

  if (pathname === "/") return crumbs;

  if (pathname.startsWith("/projects")) {
    crumbs.push({ label: "Projetos", to: "/projects" });
    if (pathname === "/projects/new") crumbs.push({ label: "Novo Projeto" });
    else if (pathname.startsWith("/projects/")) {
      const id = pathname.split("/")[2];
      const p = projects.find((x) => x.id === id);
      crumbs.push({ label: p?.name ?? "Projeto" });
    }
  } else if (pathname.startsWith("/domains")) {
    crumbs.push({ label: "Domínios", to: "/domains" });
    if (pathname === "/domains/new") crumbs.push({ label: "Novo Domínio" });
    else if (pathname.startsWith("/domains/")) crumbs.push({ label: "Detalhe" });
  } else if (pathname.startsWith("/community")) {
    crumbs.push({ label: "Comunidade", to: "/community" });
    if (pathname.startsWith("/community/")) crumbs.push({ label: "Domínio" });
  } else if (pathname.startsWith("/settings")) {
    crumbs.push({ label: "Configurações" });
  }

  return crumbs;
}

function Breadcrumbs() {
  const crumbs = useBreadcrumb();
  return (
    <div className="hidden md:flex items-center gap-2 text-[13px] text-muted-foreground">
      {crumbs.map((c, idx) => {
        const isLast = idx === crumbs.length - 1;
        const isFirst = idx === 0;
        return (
          <span key={`${c.label}-${idx}`} className="flex items-center gap-2">
            {!isFirst && <span className="font-mono text-[11px] text-muted-foreground/60">/</span>}
            {c.to && !isLast ? (
              <Link
                to={c.to}
                className={cn(
                  "transition-colors hover:text-foreground",
                  isFirst && "font-mono text-[11px] uppercase tracking-wider",
                )}
              >
                {isFirst ? c.label : c.label}
              </Link>
            ) : (
              <span className={cn(isLast ? "text-foreground" : "", isFirst && "font-mono text-[11px] uppercase tracking-wider")}>
                {c.label}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function Header() {
  const { theme, toggle } = useTheme();
  const { session, user, signOut } = useAuthSession();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 md:hidden">
        <ObiOneMark size={20} />
        <span className="text-sm font-semibold">ObiOne</span>
      </div>

      <Breadcrumbs />

      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-[12px] text-muted-foreground w-72">
          <Search className="h-3.5 w-3.5" />
          <input
            placeholder="Buscar projetos, domínios, tags…"
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="hidden xl:inline text-[10px] font-mono border border-border rounded px-1 py-0.5 text-muted-foreground">⌘K</kbd>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>

        {session ? (
          <div className="flex items-center gap-2">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex h-7 w-7 cursor-default items-center justify-center rounded-full bg-gradient-to-br from-accent to-info text-[11px] font-semibold text-accent-foreground"
                    aria-label={user?.name ?? "Usuário logado"}
                  >
                    {user ? getUserInitials(user.name) : "…"}
                  </div>
                </TooltipTrigger>
                {user && <TooltipContent side="bottom">{user.name}</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { signOut(); navigate({ to: "/login" }); }} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="gap-1.5 text-[12px]" onClick={() => navigate({ to: "/login" })}>
            <LogIn className="h-4 w-4" />
            Entrar
          </Button>
        )}
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border px-6 py-6 md:flex-row md:items-end md:justify-between md:px-10">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export { Plus, Upload };
