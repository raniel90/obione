import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ObiOneMark } from "@/components/obione-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { login as loginService } from "@/services/authService";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — ObiOne" },
      {
        name: "description",
        content: "Acesse o ObiOne, Observatório Inteligente de Projetos.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginService(email, password);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação");
      setLoading(false);
    }
  };

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
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
        >
          <ObiOneMark size={20} />
          ObiOne
        </Link>
        <Link
          to="/register"
          className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Criar conta
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

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12.5px]">
                E-mail corporativo
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                autoComplete="email"
                required
                className="h-10"
              />
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
                    setError(
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="h-10"
              />
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Autenticando…
                </>
              ) : (
                "Entrar no observatório"
              )}
            </Button>

            <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-center text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-mono text-foreground">demo</span> · use{" "}
              <span className="font-mono">admin@obione.dev</span> /{" "}
              <span className="font-mono">admin123</span>
            </p>
          </form>

          <p className="mt-8 text-center text-[12.5px] text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link
              to="/register"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Criar conta
            </Link>
          </p>

          <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            © {new Date().getFullYear()} · obione observatory
          </p>
        </div>
      </main>
    </div>
  );
}
