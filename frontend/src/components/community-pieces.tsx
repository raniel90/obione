import { useMemo, useState } from "react";
import {
  Eye,
  MessageSquare,
  CircleDot,
  Plus,
  CheckCircle2,
  Archive,
  Lightbulb,
  BookOpen,
  Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { domains, projects } from "@/lib/mock-data";
import {
  roleLabels,
  type Discussion,
  type DiscussionStatus,
  type CommunityKnowledge,
  type KnowledgeConfidence,
  type KnowledgeStatus,
  type VisibilityScope,
  type ContributionType,
  type ParticipantRole,
} from "@/lib/community-data";

export const VISIBILITY_OPTIONS: VisibilityScope[] = [
  "Comunidade do domínio",
  "Participantes do projeto",
  "Consultores vinculados",
  "Administradores",
];

export const CONTRIBUTION_TYPES: ContributionType[] = [
  "Evidência",
  "Interpretação",
  "Feedback",
  "Hipótese",
  "Validação",
  "Contraponto",
];

export const discussionStatusTone: Record<DiscussionStatus, string> = {
  Aberta: "bg-success/10 text-success border-success/20",
  "Em análise": "bg-warning/15 text-warning border-warning/25",
  Revisada: "bg-info/10 text-info border-info/20",
  Consolidada: "bg-foreground/10 text-foreground border-border",
  Arquivada: "bg-muted text-muted-foreground border-border",
};

export const knowledgeStatusTone: Record<KnowledgeStatus, string> = {
  Proposto: "bg-foreground/5 text-foreground/70 border-border",
  "Em revisão": "bg-warning/15 text-warning border-warning/25",
  Consolidado: "bg-success/10 text-success border-success/20",
};

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
      {children}
    </p>
  );
}

export function SectionHeader({
  title,
  tooltip,
  action,
}: {
  title: string;
  tooltip?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <h2 className="text-[18px] font-semibold tracking-tight text-foreground">{title}</h2>
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
      {action}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
    </div>
  );
}

export function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-medium text-foreground">{value}</p>
    </div>
  );
}

export function DiscussionCard({
  d,
  onView,
  onConsolidate,
  onArchive,
}: {
  d: Discussion;
  onView: () => void;
  onConsolidate: () => void;
  onArchive: () => void;
}) {
  return (
    <article className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-mono uppercase tracking-wider">{d.domain}</span>
          {d.project && (
            <>
              <span>·</span>
              <span className="text-foreground/80">{d.project}</span>
            </>
          )}
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            discussionStatusTone[d.status],
          )}
        >
          {d.status}
        </span>
      </div>

      <h3 className="mt-2 text-[14px] font-semibold leading-snug tracking-tight text-foreground">
        {d.title}
      </h3>

      {d.originObservation && (
        <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
          {d.originObservation}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11.5px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {d.contributions} contribuições
          </span>
          <span className="inline-flex items-center gap-1">
            <CircleDot className="h-3 w-3" />
            {d.lastParticipant}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
          {d.visibility}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]" onClick={onView}>
          <Eye className="h-3 w-3" /> Ver conversa
        </Button>
        {d.status !== "Consolidada" && d.status !== "Arquivada" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-[11px]"
            onClick={onConsolidate}
          >
            <Lightbulb className="h-3 w-3" /> Consolidar aprendizado
          </Button>
        )}
        {d.status !== "Arquivada" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-[11px]"
            onClick={onArchive}
          >
            <Archive className="h-3 w-3" /> Arquivar
          </Button>
        )}
      </div>
    </article>
  );
}

export function KnowledgeCard({ k }: { k: CommunityKnowledge }) {
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <BookOpen className="h-3 w-3" />
          <span className="font-mono uppercase tracking-wider">{k.domain}</span>
          {k.project && (
            <>
              <span>·</span>
              <span className="text-foreground/80">{k.project}</span>
            </>
          )}
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            knowledgeStatusTone[k.status],
          )}
        >
          {k.status}
        </span>
      </div>

      <h3 className="mt-2 text-[14.5px] font-semibold leading-snug tracking-tight text-foreground">
        {k.title}
      </h3>

      <p className="mt-3 text-[13px] leading-relaxed text-foreground/90">{k.summary}</p>

      {k.evidences && (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-background/50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            // evidências consideradas
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/90">{k.evidences}</p>
        </div>
      )}

      {k.recommendation && (
        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            // recomendação
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">{k.recommendation}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span>
          Confiança: <span className="font-medium text-foreground">{k.confidence}</span>
        </span>
        <span className="font-mono uppercase tracking-wider">
          origem: discussão #{k.originDiscussion}
        </span>
      </div>
    </article>
  );
}

/* --------------------------- Dialogs --------------------------- */

export function CreateDiscussionDialog({
  open,
  onOpenChange,
  onCreate,
  fixedDomain,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (d: Discussion) => void;
  fixedDomain?: string;
}) {
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "",
    domain: fixedDomain ?? domains[0].name,
    project: projects[0].name,
    originObservation: "",
    investigativeQuestion: "",
    visibility: VISIBILITY_OPTIONS[0],
    status: "Aberta" as DiscussionStatus,
  });

  const projectsForDomain = useMemo(() => {
    const d = domains.find((x) => x.name === form.domain);
    return projects.filter((p) => p.domainId === d?.id);
  }, [form.domain]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.investigativeQuestion.trim()) return;
    const newDiscussion: Discussion = {
      id: `ds-${Date.now()}`,
      title: form.title,
      domain: form.domain,
      project: form.project,
      originObservation: form.originObservation,
      investigativeQuestion: form.investigativeQuestion,
      visibility: form.visibility,
      status: form.status,
      contributions: 0,
      lastParticipant: "Você",
      contributionsList: [],
    };
    onCreate(newDiscussion);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onOpenChange(false);
      setForm((f) => ({
        ...f,
        title: "",
        originObservation: "",
        investigativeQuestion: "",
      }));
    }, 1300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Iniciar conversa</DialogTitle>
          <DialogDescription>
            Abra uma conversa a partir de uma observação registrada.
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-sm font-medium">Conversa iniciada com sucesso.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dis-title">Título da conversa</Label>
              <Input
                id="dis-title"
                placeholder="Ex.: Por que projetos de Branding apresentam mais mudanças de escopo?"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {!fixedDomain && (
                <div className="space-y-1.5">
                  <Label>Domínio relacionado</Label>
                  <Select
                    value={form.domain}
                    onValueChange={(v) => setForm((f) => ({ ...f, domain: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((d) => (
                        <SelectItem key={d.id} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Projeto relacionado</Label>
                <Select
                  value={form.project}
                  onValueChange={(v) => setForm((f) => ({ ...f, project: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(projectsForDomain.length ? projectsForDomain : projects).map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Visibilidade</Label>
                <Select
                  value={form.visibility}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, visibility: v as VisibilityScope }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as DiscussionStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Aberta", "Em análise", "Consolidada"] as DiscussionStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dis-origin">Observação de origem</Label>
              <Textarea
                id="dis-origin"
                rows={2}
                placeholder="Ex.: Cliente solicitou nova revisão após aprovação inicial."
                value={form.originObservation}
                onChange={(e) => setForm((f) => ({ ...f, originObservation: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dis-q">Pergunta investigativa</Label>
              <Textarea
                id="dis-q"
                rows={2}
                placeholder="Qual pergunta essa conversa pretende responder?"
                value={form.investigativeQuestion}
                onChange={(e) => setForm((f) => ({ ...f, investigativeQuestion: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit" size="sm">
                <Plus className="h-3.5 w-3.5" /> Iniciar conversa
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="mt-1 text-[12.5px] font-medium text-foreground">{value}</p>
    </div>
  );
}

export function DiscussionDetailDialog({
  discussion,
  open,
  onOpenChange,
  onConsolidate,
  onUpdateStatus,
  onAddContribution,
}: {
  discussion: Discussion | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConsolidate: () => void;
  onUpdateStatus: (s: DiscussionStatus) => void;
  onAddContribution: (c: Discussion["contributionsList"][number]) => void;
}) {
  const [text, setText] = useState("");
  const [type, setType] = useState<ContributionType>("Interpretação");
  const [role, setRole] = useState<ParticipantRole>("consultor");

  if (!discussion) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddContribution({
      id: `c-${Date.now()}`,
      participant: "Você",
      role,
      text,
      type,
      date: new Date().toISOString().slice(0, 10),
    });
    setText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
            <span className="font-mono">{discussion.domain}</span>
            {discussion.project && (
              <>
                <span>·</span>
                <span>{discussion.project}</span>
              </>
            )}
          </div>
          <DialogTitle className="mt-1">{discussion.title}</DialogTitle>
          <DialogDescription>
            Pergunta investigativa: {discussion.investigativeQuestion}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <InfoBlock label="Visibilidade" value={discussion.visibility} icon={Eye} />
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              // observação de origem
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">
              {discussion.originObservation}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                // contribuições da comunidade
              </p>
              <Select
                value={discussion.status}
                onValueChange={(v) => onUpdateStatus(v as DiscussionStatus)}
              >
                <SelectTrigger className="h-7 w-[150px] text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "Aberta",
                      "Em análise",
                      "Revisada",
                      "Consolidada",
                      "Arquivada",
                    ] as DiscussionStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ul className="mt-3 space-y-2">
              {discussion.contributionsList.length === 0 && (
                <li className="rounded-lg border border-dashed border-border bg-background p-3 text-center text-[12px] text-muted-foreground">
                  Nenhuma contribuição ainda.
                </li>
              )}
              {discussion.contributionsList.map((c) => (
                <li key={c.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">{c.participant}</span> ·{" "}
                      {roleLabels[c.role]}
                    </span>
                    <span className="font-mono">
                      {c.type} · {c.date}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-foreground">{c.text}</p>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={submit} className="rounded-lg border border-border bg-card p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              // adicionar contribuição
            </p>
            <Textarea
              rows={2}
              className="mt-2"
              placeholder="Compartilhe uma interpretação, evidência, hipótese ou contraponto."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Select value={role} onValueChange={(v) => setRole(v as ParticipantRole)}>
                <SelectTrigger className="h-8 w-[140px] text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(roleLabels) as ParticipantRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={(v) => setType(v as ContributionType)}>
                <SelectTrigger className="h-8 w-[140px] text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRIBUTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" size="sm" className="ml-auto">
                Adicionar contribuição
              </Button>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {discussion.status !== "Consolidada" && discussion.status !== "Arquivada" && (
            <Button size="sm" className="gap-1.5" onClick={onConsolidate}>
              <Lightbulb className="h-3.5 w-3.5" /> Consolidar como conhecimento
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConsolidateKnowledgeDialog({
  discussion,
  open,
  onOpenChange,
  onConsolidate,
}: {
  discussion: Discussion | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConsolidate: (k: CommunityKnowledge) => void;
}) {
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    evidences: "",
    recommendation: "",
    confidence: "Médio" as KnowledgeConfidence,
    status: "Proposto" as KnowledgeStatus,
  });

  if (!discussion) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) return;
    onConsolidate({
      id: `kn-${Date.now()}`,
      title: form.title,
      domain: discussion.domain,
      project: discussion.project,
      summary: form.summary,
      evidences: form.evidences,
      recommendation: form.recommendation,
      confidence: form.confidence,
      status: form.status,
      originDiscussion: discussion.id,
    });
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onOpenChange(false);
      setForm({
        title: "",
        summary: "",
        evidences: "",
        recommendation: "",
        confidence: "Médio",
        status: "Proposto",
      });
    }, 1600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Consolidar como conhecimento</DialogTitle>
          <DialogDescription>
            Transforme as interpretações da discussão em aprendizado consolidado para projetos
            futuros.
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-sm font-medium">Conhecimento consolidado com sucesso.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3 text-[11.5px] text-muted-foreground sm:grid-cols-3">
              <span>
                <span className="font-mono uppercase tracking-wider">Domínio: </span>
                {discussion.domain}
              </span>
              <span>
                <span className="font-mono uppercase tracking-wider">Projeto: </span>
                {discussion.project ?? "—"}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kn-title">Título do conhecimento</Label>
              <Input
                id="kn-title"
                placeholder="Ex.: Baixa participação do cliente aumenta risco de atraso"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kn-sum">Resumo do aprendizado</Label>
              <Textarea
                id="kn-sum"
                rows={3}
                placeholder="Síntese do aprendizado consolidado pela comunidade."
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kn-ev">Evidências consideradas</Label>
              <Textarea
                id="kn-ev"
                rows={2}
                placeholder="Quais observações, contribuições e dados sustentam este aprendizado."
                value={form.evidences}
                onChange={(e) => setForm((f) => ({ ...f, evidences: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kn-rec">Recomendação para projetos futuros</Label>
              <Textarea
                id="kn-rec"
                rows={2}
                placeholder="Como projetos semelhantes devem agir a partir deste aprendizado."
                value={form.recommendation}
                onChange={(e) => setForm((f) => ({ ...f, recommendation: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nível de confiança</Label>
                <Select
                  value={form.confidence}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, confidence: v as KnowledgeConfidence }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Baixo", "Médio", "Alto"] as KnowledgeConfidence[]).map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as KnowledgeStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Proposto", "Em revisão", "Consolidado"] as KnowledgeStatus[]).map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" size="sm">
                Consolidar aprendizado
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
