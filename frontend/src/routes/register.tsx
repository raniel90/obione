import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ObiOneMark } from "@/components/obione-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { getDomains } from "@/services/domainService";
import { createUser } from "@/services/userService";
import { ApiError } from "@/services/apiClient";
import type { Domain } from "@/types/domain";
import type { ProfileCode } from "@/types/user";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Solicitar acesso — ObiOne" },
      {
        name: "description",
        content: "Solicite acesso ao ObiOne, Observatório Inteligente de Projetos.",
      },
    ],
  }),
  component: RegisterPage,
});

type Role = "admin" | "consultor" | "cliente";

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "consultor", label: "Consultor" },
  { value: "cliente", label: "Cliente" },
];

const roleToProfileCode: Record<Role, ProfileCode> = {
  admin: "ADMIN",
  consultor: "CONSULTANT",
  cliente: "CLIENT",
};

function RegisterPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "" as Role | "",
    domainId: "",
    objective: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDomains()
      .then((list) => {
        if (!cancelled) setDomains(list);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar os domínios. Tente novamente.");
      })
      .finally(() => {
        if (!cancelled) setDomainsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.role || !form.domainId) {
      setError("Selecione o tipo de usuário e o domínio de interesse.");
      return;
    }
    if (form.password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        profileCode: roleToProfileCode[form.role],
        status: "PENDING",
        domainIds: [form.domainId],
        projectIds: [],
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("Este e-mail já está cadastrado. Use outro e-mail ou faça login.");
      } else if (err instanceof ApiError && err.status === 400) {
        setError(err.message || "Dados inválidos. Verifique o formulário.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível enviar a solicitação. Tente novamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-dotgrid opacity-[0.35] dark:opacity-[0.18]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
        >
          <ObiOneMark size={20} />
          ObiOne
        </Link>
        <Link
          to="/login"
          className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Entrar
        </Link>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-72px)] items-start justify-center px-6 pb-20 pt-6 md:pt-10">
        <div className="w-full max-w-[460px]">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -m-4 rounded-full bg-foreground/[0.04] blur-xl"
              />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                <ObiOneMark size={28} className="text-foreground" />
              </div>
            </div>

            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              // observatório inteligente
            </p>
            <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight text-foreground">
              Observar. Organizar. Decidir.
            </h1>
            <p className="mt-3 max-w-[380px] text-[13px] leading-relaxed text-muted-foreground">
              Participe do observatório e acompanhe projetos, domínios e análises estratégicas.
            </p>
          </div>

          <div className="my-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {success ? "solicitação enviada" : "solicitação de acesso"}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {success ? (
            <SuccessState email={form.email} />
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                  Solicitar acesso ao ObiOne
                </h2>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  Preencha as informações abaixo para solicitar acesso ao observatório.
                </p>
              </div>

              <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[12.5px]">
                    Nome completo
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome"
                    autoComplete="name"
                    required
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[12.5px]">
                    E-mail corporativo
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="voce@empresa.com"
                    autoComplete="email"
                    required
                    className="h-10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-[12.5px]">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-[12.5px]">
                      Confirmar senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-[12.5px]">
                    Tipo de usuário
                  </Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as Role })}
                  >
                    <SelectTrigger id="role" className="h-10">
                      <SelectValue placeholder="Selecione o perfil…" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    O perfil define o papel inicial do usuário no observatório. A participação na
                    comunidade e o acesso a domínios e projetos são definidos posteriormente pelas
                    permissões configuradas pelo administrador.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="domain" className="text-[12.5px]">
                    Domínio de interesse
                  </Label>
                  <Select
                    value={form.domainId}
                    onValueChange={(v) => setForm({ ...form, domainId: v })}
                    disabled={domainsLoading || domains.length === 0}
                  >
                    <SelectTrigger id="domain" className="h-10">
                      <SelectValue
                        placeholder={
                          domainsLoading ? "Carregando domínios…" : "Selecione o domínio…"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Os domínios representam áreas estratégicas e contextos analíticos.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="objective" className="text-[12.5px]">
                    Objetivo de acesso
                  </Label>
                  <Textarea
                    id="objective"
                    value={form.objective}
                    onChange={(e) => setForm({ ...form, objective: e.target.value })}
                    placeholder="Descreva resumidamente seu interesse no observatório."
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Campo informativo nesta versão — não é persistido no cadastro.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-10 w-full text-[13px]"
                  disabled={loading || domainsLoading || domains.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando solicitação…
                    </>
                  ) : (
                    "Solicitar acesso"
                  )}
                </Button>

                <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-center text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-mono text-foreground">governança</span> · o acesso ao
                  observatório depende do perfil selecionado, do vínculo com domínios/projetos e das
                  permissões configuradas pelo administrador.
                </p>
              </form>

              <p className="mt-8 text-center text-[12.5px] text-muted-foreground">
                Já possui acesso?{" "}
                <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
                  Entrar
                </Link>
              </p>
            </>
          )}

          <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            © {new Date().getFullYear()} · obione observatory
          </p>
        </div>
      </main>
    </div>
  );
}

function SuccessState({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-sm">
        <CheckCircle2 className="h-5 w-5 text-foreground" />
      </div>
      <h2 className="mt-5 text-[18px] font-semibold tracking-tight text-foreground">
        Tudo certo. Sua solicitação foi enviada.
      </h2>
      <p className="mt-3 max-w-[380px] text-[13px] leading-relaxed text-muted-foreground">
        Seu acesso será analisado por um administrador do domínio. Após aprovação você poderá
        acessar os projetos e recursos vinculados ao seu contexto organizacional.
      </p>

      {email && (
        <div className="mt-6 w-full rounded-md border border-dashed border-border bg-muted/30 px-4 py-3 text-left">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            status
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <span className="truncate text-[12.5px] text-foreground">{email}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              PENDING
            </span>
          </div>
        </div>
      )}

      <Button asChild variant="outline" className="mt-8 h-10 text-[13px]">
        <Link to="/login">
          <ArrowLeft className="h-4 w-4" />
          Voltar para login
        </Link>
      </Button>
    </div>
  );
}
