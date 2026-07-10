import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getDomains } from "@/services/domainService";
import { getProjectById, updateProject } from "@/services/projectService";
import { getUsersByProfile } from "@/services/userService";
import { getMpoCategories } from "@/services/mpoAttributeService";
import type { MpoCategory } from "@/types/mpoAttribute";
import type { Domain as SvcDomain } from "@/types/domain";
import type { User } from "@/types/user";
import type {
  EngagementLevel,
  Project,
  ProjectStatusCode,
  ProjectTypeCode,
  RiskLevel,
} from "@/types/project";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  Gauge,
  Info,
  Loader2,
  PenSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$id_/edit")({
  head: () => ({
    meta: [
      { title: "ObiOne" },
      {
        name: "description",
        content: "Edite os dados cadastrais e o acompanhamento de um projeto observado.",
      },
    ],
  }),
  component: EditProjectPage,
});

const STATUS_LABELS: Record<ProjectStatusCode, string> = {
  OBSERVATION: "Em observação",
  PLANNED: "Planejado",
  ACTIVE: "Em andamento",
  RISK: "Em risco",
  REVIEW: "Em revisão",
  PAUSED: "Pausado",
  CLOSED: "Concluído",
};

const STATUS_OPTIONS: ProjectStatusCode[] = ["OBSERVATION", "PLANNED", "ACTIVE", "RISK", "CLOSED"];

const TYPE_OPTIONS: { value: ProjectTypeCode; label: string }[] = [
  { value: "STRATEGIC", label: "Estratégico" },
  { value: "MANAGERIAL", label: "Gerencial" },
  { value: "HYBRID", label: "Híbrido" },
];

const ENGAGEMENT_OPTIONS: { value: EngagementLevel; label: string }[] = [
  { value: "LOW", label: "Baixo" },
  { value: "MEDIUM", label: "Médio" },
  { value: "HIGH", label: "Alto" },
];

const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: "LOW", label: "Baixo" },
  { value: "MODERATE", label: "Moderado" },
  { value: "HIGH", label: "Elevado" },
  { value: "CRITICAL", label: "Crítico" },
];

interface EditForm {
  name: string;
  summary: string;
  observationalGoal: string;
  domainId: string;
  clientId: string;
  consultantId: string;
  type: ProjectTypeCode;
  status: ProjectStatusCode;
  startDate: string;
  endDate: string;
  progress: string;
  engagement: EngagementLevel;
  risk: RiskLevel;
  attributes: string[];
}

type FormErrors = Partial<Record<"name" | "clientId" | "startDate" | "endDate", string>>;

function toDateInput(value: string | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function EditProjectPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { isClient, loading: userLoading } = useCurrentUser();

  // Clients cannot edit projects — redirect to the project detail.
  useEffect(() => {
    if (!userLoading && isClient) {
      navigate({ to: "/projects/$id", params: { id } });
    }
  }, [isClient, userLoading, id, navigate]);

  const [project, setProject] = useState<Project | null>(null);
  const [domains, setDomains] = useState<SvcDomain[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [consultants, setConsultants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<EditForm | null>(null);
  const [mpoCategories, setMpoCategories] = useState<MpoCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProjectById(id),
      getDomains(),
      getUsersByProfile("CLIENT"),
      getUsersByProfile("CONSULTANT"),
      getMpoCategories().catch(() => [] as MpoCategory[]),
    ])
      .then(([p, domainList, clientList, consultantList, categories]) => {
        if (cancelled) return;
        setDomains(domainList);
        setClients(clientList);
        setConsultants(consultantList);
        setMpoCategories(categories);
        setProject(p);
        if (p) {
          setForm({
            name: p.name,
            summary: p.summary ?? "",
            observationalGoal: p.observationObjective ?? "",
            domainId: p.domainId ?? "",
            clientId: p.clientId ?? "",
            consultantId: p.consultantId ?? "",
            type: p.type,
            status: p.status,
            startDate: toDateInput(p.startDate),
            endDate: toDateInput(p.expectedEndDate),
            progress: String(p.progress ?? 0),
            engagement: p.clientEngagement,
            risk: p.riskLevel,
            attributes: p.initialAttributeIds ?? [],
          });
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProject(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // The current status may be a legacy code (REVIEW/PAUSED) outside the
  // editable set — keep it as an extra option so saving does not change it silently.
  const statusOptions =
    form && !STATUS_OPTIONS.includes(form.status)
      ? [...STATUS_OPTIONS, form.status]
      : STATUS_OPTIONS;

  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const validate = (f: EditForm): FormErrors => {
    const next: FormErrors = {};
    if (!f.name.trim()) next.name = "Informe o nome do projeto.";
    if (!f.clientId) next.clientId = "Selecione o cliente do projeto.";
    if (!f.startDate) next.startDate = "Informe a data de início.";
    if (f.startDate && f.endDate && f.endDate < f.startDate) {
      next.endDate = "A previsão de conclusão deve ser igual ou posterior à data de início.";
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || submitting) return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const progress = Math.min(100, Math.max(0, Number(form.progress) || 0));

    setSubmitting(true);
    try {
      const updated = await updateProject(id, {
        name: form.name.trim(),
        summary: form.summary.trim(),
        observationObjective: form.observationalGoal.trim(),
        domainId: form.domainId,
        clientId: form.clientId,
        consultantId: form.consultantId,
        type: form.type,
        status: form.status,
        startDate: form.startDate,
        expectedEndDate: form.endDate,
        progress,
        clientEngagement: form.engagement,
        riskLevel: form.risk,
        initialAttributeIds: form.attributes,
      });
      if (!updated) {
        toast.error("Não foi possível salvar as alterações.");
        return;
      }
      toast.success("Projeto atualizado com sucesso.");
      navigate({ to: "/projects/$id", params: { id } });
    } catch {
      toast.error("Não foi possível salvar as alterações.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader title="Carregando projeto…" />
      </AppShell>
    );
  }

  if (!project || !form) {
    return (
      <AppShell>
        <div className="px-6 py-10 md:px-10">
          <h1 className="text-lg font-semibold">Projeto não encontrado</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Este projeto não está disponível no observatório.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/">Voltar ao observatório</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Editar projeto"
        description="Ajuste os dados cadastrais e o acompanhamento deste projeto observado."
      />

      <div className="mx-auto max-w-4xl px-6 py-8 md:px-10">
        <Link
          to="/projects/$id"
          params={{ id }}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> {project.name}
        </Link>

        <form className="mt-4 space-y-8" onSubmit={handleSubmit} noValidate>
          <Section
            icon={PenSquare}
            title="Identificação do projeto"
            tooltip="Nome, descrição e objetivo observacional são a base do que o observatório registra sobre este projeto."
          >
            <div className="space-y-4">
              <Field label="Nome do projeto" required>
                <Input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Ex.: Reposicionamento Athos Capital"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </Field>
              <Field label="Descrição do projeto">
                <Textarea
                  value={form.summary}
                  onChange={(e) => setField("summary", e.target.value)}
                  rows={5}
                  placeholder="Objetivo, escopo, cliente, prazos, riscos e impacto esperado."
                />
              </Field>
              <Field label="Objetivo observacional">
                <Textarea
                  value={form.observationalGoal}
                  onChange={(e) => setField("observationalGoal", e.target.value)}
                  rows={3}
                  placeholder="Em uma frase, o que importa observar neste projeto."
                />
              </Field>
            </div>
          </Section>

          <Section
            icon={Users}
            title="Vínculos e classificação"
            tooltip="Domínio, cliente e consultor definem quem participa da comunidade do projeto e onde ele aparece no observatório."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Domínio">
                <Select value={form.domainId} onValueChange={(v) => setField("domainId", v)}>
                  <SelectTrigger>
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
              </Field>
              <Field label="Cliente" required>
                <Select value={form.clientId} onValueChange={(v) => setField("clientId", v)}>
                  <SelectTrigger aria-invalid={!!errors.clientId}>
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
                {errors.clientId && <FieldError>{errors.clientId}</FieldError>}
              </Field>
              <Field label="Consultor responsável">
                <Select
                  value={form.consultantId}
                  onValueChange={(v) => setField("consultantId", v)}
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
                  value={form.type}
                  onValueChange={(v) => setField("type", v as ProjectTypeCode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section
            icon={Gauge}
            title="Status e acompanhamento"
            tooltip="Estado atual do projeto na visão do consultor: status, progresso, engajamento do cliente e risco percebido."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status do projeto">
                <Select
                  value={form.status}
                  onValueChange={(v) => setField("status", v as ProjectStatusCode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
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
                  value={form.progress}
                  onChange={(e) => setField("progress", e.target.value)}
                />
              </Field>
              <Field label="Engajamento do cliente">
                <Select
                  value={form.engagement}
                  onValueChange={(v) => setField("engagement", v as EngagementLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENGAGEMENT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Risco atual">
                <Select value={form.risk} onValueChange={(v) => setField("risk", v as RiskLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section
            icon={CalendarDays}
            title="Cronograma"
            tooltip="O observatório usa as datas para situar as observações na linha do tempo do projeto."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data de início" required>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  aria-invalid={!!errors.startDate}
                />
                {errors.startDate && <FieldError>{errors.startDate}</FieldError>}
              </Field>
              <Field label="Previsão de conclusão">
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  aria-invalid={!!errors.endDate}
                />
                {errors.endDate && <FieldError>{errors.endDate}</FieldError>}
              </Field>
            </div>
          </Section>

          <Section
            icon={Sparkles}
            title="Aspectos a observar"
            tooltip="Os compromissos de observação deste projeto: o que o consultor declarou acompanhar. A IA prioriza estes aspectos ao sugerir observações."
          >
            <div className="space-y-4">
              {mpoCategories.map((cat) => (
                <div key={cat.key} className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {cat.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cat.attributes
                      .filter((a) => a.type !== "fora_de_escopo")
                      .map((a) => {
                        const selected = form.attributes.includes(a.id);
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() =>
                              setField(
                                "attributes",
                                selected
                                  ? form.attributes.filter((v) => v !== a.id)
                                  : [...form.attributes, a.id],
                              )
                            }
                            className={cn(
                              "rounded-full border px-3 py-1 text-[12px] transition-colors",
                              selected
                                ? "border-foreground bg-foreground text-background"
                                : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                            )}
                          >
                            {a.name}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-6">
            <Button asChild type="button" variant="outline">
              <Link to="/projects/$id" params={{ id }}>
                Cancelar
              </Link>
            </Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Salvando…
                </>
              ) : (
                <>
                  <PenSquare className="h-3.5 w-3.5" />
                  Salvar alterações
                </>
              )}
            </Button>
          </div>
        </form>
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
