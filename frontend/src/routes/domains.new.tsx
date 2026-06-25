import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { domainTypeOptions, indicatorOptions } from "@/lib/domain-observatory";
import { createDomain } from "@/services/domainService";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/domains/new")({
  head: () => ({
    meta: [
      { title: "Novo domínio observacional — ObiOne" },
      {
        name: "description",
        content: "Cadastre um novo contexto analítico para observar projetos no ObiOne.",
      },
    ],
  }),
  component: NewDomainPage,
});

interface FormState {
  name: string;
  description: string;
  objective: string;
  type: (typeof domainTypeOptions)[number];
  indicators: string[];
}

const initial: FormState = {
  name: "",
  description: "",
  objective: "",
  type: "Estratégico",
  indicators: [],
};

function NewDomainPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initial);
  const [success, setSuccess] = useState(false);

  function toggleIndicator(name: string) {
    setForm((f) => ({
      ...f,
      indicators: f.indicators.includes(name)
        ? f.indicators.filter((i) => i !== name)
        : [...f.indicators, name],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const typeMap = {
      Estratégico: "STRATEGIC",
      Gerencial: "MANAGERIAL",
      Híbrido: "HYBRID",
      Acadêmico: "ACADEMIC",
    } as const;
    try {
      await createDomain({
        slug: form.name.toLowerCase().replace(/\s+/g, "-"),
        name: form.name,
        description: form.description,
        type: typeMap[form.type],
        observationObjective: form.objective,
        priorityIndicators: form.indicators,
        expectedPhenomena: [],
        status: "FORMING",
        projectCount: 0,
        participantCount: 0,
        discussionCount: 0,
        knowledgeCount: 0,
        phenomenonCount: 0,
        engagementRate: 0,
      });
    } catch {
      /* noop */
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-6 py-20 text-center md:px-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-foreground">
            Domínio criado com sucesso.
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            “{form.name}” foi adicionado como novo contexto observacional. O observatório começará a
            coletar evidências assim que projetos forem vinculados.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/domains" })}>
              Voltar aos domínios
            </Button>
            <Button
              onClick={() => {
                setForm(initial);
                setSuccess(false);
              }}
            >
              Cadastrar outro
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Novo domínio observacional"
        description="Defina um novo núcleo de observação para agrupar projetos por contexto estratégico."
      />

      <form onSubmit={submit} className="mx-auto max-w-2xl px-6 py-8 md:px-10">
        <div className="space-y-5 rounded-xl border border-border bg-card p-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome do domínio</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: Marketing Estratégico"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição contextual</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descreva o escopo e a especialização deste contexto observacional."
              rows={3}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="objective">Objetivo observacional</Label>
            <Textarea
              id="objective"
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              placeholder="O que o observatório deve acompanhar dentro deste contexto?"
              rows={2}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="type">Tipo de domínio</Label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as FormState["type"] })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            >
              {domainTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Indicadores prioritários</Label>
            <div className="flex flex-wrap gap-1.5">
              {indicatorOptions.map((opt) => {
                const active = form.indicators.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleIndicator(opt)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Selecione um ou mais atributos intermediários que o observatório priorizará.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button asChild variant="outline">
            <Link to="/domains">Cancelar</Link>
          </Button>
          <Button type="submit">Criar domínio</Button>
        </div>
      </form>
    </AppShell>
  );
}
