import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { getDomains } from "@/services/domainService";
import { createProject } from "@/services/projectService";
import { getUsersByProfile } from "@/services/userService";
import { getMpoCategories } from "@/services/mpoAttributeService";
import type { Domain as SvcDomain } from "@/types/domain";
import type { User } from "@/types/user";
import type { MpoCategory } from "@/types/mpoAttribute";
import type { ProjectStatusCode, ProjectTypeCode } from "@/types/project";
import {
  Telescope,
  Radar,
  Users,
  FileText,
  Plus,
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
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

const PHASE_LABELS: Record<string, string> = {
  INITIAL: "Inicial",
  TRACKING: "Acompanhamento",
  CLOSURE: "Encerramento",
};

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

const ARTIFACT_TYPES = [
  "Briefing",
  "Cronograma",
  "Proposta",
  "Ata",
  "Relatório",
  "Pesquisa",
  "Plano de marketing",
  "Lições aprendidas",
];

interface Artifact {
  id: string;
  name: string;
  type: string;
  description: string;
}

function NewProjectPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [domains, setDomains] = useState<SvcDomain[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [consultants, setConsultants] = useState<User[]>([]);
  const [mpoCategories, setMpoCategories] = useState<MpoCategory[]>([]);
  const [form, setForm] = useState({
    name: "",
    domainId: "",
    clientId: "",
    consultantId: "",
    model: "Estratégico" as ProjectModel,
    status: "em-observação" as ProjectStatus,
    startDate: "",
    endDate: "",
    summary: "",
    observationalGoal: "",
    attributes: ["GERAL-01", "ESCO-03", "STAK-01"] as string[],
    phenomena: ["Risco de atraso"] as string[],
    participants: [
      "Lucas Martins — Consultor",
      "Cliente Athos Capital — Cliente",
      "Ana Coelho — Administrador",
    ],
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
      setForm((f) => ({
        ...f,
        domainId: f.domainId || domainList[0]?.id || "",
        clientId: f.clientId || clientList[0]?.id || "",
        consultantId: f.consultantId || consultantList[0]?.id || "",
      }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [artifactDraft, setArtifactDraft] = useState({
    name: "",
    type: ARTIFACT_TYPES[0],
    description: "",
  });
  const [newParticipant, setNewParticipant] = useState("");

  const toggleArray = (key: "attributes" | "phenomena", value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const addArtifact = () => {
    if (!artifactDraft.name.trim()) return;
    setArtifacts((list) => [...list, { id: crypto.randomUUID(), ...artifactDraft }]);
    setArtifactDraft({ name: "", type: ARTIFACT_TYPES[0], description: "" });
  };

  const removeArtifact = (id: string) => setArtifacts((list) => list.filter((a) => a.id !== id));

  const addParticipant = () => {
    if (!newParticipant.trim()) return;
    setForm((f) => ({ ...f, participants: [...f.participants, newParticipant] }));
    setNewParticipant("");
  };

  const removeParticipant = (p: string) =>
    setForm((f) => ({
      ...f,
      participants: f.participants.filter((x) => x !== p),
    }));

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    const created = await createProject({
      name: form.name,
      domainId: form.domainId,
      clientId: form.clientId,
      consultantId: form.consultantId,
      type: typeMap[form.model],
      status: statusMap[form.status],
      summary: form.summary,
      observationObjective: form.observationalGoal,
      initialAttributeIds: form.attributes,
      expectedPhenomena: form.phenomena,
      progress: 0,
      riskLevel: "LOW",
      clientEngagement: "MEDIUM",
      startDate: form.startDate || today,
      expectedEndDate: form.endDate || today,
    });
    setSubmitted(true);
    setTimeout(() => navigate({ to: "/projects/$id", params: { id: created.id } }), 1800);
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
        description="Cadastre um projeto como caso observado dentro de um domínio organizacional."
      />

      <form onSubmit={onSubmit} className="mx-auto max-w-4xl px-6 py-8 md:px-10 space-y-8">
        {/* Conceito */}
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
              <Telescope className="h-4 w-4 text-foreground" />
            </div>
            <p className="max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
              Cada projeto cadastrado alimenta o observatório com atributos, artefatos, fenômenos e
              observações que serão utilizados para produzir conhecimento.
            </p>
          </div>
        </div>

        {/* SEÇÃO 1 — Dados gerais */}
        <Section
          icon={Layers}
          eyebrow="01 · dados gerais"
          title="Dados gerais do projeto"
          description="Identidade do projeto e seu vínculo com o domínio observacional."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do projeto" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Reposicionamento Athos Capital"
                required
              />
            </Field>
            <Field label="Domínio">
              <Select
                value={form.domainId}
                onValueChange={(v) => setForm({ ...form, domainId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
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
            <Field label="Cliente">
              <Select
                value={form.clientId}
                onValueChange={(v) => setForm({ ...form, clientId: v })}
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
                value={form.consultantId}
                onValueChange={(v) => setForm({ ...form, consultantId: v })}
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
                value={form.model}
                onValueChange={(v) => setForm({ ...form, model: v as ProjectModel })}
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
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}
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
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field label="Previsão de conclusão">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Descrição / resumo estratégico" className="mt-4">
            <Textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={3}
              placeholder="Descreva o objetivo, escopo e impacto esperado do projeto."
            />
          </Field>
        </Section>

        {/* SEÇÃO 2 — Objetivo observacional */}
        <Section
          icon={Telescope}
          eyebrow="02 · observação"
          title="Objetivo observacional"
          description="O objetivo observacional ajuda o ObiOne a interpretar quais fenômenos devem ser acompanhados neste projeto."
        >
          <Textarea
            value={form.observationalGoal}
            onChange={(e) => setForm({ ...form, observationalGoal: e.target.value })}
            rows={4}
            placeholder="Descreva o que deve ser observado neste projeto. Exemplo: riscos de atraso, engajamento do cliente, mudanças de escopo, retrabalho, validações ou aprendizados esperados."
          />
        </Section>

        {/* SEÇÃO 3 — Atributos iniciais MPO */}
        <Section
          icon={Sparkles}
          eyebrow="03 · atributos mpo"
          title="Atributos iniciais"
          description={`Selecione os atributos do Modelo de Observatório de Projetos (MPO) que serão acompanhados desde o início. Selecionados: ${form.attributes.length}/45`}
        >
          {mpoCategories.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground">Carregando catálogo MPO…</p>
          ) : (
            <div className="space-y-5">
              {mpoCategories.map((cat) => (
                <div key={cat.code}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {cat.code}
                    </span>
                    <span className="text-[12px] font-medium text-foreground">{cat.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.attributes.map((attr) => {
                      const selected = form.attributes.includes(attr.code);
                      return (
                        <button
                          key={attr.code}
                          type="button"
                          title={attr.description ?? attr.name}
                          onClick={() => toggleArray("attributes", attr.code)}
                          className={cn(
                            "inline-flex max-w-[260px] items-center gap-1 truncate rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                          )}
                        >
                          <span className="shrink-0 font-mono">{attr.code}</span>
                          <span className="mx-0.5 opacity-40">—</span>
                          <span className="truncate">{attr.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* SEÇÃO 4 — Fenômenos esperados */}
        <Section
          icon={Radar}
          eyebrow="04 · fenômenos"
          title="Fenômenos esperados"
          description="Fenômenos esperados são comportamentos ou padrões que o observatório poderá acompanhar ao longo do projeto."
        >
          <div className="flex flex-wrap gap-2">
            {PHENOMENA.map((p) => {
              const selected = form.phenomena.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleArray("phenomena", p)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[12px] transition-colors",
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </Section>

        {/* SEÇÃO 5 — Participantes iniciais */}
        <Section
          icon={Users}
          eyebrow="05 · comunidade"
          title="Participantes iniciais"
          description="Os participantes vinculados ao projeto poderão interagir na comunidade conforme suas permissões."
        >
          <ul className="space-y-2">
            {form.participants.map((p) => (
              <li
                key={p}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
              >
                <span className="text-[12.5px] text-foreground">{p}</span>
                <button
                  type="button"
                  onClick={() => removeParticipant(p)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Input
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              placeholder="Ex.: Marina Reis — Consultor"
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addParticipant}>
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>
        </Section>

        {/* SEÇÃO 6 — Artefatos iniciais */}
        <Section
          icon={FileText}
          eyebrow="06 · artefatos · opcional"
          title="Artefatos iniciais"
          description="Registre artefatos vinculados ao projeto. O upload de arquivos completos ficará disponível no detalhe do projeto."
        >
          {artifacts.length > 0 && (
            <ul className="mb-4 space-y-2">
              {artifacts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      <span>{a.type}</span>
                    </div>
                    <p className="mt-0.5 text-[13px] font-medium text-foreground">{a.name}</p>
                    {a.description && (
                      <p className="mt-0.5 text-[12px] text-muted-foreground">{a.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeArtifact(a.id)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome do artefato">
                <Input
                  value={artifactDraft.name}
                  onChange={(e) => setArtifactDraft({ ...artifactDraft, name: e.target.value })}
                  placeholder="Ex.: Briefing inicial"
                />
              </Field>
              <Field label="Tipo do artefato">
                <Select
                  value={artifactDraft.type}
                  onValueChange={(v) => setArtifactDraft({ ...artifactDraft, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTIFACT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Descrição curta" className="mt-3">
              <Input
                value={artifactDraft.description}
                onChange={(e) =>
                  setArtifactDraft({ ...artifactDraft, description: e.target.value })
                }
                placeholder="Resumo do conteúdo do artefato."
              />
            </Field>
            <div className="mt-3 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={addArtifact}>
                <Plus className="h-3.5 w-3.5" />
                Adicionar artefato
              </Button>
            </div>
          </div>
        </Section>

        {/* Ação final */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-6">
          <Button asChild variant="outline">
            <Link to="/">Cancelar</Link>
          </Button>
          <Button type="submit" className="gap-1.5">
            <Telescope className="h-3.5 w-3.5" />
            Cadastrar projeto
          </Button>
        </div>
      </form>
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
            // {eyebrow}
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
