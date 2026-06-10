import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppShell, PageHeader } from "@/components/app-shell";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getDomains } from "@/services/domainService";
import { createProject } from "@/services/projectService";
import { getUsersByProfile } from "@/services/userService";
import { getMpoCategories } from "@/services/mpoAttributeService";
import { suggestProjectSetup } from "@/services/aiService";
import type { ProjectSetupSuggestion } from "@/services/aiService";
import type { MpoCategory } from "@/types/mpoAttribute";
import type { Domain as SvcDomain } from "@/types/domain";
import type { User } from "@/types/user";
import type { ProjectStatusCode, ProjectTypeCode } from "@/types/project";
import { toast } from "sonner";
import {
  Telescope,
  Radar,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/new")({
  head: () => ({
    meta: [
      { title: "Novo projeto — ObiOne" },
      {
        name: "description",
        content: "Cadastre um projeto como caso observado dentro de um domínio organizacional.",
      },
    ],
  }),
  component: NewProjectPage,
});

type ProjectModel = "Estratégico" | "Gerencial" | "Híbrido";
type ProjectStatus = "em-observação" | "planejado" | "em-andamento" | "em-risco" | "concluído";

const STATUS: { value: ProjectStatus; label: string }[] = [
  { value: "em-observação", label: "Em observação" },
  { value: "planejado", label: "Planejado" },
  { value: "em-andamento", label: "Em andamento" },
  { value: "em-risco", label: "Em risco" },
  { value: "concluído", label: "Concluído" },
];

const PHENOMENA = [
  "Mudanças recorrentes de escopo",
  "Baixa participação do cliente",
  "Atraso em validações",
  "Retrabalho criativo",
  "Volatilidade de requisitos",
  "Risco de atraso",
  "Baixa documentação",
  "Alto engajamento colaborativo",
];

const typeMap: Record<ProjectModel, ProjectTypeCode> = {
  Estratégico: "STRATEGIC",
  Gerencial: "MANAGERIAL",
  Híbrido: "HYBRID",
};
const statusMap: Record<ProjectStatus, ProjectStatusCode> = {
  "em-observação": "OBSERVATION",
  planejado: "PLANNED",
  "em-andamento": "ACTIVE",
  "em-risco": "RISK",
  concluído: "CLOSED",
};

const AI_MIN_DESCRIPTION = 40;

const storySchema = z.object({
  name: z.string().trim().min(1, "Dê um nome ao projeto."),
  summary: z.string().trim().min(1, "Descreva o projeto — é o insumo do observatório."),
  observationalGoal: z.string().trim(),
});
type StoryForm = z.infer<typeof storySchema>;

function NewProjectPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<ProjectSetupSuggestion | null>(null);

  const [domains, setDomains] = useState<SvcDomain[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [consultants, setConsultants] = useState<User[]>([]);
  const [mpoCategories, setMpoCategories] = useState<MpoCategory[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm<StoryForm>({
    resolver: zodResolver(storySchema),
    defaultValues: { name: "", summary: "", observationalGoal: "" },
  });

  const [review, setReview] = useState({
    domainId: "",
    clientId: "",
    consultantId: "",
    model: "Estratégico" as ProjectModel,
    status: "em-observação" as ProjectStatus,
    startDate: "",
    endDate: "",
    attributes: [] as string[],
    phenomena: [] as string[],
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getDomains(),
      getUsersByProfile("CLIENT"),
      getUsersByProfile("CONSULTANT"),
      getMpoCategories(),
    ]).then(([domainList, clientList, consultantList, categories]) => {
      if (cancelled) return;
      setDomains(domainList);
      setClients(clientList);
      setConsultants(consultantList);
      setMpoCategories(categories);
      setReview((r) => ({
        ...r,
        domainId: r.domainId || domainList[0]?.id || "",
        clientId: r.clientId || clientList[0]?.id || "",
        consultantId: r.consultantId || consultantList[0]?.id || "",
      }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const summaryValue = watch("summary");
  const aiReady = (summaryValue?.trim().length ?? 0) >= AI_MIN_DESCRIPTION;

  const phenomenonOptions = useMemo(() => {
    const fromSuggestion = suggestion?.expectedPhenomena ?? [];
    return [...new Set([...fromSuggestion, ...PHENOMENA])];
  }, [suggestion]);

  const toggleReviewArray = (key: "attributes" | "phenomena", value: string) =>
    setReview((r) => ({
      ...r,
      [key]: r[key].includes(value) ? r[key].filter((v) => v !== value) : [...r[key], value],
    }));

  const goToReviewWithAi = handleSubmit(async (values) => {
    setAiLoading(true);
    try {
      const s = await suggestProjectSetup({
        name: values.name,
        description: values.summary,
        observationObjective: values.observationalGoal || undefined,
      });
      setSuggestion(s);
      setReview((r) => ({
        ...r,
        domainId: s.suggestedDomainId != null ? String(s.suggestedDomainId) : r.domainId,
        attributes: s.attributeIds.length > 0 ? s.attributeIds : r.attributes,
        phenomena: s.expectedPhenomena.length > 0 ? s.expectedPhenomena : r.phenomena,
      }));
    } catch {
      toast.error("A IA não respondeu — siga revisando manualmente.");
      setSuggestion(null);
    } finally {
      setAiLoading(false);
      setStep(2);
    }
  });

  const goToReviewManually = handleSubmit(() => {
    setSuggestion(null);
    setStep(2);
  });

  const onCreate = async () => {
    if (submitting) return;
    const story = getValues();
    setSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const created = await createProject({
        name: story.name,
        domainId: review.domainId,
        clientId: review.clientId,
        consultantId: review.consultantId,
        type: typeMap[review.model],
        status: statusMap[review.status],
        summary: story.summary,
        observationObjective: story.observationalGoal,
        initialAttributeIds: review.attributes,
        expectedPhenomena: review.phenomena,
        progress: 0,
        riskLevel: "LOW",
        clientEngagement: "MEDIUM",
        startDate: review.startDate || today,
        expectedEndDate: review.endDate || today,
        suggestionId: suggestion?.suggestionId,
      });
      setSubmitted(true);
      setTimeout(() => navigate({ to: "/projects/$id", params: { id: created.id } }), 1800);
    } catch {
      toast.error("Não foi possível cadastrar o projeto.");
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
          <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-success/30 bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <h2 className="mt-5 text-[17px] font-semibold tracking-tight text-foreground">
              Projeto cadastrado com sucesso
            </h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
              Projeto cadastrado com sucesso e adicionado ao observatório.
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
              redirecionando…
            </p>
            <div className="mt-6">
              <Button asChild size="sm" className="text-[12px]">
                <Link to="/">
                  Ir para o observatório
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Novo Projeto"
        description="Conte o que é o projeto; a IA propõe o que o observatório deve acompanhar — você revisa e confirma."
      />

      <div className="mx-auto max-w-4xl px-6 py-8 md:px-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          etapa {step}/2 · {step === 1 ? "conte sobre o projeto" : "revise e confirme"}
        </p>

        {step === 1 ? (
          <form className="mt-4 space-y-8" onSubmit={goToReviewWithAi}>
            <Section
              icon={Telescope}
              eyebrow="01 · o projeto"
              title="Conte sobre o projeto"
              description="A descrição é o insumo do observatório: a partir dela a IA sugere o domínio, os aspectos a observar e os fenômenos esperados."
            >
              <div className="space-y-4">
                <Field label="Nome do projeto" required>
                  <Input
                    {...register("name")}
                    placeholder="Ex.: Reposicionamento Athos Capital"
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <FieldError>{errors.name.message}</FieldError>}
                </Field>
                <Field label="Descrição do projeto" required>
                  <Textarea
                    {...register("summary")}
                    rows={6}
                    placeholder="Descreva o projeto com suas palavras: objetivo, escopo, cliente, prazos, riscos e o impacto esperado. Quanto mais contexto, melhores as sugestões da IA."
                    aria-invalid={!!errors.summary}
                  />
                  {errors.summary && <FieldError>{errors.summary.message}</FieldError>}
                  {!aiReady && (
                    <p className="text-[11px] text-muted-foreground">
                      Escreva pelo menos {AI_MIN_DESCRIPTION} caracteres para habilitar as sugestões
                      da IA.
                    </p>
                  )}
                </Field>
                <Field label="O que você quer acompanhar?">
                  <Textarea
                    {...register("observationalGoal")}
                    rows={3}
                    placeholder="Em uma frase, diga o que importa observar neste projeto (ex.: risco de atraso, engajamento do cliente, mudanças de escopo)."
                  />
                </Field>
              </div>
            </Section>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
              <button
                type="button"
                onClick={goToReviewManually}
                className="text-[12.5px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Preencher manualmente
              </button>
              <Button type="submit" disabled={!aiReady || aiLoading} className="gap-1.5">
                {aiLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Consultando a IA…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Continuar com IA
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-8">
            {suggestion && (
              <div className="rounded-xl border border-dashed border-foreground/30 bg-foreground/[0.02] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Sparkles className="h-4 w-4 text-foreground" />
                  <p className="text-[13px] font-medium text-foreground">
                    Sugestão da IA — revise antes de confirmar
                  </p>
                  <span className="ml-auto rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {suggestion.provider} · {suggestion.model}
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  {suggestion.rationale}
                </p>
              </div>
            )}

            <Section
              icon={Telescope}
              eyebrow="02 · domínio"
              title="Domínio do projeto"
              description="Em qual área do portfólio este projeto vive."
            >
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={review.domainId}
                  onValueChange={(v) => setReview((r) => ({ ...r, domainId: v }))}
                >
                  <SelectTrigger className="w-72">
                    <SelectValue placeholder="Selecione o domínio" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {suggestion?.suggestedDomainId != null &&
                  String(suggestion.suggestedDomainId) === review.domainId && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      sugerido · {Math.round(suggestion.confidence * 100)}%
                    </span>
                  )}
              </div>
            </Section>

            <Section
              icon={Sparkles}
              eyebrow="03 · o que observar"
              title="Aspectos a observar"
              description="Marque o que você quer acompanhar neste projeto desde o início: riscos, escopo, prazos, custos e outros. Dá para incluir mais depois, ao registrar observações."
            >
              <div className="space-y-4">
                {mpoCategories.map((cat) => (
                  <div key={cat.key} className="space-y-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {cat.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cat.attributes
                        .filter((a) => a.type !== "fora_de_escopo")
                        .map((a) => {
                          const selected = review.attributes.includes(a.id);
                          const fromAi = suggestion?.attributeIds.includes(a.id) ?? false;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => toggleReviewArray("attributes", a.id)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] transition-colors",
                                selected
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                              )}
                            >
                              {fromAi && <Sparkles className="h-3 w-3" />}
                              {a.name}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              icon={Radar}
              eyebrow="04 · fenômenos"
              title="Fenômenos esperados"
              description="Padrões ou comportamentos que você acha que podem surgir no projeto (ex.: atrasos, mudanças de escopo, baixa participação do cliente). Funcionam como hipóteses para o observatório acompanhar."
            >
              <div className="flex flex-wrap gap-2">
                {phenomenonOptions.map((p) => {
                  const selected = review.phenomena.includes(p);
                  const fromAi = suggestion?.expectedPhenomena.includes(p) ?? false;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleReviewArray("phenomena", p)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] transition-colors",
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      )}
                    >
                      {fromAi && <Sparkles className="h-3 w-3" />}
                      {p}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {"// 05 · detalhes · opcional"}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold tracking-tight text-foreground">
                    Cliente, consultor, tipo, status e datas
                  </p>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2">
                  <Field label="Cliente">
                    <Select
                      value={review.clientId}
                      onValueChange={(v) => setReview((r) => ({ ...r, clientId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Consultor responsável">
                    <Select
                      value={review.consultantId}
                      onValueChange={(v) => setReview((r) => ({ ...r, consultantId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o consultor" />
                      </SelectTrigger>
                      <SelectContent>
                        {consultants.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tipo do projeto">
                    <Select
                      value={review.model}
                      onValueChange={(v) => setReview((r) => ({ ...r, model: v as ProjectModel }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Estratégico">Estratégico</SelectItem>
                        <SelectItem value="Gerencial">Gerencial</SelectItem>
                        <SelectItem value="Híbrido">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Status inicial">
                    <Select
                      value={review.status}
                      onValueChange={(v) =>
                        setReview((r) => ({ ...r, status: v as ProjectStatus }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Data de início">
                    <Input
                      type="date"
                      value={review.startDate}
                      onChange={(e) => setReview((r) => ({ ...r, startDate: e.target.value }))}
                    />
                  </Field>
                  <Field label="Previsão de conclusão">
                    <Input
                      type="date"
                      value={review.endDate}
                      onChange={(e) => setReview((r) => ({ ...r, endDate: e.target.value }))}
                    />
                  </Field>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex items-center justify-between gap-2 border-t border-border pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </Button>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                  <Link to="/">Cancelar</Link>
                </Button>
                <Button type="button" onClick={onCreate} disabled={submitting} className="gap-1.5">
                  <Telescope className="h-3.5 w-3.5" />
                  {submitting ? "Cadastrando…" : "Cadastrar projeto"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Section({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {"// "}
            {eyebrow}
          </p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[12.5px]">
        {label}
        {required && <span className="ml-1 text-muted-foreground">*</span>}
      </Label>
      {children}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-destructive">{children}</p>;
}
