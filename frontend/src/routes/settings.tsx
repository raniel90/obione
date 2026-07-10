import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield, UserCog, User, MoreHorizontal, Power, Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProfiles } from "@/services/profileService";
import {
  getPermissions,
  getProfilePermissions,
  updateProfilePermission,
} from "@/services/governanceService";
import { getUsers, updateUser } from "@/services/userService";
import { getAiStats } from "@/services/aiService";
import type { AiStats } from "@/services/aiService";
import type { Profile } from "@/types/profile";
import type { Permission, ProfilePermission } from "@/types/permission";
import type { ProfileCode, User as DomainUser } from "@/types/user";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "ObiOne" },
      {
        name: "description",
        content:
          "Configure como cada perfil acessa domínios, projetos, artefatos e insights do observatório.",
      },
    ],
  }),
  component: SettingsPage,
});

const PROFILE_VISUAL: Record<ProfileCode, { icon: typeof Shield; level: string }> = {
  ADMIN: { icon: Shield, level: "Acesso total" },
  CONSULTANT: { icon: UserCog, level: "Acesso por domínio" },
  CLIENT: { icon: User, level: "Acesso por projeto" },
};

const PROFILE_ORDER: ProfileCode[] = ["ADMIN", "CONSULTANT", "CLIENT"];

function SettingsPage() {
  const { user } = useCurrentUser();
  const isAdmin = user?.profileCode === "ADMIN";
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [profilePermissions, setProfilePermissions] = useState<ProfilePermission[]>([]);
  const [users, setUsers] = useState<DomainUser[]>([]);
  const [aiStats, setAiStats] = useState<AiStats | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getProfiles(), getPermissions(), getProfilePermissions(), getUsers()]).then(
      ([pr, perm, pp, us]) => {
        if (!alive) return;
        setProfiles(pr);
        setPermissions(perm);
        setProfilePermissions(pp);
        setUsers(us);
      },
    );
    getAiStats()
      .then((s) => {
        if (alive) setAiStats(s);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const profileByCode = (code: ProfileCode) => profiles.find((p) => p.code === code);
  const labelFor = (code: ProfileCode) => profileByCode(code)?.name ?? code;

  const isEnabled = (profileCode: ProfileCode, permissionCode: string) =>
    profilePermissions.find(
      (pp) => pp.profileCode === profileCode && pp.permissionCode === permissionCode,
    )?.enabled ?? false;

  const toggle = async (permissionCode: string, profileCode: ProfileCode) => {
    const next = !isEnabled(profileCode, permissionCode);
    setProfilePermissions((list) => {
      const idx = list.findIndex(
        (pp) => pp.profileCode === profileCode && pp.permissionCode === permissionCode,
      );
      if (idx === -1) return [...list, { profileCode, permissionCode, enabled: next }];
      const copy = [...list];
      copy[idx] = { ...copy[idx], enabled: next };
      return copy;
    });
    try {
      await updateProfilePermission(profileCode, permissionCode, next);
    } catch {
      // revert on failure
      setProfilePermissions((list) =>
        list.map((pp) =>
          pp.profileCode === profileCode && pp.permissionCode === permissionCode
            ? { ...pp, enabled: !next }
            : pp,
        ),
      );
    }
  };

  const toggleActive = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const next = target.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, status: next } : u)));
    try {
      await updateUser(id, { status: next });
    } catch {
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, status: target.status } : u)));
    }
  };

  const usersCountByProfile = (code: ProfileCode) =>
    users.filter((u) => u.profileCode === code).length;

  const scopeFor = (u: DomainUser) => {
    const parts: string[] = [];
    if (u.profileCode === "ADMIN") return "Acesso total";
    if (u.domainIds.length)
      parts.push(`${u.domainIds.length} domínio${u.domainIds.length === 1 ? "" : "s"}`);
    if (u.projectIds.length)
      parts.push(`${u.projectIds.length} projeto${u.projectIds.length === 1 ? "" : "s"}`);
    return parts.join(" · ") || "Sem vínculo";
  };

  return (
    <AppShell>
      <PageHeader
        title="Perfis e Governança"
        description="Configure como cada perfil acessa domínios, projetos, artefatos, insights e comunidades do observatório."
      />

      <div className="px-6 py-8 md:px-10 space-y-10">
        {/* Cards perfis */}
        <section>
          <SectionLabel>Perfis ativos</SectionLabel>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {PROFILE_ORDER.map((code) => {
              const profile = profileByCode(code);
              const visual = PROFILE_VISUAL[code];
              const Icon = visual.icon;
              return (
                <div
                  key={code}
                  className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-foreground">
                    {profile?.name ?? code}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {profile?.description ?? ""}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                    <Stat label="Usuários" value={usersCountByProfile(code).toString()} />
                    <Stat label="Nível" value={visual.level} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* IA — sugestões × aceites */}
        {aiStats && aiStats.totalSuggestions > 0 && (
          <section>
            <SectionLabel>Camada de IA</SectionLabel>
            <div className="mt-3 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-foreground" />
                <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                  Sugestões da IA × aceites
                </h3>
                <span className="ml-auto text-[11px] font-medium text-muted-foreground">
                  {aiStats.totalAccepted}/{aiStats.totalSuggestions} aceitas
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {aiStats.byType
                  .filter((t) => t.total > 0)
                  .map((t) => (
                    <Stat
                      key={t.type}
                      label={aiTypeLabels[t.type] ?? t.type}
                      value={`${t.accepted}/${t.total} · ${t.acceptanceRatePercent}%`}
                    />
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* Matriz */}
        <section>
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
            Permissões por perfil
          </h2>
          <p className="mt-1 max-w-2xl text-[12.5px] text-muted-foreground">
            {isAdmin
              ? "O administrador tem todas as permissões, fixas. Ajuste o que consultor e cliente podem fazer."
              : "Como consultor, você ajusta apenas as permissões do cliente."}
          </p>

          <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-[11px] font-medium text-muted-foreground">
                    Permissão
                  </TableHead>
                  {PROFILE_ORDER.map((code) => (
                    <TableHead
                      key={code}
                      className="text-center text-[11px] font-medium text-muted-foreground"
                    >
                      {labelFor(code)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((p) => (
                  <TableRow key={p.code} className="border-border">
                    <TableCell className="text-[13px] text-foreground">{p.name}</TableCell>
                    {PROFILE_ORDER.map((code) => {
                      // ADMIN is fixed (all on); CONSULTANT is editable by admins only.
                      const locked = code === "ADMIN" || (code === "CONSULTANT" && !isAdmin);
                      return (
                        <TableCell key={code} className="text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={code === "ADMIN" ? true : isEnabled(code, p.code)}
                              disabled={locked}
                              onCheckedChange={() => toggle(p.code, code)}
                            />
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Usuários por perfil */}
        <section className="pb-8">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">Usuários</h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Quem participa do observatório e seus vínculos.
          </p>

          <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-[11px] font-medium text-muted-foreground">
                    Usuário
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground">
                    Perfil
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground">
                    Vínculo contextual
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const active = u.status === "ACTIVE";
                  return (
                    <TableRow key={u.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent/70 to-info/70 text-[10px] font-semibold text-accent-foreground">
                            {u.name
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <span className="text-[13px] text-foreground">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground">
                          {labelFor(u.profileCode)}
                        </span>
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {scopeFor(u)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                            active ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              active ? "bg-success" : "bg-muted-foreground/40"
                            }`}
                          />
                          {active ? "ativo" : "inativo"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-[12.5px]">
                            <DropdownMenuItem onClick={() => toggleActive(u.id)}>
                              <Power className="h-3.5 w-3.5" />
                              {active ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

const aiTypeLabels: Record<string, string> = {
  DOMAIN: "Domínio",
  OBSERVATIONS: "Observações",
  KNOWLEDGE: "Conhecimento",
  SYNTHESIS: "Síntese do domínio",
  PROJECT_SETUP: "Configuração de projeto",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium text-muted-foreground">{children}</p>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[12.5px] text-foreground">{value}</p>
    </div>
  );
}
