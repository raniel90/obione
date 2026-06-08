import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ObiOneMark } from "@/components/obione-logo";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

// Demo seed accounts — only shown in dev to switch roles in one click.
const DEMO_PASSWORD = "demo12345678";
const DEMO_ACCOUNTS = [
  { label: "Consultor", email: "consultor@obione.dev" },
  { label: "Admin", email: "admin@obione.dev" },
  { label: "Cliente 1", email: "cliente1@obione.dev" },
  { label: "Cliente 2", email: "cliente2@obione.dev" },
  { label: "Cliente 3", email: "cliente3@obione.dev" },
];

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await auth.login(values.email, values.password);
      navigate("/", { replace: true });
    } catch {
      setServerError("Credenciais inválidas. Confira email e senha.");
    }
  }

  function quickLogin(email: string) {
    setValue("email", email);
    setValue("password", DEMO_PASSWORD);
    onSubmit({ email, password: DEMO_PASSWORD });
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* subtle ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-dotgrid opacity-[0.35] dark:opacity-[0.18]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
      />

      {/* top-left brand */}
      <header className="relative z-10 flex items-center px-6 py-5 md:px-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
        >
          <ObiOneMark size={20} />
          ObiOne
        </Link>
      </header>

      {/* centered content */}
      <main className="relative z-10 flex min-h-[calc(100vh-72px)] items-start justify-center px-6 pb-20 pt-6 md:items-center md:pt-0">
        <div className="w-full max-w-[400px]">
          {/* branding block */}
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
            <p className="mt-3 max-w-[340px] text-[13px] leading-relaxed text-muted-foreground">
              Observe projetos, organize conhecimento e acompanhe decisões
              estratégicas em um só lugar.
            </p>
          </div>

          {/* divider */}
          <div className="my-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              acesso
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* form */}
          <div className="text-center">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
              Acesse o ObiOne
            </h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Entre com suas credenciais para acessar o observatório.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12.5px]">
                E-mail corporativo
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="h-10"
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[12.5px]">
                  Senha
                </Label>
                <button
                  type="button"
                  className="text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() =>
                    setServerError(
                      "Solicite a redefinição ao administrador do seu domínio.",
                    )
                  }
                >
                  Esqueci minha senha
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className="h-10"
                {...register("password")}
              />
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <Button type="submit" className="h-10 w-full text-[13px]" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Autenticando…
                </>
              ) : (
                "Entrar no observatório"
              )}
            </Button>

            {import.meta.env.DEV && (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    demo
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    senha: {DEMO_PASSWORD}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <Button
                      key={acc.email}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-between font-normal"
                      disabled={isSubmitting}
                      onClick={() => quickLogin(acc.email)}
                    >
                      <span className="font-medium">{acc.label}</span>
                      <span className="text-xs text-muted-foreground">{acc.email}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </form>

          <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            © {new Date().getFullYear()} · obione observatory
          </p>
        </div>
      </main>
    </div>
  );
}
