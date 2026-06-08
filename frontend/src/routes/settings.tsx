import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Shield,
  UserCog,
  User,
  Users,
  Check,
  X,
  MoreHorizontal,
  Link2,
  Layers,
  Power,
} from "lucide-react";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getProfiles } from "@/services/profileService";
import {
  getPermissions,
  getProfilePermissions,
  updateProfilePermission,
} from "@/services/governanceService";
import { getUsers, updateUser } from "@/services/userService";
import type { Profile } from "@/types/profile";
import type { Permission, ProfilePermission } from "@/types/permission";
import type { ProfileCode, User as DomainUser } from "@/types/user";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Perfis e Governança — ObiOne" },
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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [profilePermissions, setProfilePermissions] = useState<ProfilePermission[]>([]);
  const [users, setUsers] = useState<DomainUser[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      getProfiles(),
      getPermissions(),
      getProfilePermissions(),
      getUsers(),
    ]).then(([pr, perm, pp, us]) => {
      if (!alive) return;
      setProfiles(pr);
      setPermissions(perm);
      setProfilePermissions(pp);
      setUsers(us);
    });
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
    if (u.domainIds.length) parts.push(`${u.domainIds.length} domínio${u.domainIds.length === 1 ? "" : "s"}`);
    if (u.projectIds.length) parts.push(`${u.projectIds.length} projeto${u.projectIds.length === 1 ? "" : "s"}`);
    return parts.join(" · ") || "Sem vínculo";
  };

  return (
    <AppShell>
      <PageHeader
        title="Perfis e Governança"
        description="Configure como cada perfil acessa domínios, projetos, artefatos, insights e comunidades do observatório."
      />

      <div className="px-6 py-8 md:px-10 space-y-10">
        {/* Bloco conceitual comunidade */}
        <section>
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                <Users className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  camada de participação
                </p>
                <h3 className="mt-1.5 text-[14px] font-semibold tracking-tight text-foreground">
                  Comunidade como camada de participação
                </h3>
                <p className="mt-2 max-w-3xl text-[12.5px] leading-relaxed text-muted-foreground">
                  No ObiOne, a comunidade não é um tipo de usuário. Ela representa a
                  camada sociotécnica do observatório, onde participantes interpretam
                  fenômenos, discutem evidências e ajudam a transformar observações em
                  conhecimento coletivo. Todos os perfis podem participar da comunidade,
                  mas suas ações e visibilidade dependem do perfil e do vínculo com
                  domínios e projetos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cards perfis */}
        <section>
          <SectionLabel>// perfis ativos</SectionLabel>
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
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      ativo
                    </span>
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-foreground">
                    {profile?.name ?? code}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {profile?.description ?? ""}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                    <Stat label="usuários" value={usersCountByProfile(code).toString()} />
                    <Stat label="nível" value={visual.level} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Matriz */}
        <section>
          <SectionLabel>// matriz de permissões</SectionLabel>
          <h2 className="mt-2 text-[16px] font-semibold tracking-tight text-foreground">
            Permissões por perfil
          </h2>
          <p className="mt-1 max-w-2xl text-[12.5px] text-muted-foreground">
            Ative ou desative o que cada perfil pode realizar no observatório. As alterações
            são aplicadas em modo simulado.
          </p>

          <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    Permissão
                  </TableHead>
                  {PROFILE_ORDER.map((code) => (
                    <TableHead
                      key={code}
                      className="text-center text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground"
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
                    {PROFILE_ORDER.map((code) => (
                      <TableCell key={code} className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={isEnabled(code, p.code)}
                            onCheckedChange={() => toggle(p.code, code)}
                          />
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Acesso contextual */}
        <section>
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                <Layers className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  acesso contextual
                </p>
                <h3 className="mt-1.5 text-[14px] font-semibold tracking-tight text-foreground">
                  Perfil define o papel · contexto define o alcance
                </h3>
                <p className="mt-2 max-w-3xl text-[12.5px] leading-relaxed text-muted-foreground">
                  O domínio organiza a comunidade observacional, mas o acesso real
                  às informações depende do vínculo do usuário com cada projeto.
                  Assim, um cliente pode participar da comunidade do domínio Branding,
                  mas visualizar apenas discussões e dados relacionados ao projeto ao
                  qual está vinculado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Usuários por perfil */}
        <section className="pb-8">
          <SectionLabel>// usuários por perfil</SectionLabel>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
                Usuários por perfil
              </h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Lista mockada de usuários do observatório e seus vínculos contextuais.
              </p>
            </div>
            <Button size="sm" variant="outline" className="text-[12px]">
              Convidar usuário
            </Button>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    Usuário
                  </TableHead>
                  <TableHead className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    Perfil
                  </TableHead>
                  <TableHead className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    Vínculo contextual
                  </TableHead>
                  <TableHead className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
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
                          className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] ${
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
                            <DropdownMenuItem>
                              <UserCog className="h-3.5 w-3.5" />
                              Alterar perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Layers className="h-3.5 w-3.5" />
                              Vincular domínio
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link2 className="h-3.5 w-3.5" />
                              Vincular projeto
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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

          <div className="mt-4 flex items-center gap-4 text-[11.5px] text-muted-foreground">
            <Legend icon={<Check className="h-3 w-3" />} label="Permissão ativa" />
            <Legend icon={<X className="h-3 w-3" />} label="Permissão restrita" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
              · governança simulada (mock)
            </span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
      {children}
    </p>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-[12.5px] text-foreground">{value}</p>
    </div>
  );
}

function Legend({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-foreground">
        {icon}
      </span>
      {label}
    </span>
  );
}
