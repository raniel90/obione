import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
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
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <ObiOneMark size={36} />
          <h1 className="text-2xl font-bold">Entrar no ObiOne</h1>
          <p className="text-sm text-muted-foreground">Observatório de Projetos</p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          {serverError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        {import.meta.env.DEV && (
          <div className="mt-4 rounded-xl border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Contas de demonstração</span>
              <span className="font-mono text-xs text-muted-foreground">
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
            <p className="mt-2 text-xs text-muted-foreground">
              Clique para entrar direto com aquele papel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
