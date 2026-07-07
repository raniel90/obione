import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
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
import { getUsersByProfile, createUser } from "@/services/userService";
import { getMpoCategories } from "@/services/mpoAttributeService";
import { suggestProjectSetup } from "@/services/aiService";
import type { ProjectSetupSuggestion } from "@/services/aiService";
import type { MpoCategory } from "@/types/mpoAttribute";
import type { Domain as SvcDomain } from "@/types/domain";
import type { User } from "@/types/user";
import type {
  EngagementLevel as EngagementCode,
  ProjectStatusCode,
  ProjectTypeCode,
  RiskLevel as RiskCode,
} from "@/types/project";
import { toast } from "sonner";
import {
  Telescope,
  Sparkles,
  Users,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronsUpDown,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  summary: z
    .string()
    .trim()
    .min(1, "Descreva o projeto: é a partir dele que o observatório trabalha."),
  observationalGoal: z.string().trim(),
});
type StoryForm = z.infer<typeof storySchema>;

function NewProjectPage() {
  const navigate = useNavigate();
  const { isClient, loading: userLoading } = useCurrentUser();

  // Clients cannot create projects — redirect to home.
  useEffect(() => {
    if (!userLoading && isClient) {
      navigate({ to: "/" });
    }
  }, [isClient, userLoading, navigate]);

  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<ProjectSetupSuggestion | null>(null);

  const [domains, setDomains] = useState<SvcDomain[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [consultants, setConsultants] = useState<User[]>([]);
  const [mpoCategories, setMpoCategories] = useState<MpoCategory[]>([]);

  // Inline "novo cliente" (mantém o cadastro do cliente dentro do fluxo do wizard).
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", password: "" });
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientError, setNewClientError] = useState<string | undefined>();

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
    progress: 0,
    engagement: "MEDIUM" as EngagementCode,
    risk: "LOW" as RiskCode,
    attributes: [] as string[],
  });
  const [reviewErrors, setReviewErrors] = useState<{
    clientId?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const handleCreateClient = async () => {
    const name = newClient.name.trim();
    const email = newClient.email.trim();
    const password = newClient.password;
    if (!name || !email || !password) {
      setNewClientError("Preencha nome, e-mail e senha.");
      return;
    }
    setCreatingClient(true);
    setNewClientError(undefined);
    try {
      const created = await createUser({
        name,
        email,
        password,
        profileCode: "CLIENT",
        status: "ACTIVE",
        domainIds: [],
        projectIds: [],
      });
      setClients((cs) => [...cs, created]);
      setReview((r) => ({ ...r, clientId: created.id }));
      setReviewErrors((e) => ({ ...e, clientId: undefined }));
      setNewClient({ name: "", email: "", password: "" });
      setShowNewClient(false);
      toast.success(`Cliente "${created.name}" criado e selecionado.`);
    } catch (err) {
      setNewClientError(
        err instanceof Error ? err.message : "Não foi possível criar o cliente.",
      );
    } finally {
      setCreatingClient(false);
    }
  };

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
        // Client intentionally has no default — linking a client is an explicit decision.
        consultantId: r.consultantId || consultantList[0]?.id || "",
      }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const summaryValue = watch("summary");
  const aiReady = (summaryValue?.trim().length ?? 0) >= AI_MIN_DESCRIPTION;

  const toggleReviewArray = (key: "attributes", value: string) =>
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
      }));
    } catch {
      toast.error("A IA não respondeu. Siga revisando manualmente.");
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

    const errors: typeof reviewErrors = {};
    if (!review.clientId) errors.clientId = "Selecione o cliente do projeto.";
    if (!review.startDate) errors.startDate = "Informe a data de início.";
    if (review.startDate && review.endDate && review.endDate < review.startDate) {
      errors.endDate = "A conclusão não pode ser antes do início.";
    }
    if (Object.keys(errors).length > 0) {
      setReviewErrors(errors);
      toast.error("Preencha os campos obrigatórios para cadastrar.");
      return;
    }

    const story = getValues();
    setSubmitting(true);
    try {
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
        expectedPhenomena: [],
        progress: review.progress,
        riskLevel: review.risk,
        clientEngagement: review.engagement,
        startDate: review.startDate,
        expectedEndDate: review.endDate,
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
              Levando você ao detalhe do projeto…
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
        description="Conte o que é o projeto; a IA propõe o que acompanhar e você revisa antes de cadastrar."
      />

      <div className="mx-auto max-w-4xl px-6 py-8 md:px-10">
        <p className="text-[12px] text-muted-foreground">
          Etapa {step} de 2 · {step === 1 ? "Conte sobre o projeto" : "Revise e confirme"}
        </p>

        {step === 1 ? (
          <form className="mt-4 space-y-8" onSubmit={goToReviewWithAi}>
            <Section
              icon={Telescope}
              title="Conte sobre o projeto"
              tooltip="A descrição é o insumo do observatório: a partir dela a IA sugere o domínio e os aspectos a observar."
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
                    Sugestão da IA: revise antes de confirmar
                  </p>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  {suggestion.rationale}
                </p>
              </div>
            )}

            <Section
              icon={Telescope}
              title="Domínio do projeto"
              tooltip="A área de atuação da consultoria que agrupa este projeto."
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
              title="Aspectos a observar"
              tooltip="O que acompanhar desde o início: riscos, escopo, prazos, custos. Dá para incluir mais depois, ao registrar observações."
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
              icon={Users}
              title="Cliente e prazos"
              tooltip="Quem é o cliente deste caso e a janela de observação do projeto."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cliente" required>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={review.clientId}
                        onValueChange={(v) => {
                          setReview((r) => ({ ...r, clientId: v }));
                          setReviewErrors((e) => ({ ...e, clientId: undefined }));
                        }}
                      >
                        <SelectTrigger aria-invalid={!!reviewErrors.clientId} className="w-full">
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
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewClient((s) => !s);
                        setNewClientError(undefined);
                      }}
                    >
                      {showNewClient ? "Cancelar" : "+ Novo cliente"}
                    </Button>
                  </div>
                  {reviewErrors.clientId && <FieldError>{reviewErrors.clientId}</FieldError>}
                  {showNewClient && (
                    <div className="mt-3 space-y-2 rounded-md border border-border/60 bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">
                        Cadastre um cliente novo. Ele poderá entrar com este e-mail e senha.
                      </p>
                      <Input
                        placeholder="Nome do cliente"
                        value={newClient.name}
                        onChange={(e) =>
                          setNewClient((c) => ({ ...c, name: e.target.value }))
                        }
                      />
                      <Input
                        type="email"
                        placeholder="E-mail"
                        value={newClient.email}
                        onChange={(e) =>
                          setNewClient((c) => ({ ...c, email: e.target.value }))
                        }
                      />
                      <Input
                        type="password"
                        placeholder="Senha provisória"
                        value={newClient.password}
                        onChange={(e) =>
                          setNewClient((c) => ({ ...c, password: e.target.value }))
                        }
                      />
                      {newClientError && <FieldError>{newClientError}</FieldError>}
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateClient}
                        disabled={creatingClient}
                      >
                        {creatingClient ? "Criando..." : "Criar e selecionar"}
                      </Button>
                    </div>
                  )}
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
                <Field label="Data de início" required>
                  <Input
                    type="date"
                    value={review.startDate}
                    aria-invalid={!!reviewErrors.startDate}
                    onChange={(e) => {
                      setReview((r) => ({ ...r, startDate: e.target.value }));
                      setReviewErrors((er) => ({
                        ...er,
                        startDate: undefined,
                        endDate: undefined,
                      }));
                    }}
                  />
                  {reviewErrors.startDate && <FieldError>{reviewErrors.startDate}</FieldError>}
                </Field>
                <Field label="Conclusão">
                  <Input
                    type="date"
                    value={review.endDate}
                    aria-invalid={!!reviewErrors.endDate}
                    onChange={(e) => {
                      setReview((r) => ({ ...r, endDate: e.target.value }));
                      setReviewErrors((er) => ({ ...er, endDate: undefined }));
                    }}
                  />
                  {reviewErrors.endDate && <FieldError>{reviewErrors.endDate}</FieldError>}
                </Field>
              </div>
            </Section>

            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left">
                <div>
                  <p className="text-[14px] font-semibold tracking-tight text-foreground">
                    Tipo, status e indicadores
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Opcional. Tudo pode ser ajustado depois.
                  </p>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2">
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
                  <Field label="Status do projeto">
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
                  <Field label="Progresso (%)">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={review.progress}
                      onChange={(e) =>
                        setReview((r) => ({
                          ...r,
                          progress: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Engajamento do cliente">
                    <Select
                      value={review.engagement}
                      onValueChange={(v) =>
                        setReview((r) => ({ ...r, engagement: v as EngagementCode }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Baixo</SelectItem>
                        <SelectItem value="MEDIUM">Médio</SelectItem>
                        <SelectItem value="HIGH">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Risco atual">
                    <Select
                      value={review.risk}
                      onValueChange={(v) => setReview((r) => ({ ...r, risk: v as RiskCode }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Baixo</SelectItem>
                        <SelectItem value="MODERATE">Moderado</SelectItem>
                        <SelectItem value="HIGH">Elevado</SelectItem>
                        <SelectItem value="CRITICAL">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
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
  title,
  tooltip,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
          {tooltip && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info
                    className="h-3.5 w-3.5 cursor-help text-muted-foreground/70 transition-colors hover:text-foreground"
                    aria-label={`Sobre ${title}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-[12px] leading-relaxed">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
