import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { Project as LegacyProject, ProjectStatus } from "@/lib/mock-data";
import type {
  EngagementLevel,
  Project as SvcProject,
  ProjectStatusCode,
  ProjectTypeCode,
  RiskLevel,
} from "@/types/project";
import type { Domain as SvcDomain } from "@/types/domain";
import type {
  Observation as SvcObservation,
  ObservationImpact as SvcObsImpact,
  ObservationRisk as SvcObsRisk,
  ObservationStatus as SvcObsStatus,
} from "@/types/observation";
import type {
  Phenomenon as SvcPhenomenon,
  PhenomenonTrend,
  PhenomenonStatus,
} from "@/types/phenomenon";
import { toast } from "sonner";
import { getProjectById, updateProject } from "@/services/projectService";
import { getDomains } from "@/services/domainService";
import {
  createObservation,
  getObservationsByProject,
  linkObservationToDiscussion,
  markObservationAsAnalyzed,
  updateObservation,
} from "@/services/observationService";
import {
  createDiscussion,
  getDiscussionsByProject,
  statusCodes,
  toCommunityDiscussion,
  visibilityCodes,
} from "@/services/discussionService";
import { getCurrentUser } from "@/services/authService";
import { getPhenomenaByProject } from "@/services/phenomenonService";
import {
  getMpoCategories,
  getProjectAttributeMap,
  manageProjectAttributes,
  setProjectAttributeValue,
} from "@/services/mpoAttributeService";
import type { AttributeStatus, MpoCategory, ProjectAttributeValue } from "@/types/mpoAttribute";
import {
  communityKnowledge as allKnowledge,
  type DiscussionStatus,
  type VisibilityScope,
} from "@/lib/community-data";
import { BookOpen } from "lucide-react";
import {
  getProjectObservatory,
  type ProjectObservation,
  type ProjectPhenomenon,
} from "@/lib/project-observatory";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Layers,
  Radar,
  Sparkles,
  FileText,
  MessageSquare,
  GitBranch,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  CheckCircle2,
  Eye,
  CircleDot,
  RefreshCw,
  Lock,
  Plus,
  PenSquare,
  Settings2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── MpoAttributeCard ─────────────────────────────────────────────────────────

function MpoAttributeCard({
  value: v,
  onEdit,
}: {
  value: ProjectAttributeValue;
  onEdit: () => void;
}) {
  const hasValue = v.currentValue && v.currentValue.trim().length > 0;
  const isUnfilled = v.status === "NOT_OBSERVED";

  return (
    <div className="group relative rounded-lg border border-border bg-background p-3 transition-colors hover:border-border/80">
      <div className="flex items-start gap-3">
        {/* Lado esquerdo: nome + status + valor */}
        <div className="min-w-0 flex-1">
          {/* Nome — informação principal */}
          <p className="text-[13px] font-medium leading-snug text-foreground">{v.attributeName}</p>

          {/* Status pill */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              title={MPO_ATTRIBUTE_STATUS_HINT[v.status]}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                v.status === "FILLED"         && "bg-success/10 text-success ring-success/20",
                v.status === "PARTIAL"        && "bg-warning/10 text-warning ring-warning/20",
                v.status === "NOT_OBSERVED"   && "bg-muted text-muted-foreground ring-border",
                v.status === "NOT_APPLICABLE" && "bg-muted/50 text-muted-foreground/60 ring-border/50",
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", MPO_ATTRIBUTE_STATUS_DOT[v.status])} />
              {MPO_ATTRIBUTE_STATUS_LABEL[v.status]}
            </span>
            {v.lastObservationId && (
              <span className="text-[10px] text-muted-foreground">via observação</span>
            )}
          </div>

          {/* Valor preenchido */}
          {hasValue && (
            <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
              {v.currentValue}
            </p>
          )}

          {/* Metadados */}
          {v.updatedBy && (
            <p className="mt-1.5 text-[10.5px] text-muted-foreground/70">
              {v.updatedBy}
              {v.updatedAt && (
                <> · {new Date(v.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</>
              )}
            </p>
          )}
        </div>

        {/* Botão editar — aparece no hover */}
        <button
          type="button"
          title={isUnfilled ? "Preencher atributo" : "Editar atributo"}
          onClick={onEdit}
          className={cn(
            "mt-0.5 shrink-0 rounded-md border border-transparent p-1.5 text-muted-foreground transition-colors",
            "opacity-0 group-hover:opacity-100 focus:opacity-100",
            "hover:border-border hover:bg-muted hover:text-foreground",
          )}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── AttributeEditDialog ──────────────────────────────────────────────────────

interface AttributeEditDialogProps {
  attr: ProjectAttributeValue;
  projectId: string | number;
  onClose: () => void;
  onSaved: (updated: ProjectAttributeValue) => void;
}

const ATTR_STATUS_OPTIONS: { value: AttributeStatus; label: string; hint: string }[] = [
  { value: "NOT_OBSERVED",   label: "Não observado",   hint: "Ainda sem valor ou evidência." },
  { value: "PARTIAL",        label: "Parcial",          hint: "Há evidência, mas ainda não consolidada." },
  { value: "FILLED",         label: "Preenchido",       hint: "Valor consolidado do atributo." },
  { value: "NOT_APPLICABLE", label: "Não aplicável",    hint: "Atributo não se aplica ao projeto." },
];

function AttributeEditDialog({ attr, projectId, onClose, onSaved }: AttributeEditDialogProps) {
  const [value, setValue]   = useState(attr.currentValue ?? "");
  const [status, setStatus] = useState<AttributeStatus>(attr.status);
  const [author, setAuthor] = useState(attr.updatedBy ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);
      const updated = await setProjectAttributeValue(
        projectId,
        attr.attributeCode,
        value || null,
        status,
        author || "sistema",
      );
      toast.success("Atributo atualizado com sucesso.");
      onSaved(updated);
    } catch {
      toast.error("Erro ao atualizar atributo MPO.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          {/* Metadados discretos: categoria + código */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">{attr.categoryName}</Badge>
            <span className="text-[10px] text-muted-foreground">{attr.attributeCode}</span>
          </div>
          {/* Nome em destaque */}
          <DialogTitle className="mt-1.5 text-[16px] leading-snug">{attr.attributeName}</DialogTitle>
          {/* Descrição conceitual */}
          {attr.attributeDescription && (
            <DialogDescription className="text-[12px] leading-relaxed">
              {attr.attributeDescription}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Valor / evidência</Label>
            <Textarea
              rows={4}
              placeholder="Descreva o valor atual, evidência observada ou informação relevante…"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AttributeStatus)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ATTR_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="py-2">
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-[11px] text-muted-foreground">{opt.hint}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Autor / motivo</Label>
            <Input
              className="h-9 text-sm"
              placeholder="Ex.: consultor, revisão de escopo, entrevista com cliente…"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── ManageAttributesDialog ───────────────────────────────────────────────────

interface ManageAttributesDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectId: string | number;
  mpoCategories: MpoCategory[];
  projectAttributeMap: ProjectAttributeValue[];
  onSaved: () => Promise<void>;
}

function ManageAttributesDialog({
  open,
  onOpenChange,
  projectId,
  mpoCategories,
  projectAttributeMap,
  onSaved,
}: ManageAttributesDialogProps) {
  const existingCodes = useMemo(
    () => new Set(projectAttributeMap.map((a) => a.attributeCode)),
    [projectAttributeMap],
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set(existingCodes));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Atributos que serão removidos e têm dados
  const toRemove = [...existingCodes].filter((c) => !selected.has(c));
  const blockedRemove = toRemove.filter((c) => {
    const pav = projectAttributeMap.find((a) => a.attributeCode === c);
    return pav && (pav.status !== "NOT_OBSERVED" || pav.lastObservationId != null);
  });

  const toAdd = [...selected].filter((c) => !existingCodes.has(c));

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

  async function handleSave(force = false) {
    if (!force && blockedRemove.length > 0) {
      setConfirmOpen(true);
      return;
    }
    try {
      setSaving(true);
      await manageProjectAttributes(projectId, toAdd, toRemove, force);
      toast.success("Atributos MPO atualizados.");
      await onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao gerenciar atributos MPO.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Gerenciar Atributos MPO</DialogTitle>
            <DialogDescription className="text-[12px]">
              Marque ou desmarque os atributos que este projeto irá acompanhar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 pr-1">
            <div className="space-y-5">
              {mpoCategories.map((cat) => (
                <div key={cat.code}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {cat.name}
                  </p>
                  <div className="space-y-1.5">
                    {cat.attributes.map((attr) => {
                      const isSelected = selected.has(attr.code);
                      const hasData = existingCodes.has(attr.code) && (() => {
                        const pav = projectAttributeMap.find((a) => a.attributeCode === attr.code);
                        return pav && (pav.status !== "NOT_OBSERVED" || pav.lastObservationId != null);
                      })();
                      return (
                        <button
                          key={attr.code}
                          type="button"
                          title={hasData && !isSelected ? "Possui dados — remoção requer confirmação" : attr.description ?? attr.name}
                          onClick={() => toggle(attr.code)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                            isSelected
                              ? "border-foreground/30 bg-foreground/5 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground",
                            hasData && !isSelected && "border-warning/30 text-warning/80",
                          )}
                        >
                          {/* Checkbox visual */}
                          <span className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                            isSelected ? "border-foreground bg-foreground" : "border-border",
                          )}>
                            {isSelected && (
                              <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-none stroke-background stroke-2">
                                <polyline points="1,4 4,7 9,1" />
                              </svg>
                            )}
                          </span>
                          {/* Nome principal */}
                          <span className="flex-1 text-[12.5px] font-medium leading-snug">
                            {attr.name}
                          </span>
                          {/* Código discreto */}
                          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60">
                            {attr.code}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <span className="mr-auto text-[11px] text-muted-foreground">
              {toAdd.length > 0 && `+${toAdd.length} a adicionar `}
              {toRemove.length > 0 && `−${toRemove.length} a remover`}
            </span>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={() => handleSave(false)} disabled={saving || (toAdd.length === 0 && toRemove.length === 0)}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar remoção de atributos com dados */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover atributos com dados?</AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px]">
              Os atributos abaixo possuem valores ou observações vinculadas. Removê-los não apagará o histórico, mas eles deixarão de ser acompanhados neste projeto.
              <ul className="mt-2 list-disc pl-4 text-xs text-foreground">
                {blockedRemove.map((code) => {
                  const attr = projectAttributeMap.find((a) => a.attributeCode === code);
                  return (
                    <li key={code}>
                      {attr?.attributeName ?? code}
                      <span className="ml-1 font-mono text-[10px] text-muted-foreground">({code})</span>
                    </li>
                  );
                })}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                handleSave(true);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar remoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function ProjectRouteError({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <AppShell>
      <div className="px-6 py-10 md:px-10">
        <h1 className="text-lg font-semibold">Erro ao carregar projeto</h1>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Tentar novamente
        </Button>
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/projects/$id")({
  head: () => ({
    meta: [
      { title: "Projeto — ObiOne" },
      {
        name: "description",
        content: "Detalhe observacional de projeto no ObiOne.",
      },
    ],
  }),
  errorComponent: ProjectRouteError,
  component: ProjectDetailPage,
});

const statusCodeToLegacy: Record<ProjectStatusCode, ProjectStatus> = {
  OBSERVATION: "active",
  PLANNED: "planning",
  ACTIVE: "active",
  RISK: "review",
  REVIEW: "review",
  PAUSED: "paused",
  CLOSED: "completed",
};

const typeCodeToLabel: Record<ProjectTypeCode, "Estratégico" | "Gerencial" | "Híbrido"> = {
  STRATEGIC: "Estratégico",
  MANAGERIAL: "Gerencial",
  HYBRID: "Híbrido",
};

const updateStatusToLabel: Record<ProjectStatusCode, string> = {
  OBSERVATION: "Em observação",
  PLANNED: "Em observação",
  ACTIVE: "Estável",
  RISK: "Em risco",
  REVIEW: "Em revisão",
  PAUSED: "Em revisão",
  CLOSED: "Encerrado",
};

const updateStatusFromLabel: Record<string, ProjectStatusCode> = {
  "Em observação": "OBSERVATION",
  Estável: "ACTIVE",
  "Em risco": "RISK",
  "Em revisão": "REVIEW",
  Encerrado: "CLOSED",
};

const riskCodeToLabel: Record<RiskLevel, string> = {
  LOW: "Baixo",
  MODERATE: "Moderado",
  HIGH: "Elevado",
  CRITICAL: "Crítico",
};

const riskLabelToCode: Record<string, RiskLevel> = {
  Baixo: "LOW",
  Moderado: "MODERATE",
  Elevado: "HIGH",
  Crítico: "CRITICAL",
};

function engagementToPercent(level: EngagementLevel): number {
  if (level === "HIGH") return 75;
  if (level === "MEDIUM") return 50;
  return 25;
}

function percentToEngagement(percent: number): EngagementLevel {
  if (percent >= 67) return "HIGH";
  if (percent >= 34) return "MEDIUM";
  return "LOW";
}

function riskLevelTone(level: RiskLevel): "warning" | "success" | "danger" {
  if (level === "CRITICAL" || level === "HIGH") return "danger";
  if (level === "MODERATE") return "warning";
  return "success";
}

function engagementLevelTone(level: EngagementLevel): "warning" | "success" | "info" {
  if (level === "HIGH") return "success";
  if (level === "MEDIUM") return "info";
  return "warning";
}

function mergeObservatoryWithProject(
  base: ReturnType<typeof getProjectObservatory>,
  svc: SvcProject,
  engagementPercent: number,
) {
  const riskLabel = riskCodeToLabel[svc.riskLevel];
  const engagementPct = `${engagementPercent}%`;
  const riskTone = riskLevelTone(svc.riskLevel);
  const engagementTone = engagementLevelTone(svc.clientEngagement);

  return {
    ...base,
    kpis: base.kpis.map((k) => {
      if (k.label === "Risco observado") return { ...k, value: riskLabel, tone: riskTone };
      if (k.label === "Engajamento do cliente") {
        return { ...k, value: engagementPct, tone: engagementTone };
      }
      return k;
    }),
    intermediateAttrs: base.intermediateAttrs.map((a) => {
      if (a.label === "Nível de risco") return { ...a, value: riskLabel, tone: riskTone };
      if (a.label === "Grau de engajamento") {
        return { ...a, value: engagementPct, tone: engagementTone };
      }
      return a;
    }),
  };
}

function authorIdLabel(id: string) {
  if (!id) return "—";
  return /^\d+$/.test(id) ? `Usuário ${id}` : id;
}

function toLegacyProject(p: SvcProject, domainMap: Map<string, SvcDomain>): LegacyProject {
  return {
    id: p.id,
    name: p.name,
    domain: domainMap.get(p.domainId)?.name ?? "—",
    domainId: p.domainId,
    status: statusCodeToLegacy[p.status],
    summary: p.summary,
    progress: p.progress,
    updatedAt: p.updatedAt,
    tags: p.expectedPhenomena,
    model: typeCodeToLabel[p.type],
    owner: p.consultantName ?? "—",
    clientName: p.clientName ?? "—",
  };
}

const obsImpactMap: Record<SvcObsImpact, ProjectObservation["impact"]> = {
  LOW: "Baixo",
  MEDIUM: "Médio",
  HIGH: "Alto",
};
const obsRiskMap: Record<SvcObsRisk, ProjectObservation["risk"]> = {
  LOW: "Baixo",
  MODERATE: "Moderado",
  HIGH: "Elevado",
  CRITICAL: "Crítico",
};
const obsStatusMap: Record<SvcObsStatus, ProjectObservation["status"]> = {
  REGISTERED: "registrada",
  IN_ANALYSIS: "em análise",
  LINKED_TO_DISCUSSION: "associada a discussão",
  CONSOLIDATED: "consolidada",
};

function toProjectObservation(
  o: SvcObservation,
  attrMap: Map<string, string>,
  phenMap: Map<string, string>,
): ProjectObservation {
  return {
    id: o.id,
    title: o.title,
    date: o.createdAt,
    description: o.description,
    attribute: attrMap.get(o.attributeId) ?? o.attributeId ?? "—",
    phenomenon: o.phenomenonId ? (phenMap.get(o.phenomenonId) ?? o.phenomenonId) : "—",
    impact: obsImpactMap[o.impact],
    risk: obsRiskMap[o.risk],
    interpretation: o.interpretation,
    author: o.createdByName ?? authorIdLabel(o.createdBy),
    status: obsStatusMap[o.status],
  };
}

const trendMap: Record<PhenomenonTrend, ProjectPhenomenon["trend"]> = {
  STABLE: "stable",
  GROWING: "up",
  DECREASING: "down",
};
const phenStatusMap: Record<PhenomenonStatus, ProjectPhenomenon["status"]> = {
  OBSERVED: "Em observação",
  IN_ANALYSIS: "Atenção",
  CONSOLIDATED: "Consolidado",
};
const phenImpactLabel: Record<SvcPhenomenon["impact"], string> = {
  LOW: "Baixo",
  MEDIUM: "Médio",
  HIGH: "Alto",
};

function toProjectPhenomenon(p: SvcPhenomenon): ProjectPhenomenon {
  return {
    id: p.id,
    title: p.name,
    evidence: `${p.evidenceCount} evidências registradas`,
    impact: phenImpactLabel[p.impact],
    trend: trendMap[p.trend],
    status: phenStatusMap[p.status],
  };
}

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus } as const;

function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-[12.5px] text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

const toneClass: Record<string, string> = {
  warning: "text-warning",
  success: "text-success",
  danger: "text-destructive",
  info: "text-info",
  default: "text-foreground",
};

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const [project, setProject] = useState<LegacyProject | null>(null);
  const [rawProject, setRawProject] = useState<SvcProject | null>(null);
  const [domain, setDomain] = useState<SvcDomain | null>(null);
  const [domainMap, setDomainMap] = useState<Map<string, SvcDomain>>(new Map());
  const [svcPhenomena, setSvcPhenomena] = useState<ProjectPhenomenon[]>([]);
  const [rawPhenomena, setRawPhenomena] = useState<SvcPhenomenon[]>([]);
  const [svcObservations, setSvcObservations] = useState<ProjectObservation[]>([]);
  const [rawObservations, setRawObservations] = useState<SvcObservation[]>([]);
  const [attrNameById, setAttrNameById] = useState<Map<string, string>>(new Map());
  const [phenNameById, setPhenNameById] = useState<Map<string, string>>(new Map());
  const [mpoCategories, setMpoCategories] = useState<MpoCategory[]>([]);
  const [projectAttributeMap, setProjectAttributeMap] = useState<ProjectAttributeValue[]>([]);
  const [editingAttr, setEditingAttr] = useState<ProjectAttributeValue | null>(null);
  const [manageAttrsOpen, setManageAttrsOpen] = useState(false);
  const [discussionsRefresh, setDiscussionsRefresh] = useState(0);
  const [engagementPercent, setEngagementPercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProjectById(id),
      getDomains(),
      getPhenomenaByProject(id),
      getObservationsByProject(id),
      getMpoCategories(),
      getProjectAttributeMap(id),
    ]).then(([p, ds, phs, observs, categories, attrMap]) => {
      if (cancelled) return;
      if (!p) {
        setProject(null);
        setLoading(false);
        return;
      }
      const domainsById = new Map(ds.map((d) => [d.id, d] as const));
      setDomainMap(domainsById);
      setDomain(domainsById.get(p.domainId) ?? null);
      setRawProject(p);
      setEngagementPercent(engagementToPercent(p.clientEngagement));
      setProject(toLegacyProject(p, domainsById));
      setRawPhenomena(phs);
      setSvcPhenomena(phs.map(toProjectPhenomenon));
      setMpoCategories(categories);
      setProjectAttributeMap(attrMap);
      const mpoAttrMap = new Map(
        categories.flatMap((cat) => cat.attributes.map((a) => [a.code, a.name] as const)),
      );
      const phenMap = new Map(phs.map((ph) => [ph.id, ph.name] as const));
      setAttrNameById(mpoAttrMap);
      setPhenNameById(phenMap);
      setRawObservations(observs);
      setSvcObservations(observs.map((o) => toProjectObservation(o, mpoAttrMap, phenMap)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const obs = useMemo(() => {
    const base = getProjectObservatory(id);
    if (!rawProject || engagementPercent === null) return base;
    return mergeObservatoryWithProject(base, rawProject, engagementPercent);
  }, [id, rawProject, engagementPercent]);

  if (loading) {
    return (
      <AppShell>
        <PageHeader title="Carregando projeto…" />
      </AppShell>
    );
  }

  if (!project) {
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

  const phenomenaList: ProjectPhenomenon[] = svcPhenomena.length > 0 ? svcPhenomena : obs.phenomena;
  const observationsList: ProjectObservation[] =
    svcObservations.length > 0 ? svcObservations : obs.observations;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <AppShell>
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="px-6 pt-5 md:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Observatório
          </Link>
        </div>
        <div className="flex flex-col gap-5 px-6 py-5 md:px-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-muted-foreground">
                <span className="font-mono uppercase tracking-wider">Projeto observado</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="uppercase tracking-wider">{project.model}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <StatusBadge status={project.status} />
              </div>
              <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-foreground">
                {project.name}
              </h1>
              <p className="mt-1 max-w-3xl text-[13px] text-muted-foreground">{project.summary}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {domain && (
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link to="/domains/$id" params={{ id: domain.id }}>
                    Ver domínio <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
              {rawProject && (
                <UpdateProjectButton
                  projectId={id}
                  projectName={project.name}
                  project={rawProject}
                  engagementPercent={
                    engagementPercent ?? engagementToPercent(rawProject.clientEngagement)
                  }
                  onUpdated={(updated, nextEngagementPercent) => {
                    setRawProject(updated);
                    setEngagementPercent(nextEngagementPercent);
                    setProject(toLegacyProject(updated, domainMap));
                  }}
                />
              )}
              <CloseObservationButton projectName={project.name} />
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-border bg-card p-4 md:grid-cols-6">
            <MetaItem label="Domínio" value={domain?.name ?? project.domain} />
            <MetaItem label="Tipo" value={project.model} />
            <MetaItem label="Consultor" value={project.owner} />
            <MetaItem label="Cliente" value={project.clientName ?? obs.client} />
            <MetaItem
              label="Risco"
              value={rawProject ? riskCodeToLabel[rawProject.riskLevel] : "—"}
            />
            <MetaItem
              label="Engajamento"
              value={engagementPercent !== null ? `${engagementPercent}%` : "—"}
            />
            <MetaItem label="Início" value={formatDate(obs.startDate)} />
            <MetaItem label="Previsão" value={formatDate(obs.dueDate)} />
            <div className="col-span-2 md:col-span-6">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Progresso observacional</span>
                <span className="font-mono text-foreground">{project.progress}%</span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-12 px-6 py-8 md:px-10">
        {/* Resumo Observacional */}
        <section>
          <SectionTitle
            eyebrow="Interpretação narrativa"
            title="Resumo Observacional"
            description="Síntese analítica gerada pelo observatório a partir dos atributos cruzados."
          />
          <div className="mt-3 rounded-xl border border-foreground/20 bg-foreground/[0.025] p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
              <p className="text-[14px] leading-relaxed text-foreground">{obs.summary}</p>
            </div>
          </div>
        </section>

        {/* Indicadores */}
        <section>
          <SectionTitle
            eyebrow="Atributos intermediários"
            title="Indicadores do projeto"
            description="Medidas interpretativas geradas pelo observatório."
          />
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {obs.kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-4">
                <span className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
                  {k.label}
                </span>
                <div className="mt-2 text-[18px] font-semibold tracking-tight">
                  <span className={cn(toneClass[k.tone ?? "default"])}>{k.value}</span>
                </div>
                {k.hint && <p className="mt-1 text-[11px] text-muted-foreground">{k.hint}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Mapa de Atributos MPO */}
        <section>
          {/* Cabeçalho */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionTitle
              eyebrow="MPO · Cobertura de atributos"
              title="Mapa de Atributos MPO"
              description="Atributos selecionados para acompanhamento segundo o Modelo de Observatório de Projetos (Vieira, 2022)."
            />
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5 text-xs"
              onClick={() => setManageAttrsOpen(true)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Gerenciar atributos
            </Button>
          </div>

          {/* Estado vazio */}
          {projectAttributeMap.length === 0 && mpoCategories.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-[13px] font-medium text-foreground">Nenhum atributo associado</p>
              <p className="max-w-xs text-[12px] text-muted-foreground">
                Use o botão "Gerenciar atributos" para selecionar quais dimensões do MPO este projeto irá acompanhar.
              </p>
              <Button size="sm" variant="outline" className="mt-1 gap-1.5 text-xs" onClick={() => setManageAttrsOpen(true)}>
                <Settings2 className="h-3.5 w-3.5" /> Gerenciar atributos
              </Button>
            </div>
          )}

          {/* Cards de métricas de cobertura */}
          {projectAttributeMap.length > 0 && (() => {
            const total   = projectAttributeMap.length;
            const filled  = projectAttributeMap.filter((a) => a.status === "FILLED").length;
            const partial = projectAttributeMap.filter((a) => a.status === "PARTIAL").length;
            const notObs  = projectAttributeMap.filter((a) => a.status === "NOT_OBSERVED").length;
            const na      = projectAttributeMap.filter((a) => a.status === "NOT_APPLICABLE").length;
            return (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{total}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Acompanhados</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-success">{filled}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Preenchidos</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-warning">{partial}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Parciais</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{notObs}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Não observados</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-muted-foreground/50">{na}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Não aplicáveis</p>
                </div>
              </div>
            );
          })()}

          {/* Lista de atributos agrupados por categoria */}
          {projectAttributeMap.length > 0 && (
            <div className="mt-4 space-y-4">
              {mpoCategories.map((cat) => {
                const catValues = projectAttributeMap.filter((v) => v.categoryCode === cat.code);
                if (catValues.length === 0) return null;
                const catFilled = catValues.filter((v) => v.status !== "NOT_OBSERVED" && v.status !== "NOT_APPLICABLE").length;
                return (
                  <div key={cat.code} className="rounded-xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground">{cat.name}</span>
                      <span className="ml-auto text-[11px] text-muted-foreground">
                        {catFilled}/{catValues.length} com registro
                      </span>
                    </div>
                    <div className="space-y-2">
                      {catValues.map((v) => (
                        <MpoAttributeCard
                          key={v.attributeCode}
                          value={v}
                          onEdit={() => setEditingAttr(v)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Modal de edição de atributo MPO */}
        {editingAttr && (
          <AttributeEditDialog
            attr={editingAttr}
            projectId={id}
            onClose={() => setEditingAttr(null)}
            onSaved={(updated) => {
              setProjectAttributeMap((prev) =>
                prev.map((a) => a.attributeCode === updated.attributeCode ? updated : a),
              );
              setEditingAttr(null);
            }}
          />
        )}

        {/* Modal Gerenciar Atributos MPO */}
        <ManageAttributesDialog
          open={manageAttrsOpen}
          onOpenChange={setManageAttrsOpen}
          projectId={id}
          mpoCategories={mpoCategories}
          projectAttributeMap={projectAttributeMap}
          onSaved={async () => {
            const updated = await getProjectAttributeMap(id);
            setProjectAttributeMap(updated);
          }}
        />

        {/* Fenômenos */}
        <section>
          <SectionTitle
            eyebrow="Padrões e comportamentos"
            title="Fenômenos Associados"
            description="Sinais identificados a partir do cruzamento dos atributos observados."
          />
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {phenomenaList.map((ph) => {
              const TrendIcon = trendIcon[ph.trend];
              return (
                <article key={ph.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Radar className="h-3 w-3" /> Fenômeno
                    </div>
                    <TrendIcon
                      className={cn(
                        "h-3.5 w-3.5",
                        ph.trend === "up" && "text-warning",
                        ph.trend === "down" && "text-success",
                        ph.trend === "stable" && "text-muted-foreground",
                      )}
                    />
                  </div>
                  <h3 className="mt-2 text-[14px] font-semibold leading-snug text-foreground">
                    {ph.title}
                  </h3>
                  <dl className="mt-3 space-y-1.5 text-[12.5px]">
                    <DefRow label="Evidências" value={ph.evidence} />
                    <DefRow label="Impacto" value={ph.impact} />
                    <DefRow
                      label="Tendência"
                      value={
                        ph.trend === "up"
                          ? "Crescente"
                          : ph.trend === "down"
                            ? "Decrescente"
                            : "Estável"
                      }
                    />
                    <DefRow label="Status" value={ph.status} />
                  </dl>
                </article>
              );
            })}
          </div>
        </section>

        {/* Artefatos */}
        <ManualObservationSection
          projectId={id}
          domainId={project.domainId}
          initial={observationsList}
          rawObservations={rawObservations}
          phenomena={rawPhenomena}
          attrNameById={attrNameById}
          phenNameById={phenNameById}
          mpoCategories={mpoCategories}
          onObservationsChange={(observs) => {
            setRawObservations(observs);
            setSvcObservations(
              observs.map((o) => toProjectObservation(o, attrNameById, phenNameById)),
            );
          }}
          onDiscussionCreated={() => setDiscussionsRefresh((k) => k + 1)}
        />

        {/* Comunidade do Projeto */}
        <section>
          <SectionTitle
            eyebrow="Camada sociotécnica"
            title="Comunidade do Projeto"
            description="Participantes vinculados que interpretam os fenômenos e produzem conhecimento."
          />

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Users className="h-3 w-3" /> Participantes
              </div>
              <ul className="mt-3 divide-y divide-border">
                {obs.participants.map((p) => (
                  <li
                    key={p.name}
                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground">{p.name}</p>
                      <p className="text-[11.5px] text-muted-foreground">{p.responsibility}</p>
                    </div>
                    <span className="shrink-0 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {p.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <MessageSquare className="h-3 w-3" /> Discussões observacionais
              </div>
              <ul className="mt-3 space-y-3">
                {obs.discussions.map((d) => (
                  <li key={d.id} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-[13px] leading-snug text-foreground">“{d.question}”</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{d.contributions} contribuições</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span className="capitalize">{d.status}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span className="font-mono uppercase tracking-wider">projeto vinculado</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4 text-[12.5px] leading-relaxed text-muted-foreground">
            No ObiOne, a comunidade do projeto representa a camada colaborativa de interpretação. Os
            participantes vinculados contribuem com feedback, evidências e hipóteses para
            transformar observações em conhecimento.
          </div>
        </section>

        {/* Discussões e Conhecimentos do Projeto */}
        <ProjectDiscussionsAndKnowledge
          projectId={id}
          projectName={project.name}
          domainName={domain?.name ?? project.domain}
          domainSlug={domain?.slug}
          phenNameById={phenNameById}
          refreshKey={discussionsRefresh}
        />

        {/* Insights */}
        <section>
          <SectionTitle
            eyebrow="Inteligência interpretativa"
            title="Insights do Projeto"
            description="Narrativas geradas a partir do cruzamento de atributos, artefatos e discussões."
          />
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {obs.insights.map((i) => (
              <article
                key={i.id}
                className="flex flex-col rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> {i.origin}
                  </span>
                  <span className="font-mono">confiança {i.confidence}</span>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-foreground">
                  “{i.narrative}”
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <span className="capitalize">{i.status}</span>
                  <CircleDot
                    className={cn(
                      "h-3 w-3",
                      i.status === "consolidado" && "text-success",
                      i.status === "em revisão" && "text-warning",
                      i.status === "proposto" && "text-muted-foreground",
                    )}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <SectionTitle
            eyebrow="Evolução observacional"
            title="Linha do Tempo Observacional"
            description="O observatório acompanha a evolução do projeto ao longo do tempo."
          />
          <ol className="mt-4 space-y-2">
            {obs.timeline.map((ev) => (
              <li
                key={ev.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-foreground">
                  <TimelineIcon type={ev.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-relaxed text-foreground">{ev.description}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="capitalize">{ev.type}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{ev.actor}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="font-mono">{formatDate(ev.date)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Relação com domínio */}
        <section>
          <SectionTitle eyebrow="Relação observacional" title="Contexto do domínio" />
          <div className="mt-3 flex flex-col gap-4 rounded-xl border border-border bg-card p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Layers className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <p className="max-w-3xl text-[13px] leading-relaxed text-foreground/90">
                {obs.domainContext}
              </p>
            </div>
            {domain && (
              <Button asChild size="sm" variant="outline" className="shrink-0 gap-1.5">
                <Link to="/domains/$id" params={{ id: domain.id }}>
                  Ver domínio <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

/* --------------------------------- Helpers -------------------------------- */

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[13px] font-medium text-foreground">{value}</p>
    </div>
  );
}

function DefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

function AttrBlock({
  title,
  description,
  items,
  highlight,
}: {
  title: string;
  description: string;
  items: { label: string; value: string; className?: string }[];
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        highlight ? "border-foreground/20 bg-foreground/[0.025]" : "border-border bg-card",
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Layers className="h-3 w-3" /> {title}
      </div>
      <p className="mt-1 text-[11.5px] text-muted-foreground">{description}</p>
      <dl className="mt-3 space-y-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-baseline justify-between gap-3 text-[12.5px]">
            <dt className="text-muted-foreground">{it.label}</dt>
            <dd className={cn("text-right font-medium text-foreground", it.className)}>
              {it.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TimelineIcon({ type }: { type: string }) {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    cadastro: CheckCircle2,
    briefing: FileText,
    artefato: FileText,
    escopo: GitBranch,
    discussão: MessageSquare,
    insight: Sparkles,
    risco: AlertTriangle,
  };
  const Icon = map[type] ?? Eye;
  return <Icon className="h-3.5 w-3.5" />;
}

/* --------------------- Manual observation section ------------------------ */

const MPO_ATTRIBUTE_STATUS_LABEL: Record<string, string> = {
  NOT_OBSERVED: "Não observado",
  PARTIAL: "Parcial",
  FILLED: "Preenchido",
  NOT_APPLICABLE: "Não aplicável",
};

const MPO_ATTRIBUTE_STATUS_HINT: Record<string, string> = {
  NOT_OBSERVED: "Ainda sem valor ou evidência.",
  PARTIAL: "Há evidência, mas ainda não consolidada.",
  FILLED: "Valor consolidado do atributo.",
  NOT_APPLICABLE: "Atributo não se aplica ao projeto.",
};

const MPO_ATTRIBUTE_STATUS_TONE: Record<string, string> = {
  NOT_OBSERVED: "text-muted-foreground",
  PARTIAL: "text-warning",
  FILLED: "text-success",
  NOT_APPLICABLE: "text-muted-foreground/50",
};

const MPO_ATTRIBUTE_STATUS_DOT: Record<string, string> = {
  NOT_OBSERVED: "bg-muted-foreground/40",
  PARTIAL: "bg-warning",
  FILLED: "bg-success",
  NOT_APPLICABLE: "bg-muted-foreground/20",
};

const PHENOMENA = [
  "Mudança recorrente de escopo",
  "Baixa participação do cliente",
  "Atraso em validações",
  "Retrabalho",
  "Risco de atraso",
  "Alta colaboração",
  "Baixa transparência",
  "Volatilidade de requisitos",
  "Outro",
];

const observationStatusTone: Record<string, string> = {
  registrada: "border-border text-muted-foreground bg-muted/40",
  "em análise": "border-warning/30 text-warning bg-warning/5",
  "associada a discussão": "border-info/30 text-info bg-info/5",
  consolidada: "border-success/30 text-success bg-success/5",
};

const impactTone: Record<string, string> = {
  Baixo: "text-muted-foreground",
  Médio: "text-info",
  Alto: "text-warning",
};

const riskTone: Record<string, string> = {
  Baixo: "text-muted-foreground",
  Moderado: "text-info",
  Elevado: "text-warning",
  Crítico: "text-destructive",
};

const impactToCode: Record<ProjectObservation["impact"], SvcObsImpact> = {
  Baixo: "LOW",
  Médio: "MEDIUM",
  Alto: "HIGH",
};

const riskToCode: Record<ProjectObservation["risk"], SvcObsRisk> = {
  Baixo: "LOW",
  Moderado: "MODERATE",
  Elevado: "HIGH",
  Crítico: "CRITICAL",
};

const DISCUSSION_VISIBILITY: VisibilityScope[] = [
  "Comunidade do domínio",
  "Participantes do projeto",
  "Consultores vinculados",
  "Administradores",
];

const DISCUSSION_STATUS: DiscussionStatus[] = [
  "Aberta",
  "Em análise",
  "Revisada",
  "Consolidada",
  "Arquivada",
];

function ManualObservationSection({
  projectId,
  domainId,
  initial,
  rawObservations,
  phenomena,
  attrNameById,
  phenNameById,
  mpoCategories,
  onObservationsChange,
  onDiscussionCreated,
}: {
  projectId: string;
  domainId: string;
  initial: ProjectObservation[];
  rawObservations: SvcObservation[];
  phenomena: SvcPhenomenon[];
  attrNameById: Map<string, string>;
  phenNameById: Map<string, string>;
  mpoCategories: MpoCategory[];
  onObservationsChange: (observs: SvcObservation[]) => void;
  onDiscussionCreated: () => void;
}) {
  const [items, setItems] = useState<ProjectObservation[]>(initial);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [discussionObsId, setDiscussionObsId] = useState<string | null>(null);
  const [discussionSubmitting, setDiscussionSubmitting] = useState(false);
  const firstAttrCode = mpoCategories[0]?.attributes[0]?.code ?? "";
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    attribute: firstAttrCode,
    phenomenon: PHENOMENA[0],
    customPhenomenon: "",
    impact: "Médio" as ProjectObservation["impact"],
    risk: "Moderado" as ProjectObservation["risk"],
    interpretation: "",
    author: "Você",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    attribute: firstAttrCode,
    phenomenon: PHENOMENA[0],
    customPhenomenon: "",
    impact: "Médio" as ProjectObservation["impact"],
    risk: "Moderado" as ProjectObservation["risk"],
    interpretation: "",
  });
  const [discussionForm, setDiscussionForm] = useState({
    title: "",
    question: "",
    visibility: "Participantes do projeto" as VisibilityScope,
    status: "Aberta" as DiscussionStatus,
  });

  const attributeOptions = useMemo(() => {
    return mpoCategories.flatMap((cat) => cat.attributes.map((a) => a.code));
  }, [mpoCategories]);

  const phenomenonOptions = useMemo(() => {
    const names = phenomena.map((p) => p.name);
    if (names.length === 0) return [...PHENOMENA];
    if (!names.includes("Outro")) names.push("Outro");
    return names;
  }, [phenomena]);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) return;
      setCurrentUserId(user.id);
      setForm((f) => ({ ...f, author: user.name }));
    });
  }, []);

  const resolvePhenomenonId = (select: string, custom: string) => {
    if (select === "Outro") return custom.trim() || undefined;
    const byName = phenomena.find((p) => p.name === select);
    if (byName) return byName.id;
    const byId = phenomena.find((p) => p.id === select);
    if (byId) return byId.id;
    return select;
  };

  const resolvePhenomenonIdFromRaw = (raw?: SvcObservation) => {
    if (!raw?.phenomenonId) return undefined;
    if (phenNameById.has(raw.phenomenonId)) return raw.phenomenonId;
    const byName = phenomena.find((p) => p.name === raw.phenomenonId);
    return byName?.id ?? (/^\d+$/.test(raw.phenomenonId) ? raw.phenomenonId : undefined);
  };

  const applyObservationUpdate = (updated: SvcObservation) => {
    const display = toProjectObservation(updated, attrNameById, phenNameById);
    setItems((prev) => prev.map((o) => (o.id === updated.id ? display : o)));
    onObservationsChange(rawObservations.map((o) => (o.id === updated.id ? updated : o)));
  };

  const prependObservation = (created: SvcObservation) => {
    setItems((prev) => [toProjectObservation(created, attrNameById, phenNameById), ...prev]);
    onObservationsChange([created, ...rawObservations]);
  };

  const isCustomPhenomenon = form.phenomenon === "Outro";
  const isEditCustomPhenomenon = editForm.phenomenon === "Outro";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || submitting) return;
    if (isCustomPhenomenon && !form.customPhenomenon.trim()) return;

    const finalPhenomenon = isCustomPhenomenon ? form.customPhenomenon.trim() : form.phenomenon;

    setSubmitting(true);
    try {
      const mpoAttr = mpoCategories
        .flatMap((c) => c.attributes)
        .find((a) => a.code === form.attribute);
      const created = await createObservation(projectId, {
        title: form.title.trim(),
        description: form.description.trim(),
        mpoAttributeId: mpoAttr?.id,
        attributeId: form.attribute,
        phenomenonId: finalPhenomenon,
        impact: impactToCode[form.impact],
        risk: riskToCode[form.risk],
        interpretation: form.interpretation.trim(),
        status: "REGISTERED",
        createdBy: currentUserId,
      });

      prependObservation(created);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
        setForm((f) => ({
          ...f,
          title: "",
          description: "",
          interpretation: "",
          customPhenomenon: "",
        }));
      }, 1400);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (observationId: string) => {
    const raw = rawObservations.find((o) => o.id === observationId);
    if (!raw) return;

    const attrCode = raw.mpoAttributeCode ?? raw.attributeId ?? firstAttrCode;
    const phenLabel = raw.phenomenonId
      ? (phenNameById.get(raw.phenomenonId) ?? raw.phenomenonId)
      : PHENOMENA[0];
    const matchedPhen = phenomena.find(
      (p) => p.id === raw.phenomenonId || p.name === raw.phenomenonId,
    );
    const phenSelect = matchedPhen
      ? matchedPhen.name
      : phenomenonOptions.includes(phenLabel)
        ? phenLabel
        : "Outro";

    setEditForm({
      title: raw.title,
      description: raw.description,
      attribute: attributeOptions.includes(attrCode) ? attrCode : firstAttrCode,
      phenomenon: phenSelect,
      customPhenomenon: phenSelect === "Outro" ? (raw.phenomenonId ?? "") : "",
      impact: obsImpactMap[raw.impact],
      risk: obsRiskMap[raw.risk],
      interpretation: raw.interpretation ?? "",
    });
    setEditingId(observationId);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editForm.title.trim() || !editForm.description.trim() || editSubmitting) {
      return;
    }
    if (isEditCustomPhenomenon && !editForm.customPhenomenon.trim()) return;

    setEditSubmitting(true);
    try {
      const editMpoAttr = mpoCategories
        .flatMap((c) => c.attributes)
        .find((a) => a.code === editForm.attribute);
      const updated = await updateObservation(editingId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        mpoAttributeId: editMpoAttr?.id,
        attributeId: editForm.attribute,
        phenomenonId: resolvePhenomenonId(editForm.phenomenon, editForm.customPhenomenon),
        impact: impactToCode[editForm.impact],
        risk: riskToCode[editForm.risk],
        interpretation: editForm.interpretation.trim(),
      });

      if (!updated) {
        toast.error("Não foi possível atualizar a observação.");
        return;
      }

      applyObservationUpdate(updated);
      toast.success("Observação atualizada com sucesso.");
      setEditOpen(false);
      setEditingId(null);
    } finally {
      setEditSubmitting(false);
    }
  };

  const openDiscussion = (observationId: string) => {
    const raw = rawObservations.find((o) => o.id === observationId);
    const display = items.find((o) => o.id === observationId);
    setDiscussionForm({
      title: `Discussão sobre: ${display?.title ?? raw?.title ?? "observação"}`,
      question: "Como esta observação impacta os fenômenos do projeto?",
      visibility: "Participantes do projeto",
      status: "Aberta",
    });
    setDiscussionObsId(observationId);
    setDiscussionOpen(true);
  };

  const handleDiscussionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussionObsId || !discussionForm.title.trim() || !discussionForm.question.trim()) {
      return;
    }
    if (discussionSubmitting) return;

    const raw = rawObservations.find((o) => o.id === discussionObsId);

    setDiscussionSubmitting(true);
    try {
      const created = await createDiscussion({
        title: discussionForm.title.trim(),
        question: discussionForm.question.trim(),
        domainId,
        projectId,
        observationId: discussionObsId,
        phenomenonId: resolvePhenomenonIdFromRaw(raw),
        status: statusCodes[discussionForm.status],
        visibility: visibilityCodes[discussionForm.visibility],
        createdBy: currentUserId,
        contributions: [],
      });

      const linked = await linkObservationToDiscussion(discussionObsId, created.id);
      if (linked) applyObservationUpdate(linked);

      onDiscussionCreated();
      toast.success("Discussão observacional criada com sucesso.");
      setDiscussionOpen(false);
      setDiscussionObsId(null);
    } catch {
      toast.error("Não foi possível criar a discussão.");
    } finally {
      setDiscussionSubmitting(false);
    }
  };

  const handleMarkAnalyzed = async (observationId: string) => {
    setAnalyzingId(observationId);
    try {
      const updated = await markObservationAsAnalyzed(observationId);
      if (!updated) {
        toast.error("Não foi possível marcar a observação como analisada.");
        return;
      }
      applyObservationUpdate(updated);
      toast.success("Observação marcada como analisada.");
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <section>
      <SectionTitle
        eyebrow="Evidências do projeto"
        title="Registro Manual de Observação"
        description="Para este MVP, as evidências do projeto são registradas manualmente. Futuramente, esses registros poderão ser complementados por upload de artefatos e análise automatizada."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Nova observação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
              <DialogHeader>
                <DialogTitle>Registrar nova observação</DialogTitle>
                <DialogDescription>
                  Registre uma evidência observada no projeto: descrição, atributo afetado, fenômeno
                  associado e sua interpretação inicial.
                </DialogDescription>
              </DialogHeader>
              {success ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <p className="text-sm font-medium">Observação registrada com sucesso.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="obs-title">Título da observação</Label>
                    <Input
                      id="obs-title"
                      placeholder="Ex.: Cliente solicitou nova alteração de escopo após aprovação inicial"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="obs-date">Data da observação</Label>
                      <Input
                        id="obs-date"
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="obs-author">Responsável pelo registro</Label>
                      <Input
                        id="obs-author"
                        value={form.author}
                        onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="obs-desc">Descrição da evidência</Label>
                    <Textarea
                      id="obs-desc"
                      rows={3}
                      placeholder="Descreva o que aconteceu, qual evidência foi observada e por que isso é relevante para o projeto."
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Atributo MPO relacionado</Label>
                      <Select
                        value={form.attribute}
                        onValueChange={(v) => setForm((f) => ({ ...f, attribute: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o atributo" />
                        </SelectTrigger>
                        <SelectContent>
                          {mpoCategories.map((cat) => (
                            <SelectGroup key={cat.code}>
                              <SelectLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                {cat.code} — {cat.name}
                              </SelectLabel>
                              {cat.attributes.map((a) => (
                                <SelectItem key={a.code} value={a.code} className="text-xs">
                                  {a.code} — {a.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fenômeno observado</Label>
                      <Select
                        value={form.phenomenon}
                        onValueChange={(v) => setForm((f) => ({ ...f, phenomenon: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PHENOMENA.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isCustomPhenomenon && (
                        <Input
                          className="mt-2"
                          placeholder="Nomear novo fenômeno observado"
                          value={form.customPhenomenon}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, customPhenomenon: e.target.value }))
                          }
                        />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Impacto</Label>
                      <Select
                        value={form.impact}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, impact: v as ProjectObservation["impact"] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Baixo", "Médio", "Alto"].map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Risco</Label>
                      <Select
                        value={form.risk}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, risk: v as ProjectObservation["risk"] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Baixo", "Moderado", "Elevado", "Crítico"].map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="obs-interp">Interpretação inicial</Label>
                    <Textarea
                      id="obs-interp"
                      rows={2}
                      placeholder="Descreva a interpretação inicial sobre essa observação."
                      value={form.interpretation}
                      onChange={(e) => setForm((f) => ({ ...f, interpretation: e.target.value }))}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" size="sm" disabled={submitting}>
                      {submitting ? "Registrando…" : "Registrar observação"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mt-4 space-y-3">
        {items.map((o) => (
          <article key={o.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  <ClipboardList className="h-3 w-3" /> Observação manual
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span className="font-mono">{o.date}</span>
                </div>
                <h3 className="mt-1.5 text-[14px] font-semibold leading-snug text-foreground">
                  {o.title}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {o.description}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                  observationStatusTone[o.status],
                )}
              >
                {o.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 md:grid-cols-4">
              <Meta label="Atributo" value={o.attribute} />
              <Meta label="Fenômeno" value={o.phenomenon} />
              <Meta label="Impacto" value={o.impact} className={impactTone[o.impact]} />
              <Meta label="Risco" value={o.risk} className={riskTone[o.risk]} />
            </div>

            {o.interpretation && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/70" />
                <p className="text-[12.5px] leading-relaxed text-foreground/90">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Interpretação ·{" "}
                  </span>
                  {o.interpretation}
                </p>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>por {o.author}</span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-[11px]"
                  onClick={() => openEdit(o.id)}
                >
                  <PenSquare className="h-3 w-3" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-[11px]"
                  onClick={() => openDiscussion(o.id)}
                >
                  <MessageSquare className="h-3 w-3" /> Criar discussão
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-[11px]"
                  disabled={analyzingId === o.id || o.status === "em análise"}
                  onClick={() => handleMarkAnalyzed(o.id)}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {analyzingId === o.id ? "Atualizando…" : "Marcar como analisada"}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Editar observação</DialogTitle>
            <DialogDescription>
              Atualize os dados da evidência observada neste projeto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-obs-title">Título da observação</Label>
              <Input
                id="edit-obs-title"
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-obs-desc">Descrição da evidência</Label>
              <Textarea
                id="edit-obs-desc"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Atributo relacionado</Label>
                <Select
                  value={editForm.attribute}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, attribute: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {attributeOptions.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fenômeno observado</Label>
                <Select
                  value={editForm.phenomenon}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, phenomenon: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {phenomenonOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditCustomPhenomenon && (
                  <Input
                    className="mt-2"
                    placeholder="Nomear fenômeno observado"
                    value={editForm.customPhenomenon}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, customPhenomenon: e.target.value }))
                    }
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Impacto</Label>
                <Select
                  value={editForm.impact}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, impact: v as ProjectObservation["impact"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Baixo", "Médio", "Alto"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Risco</Label>
                <Select
                  value={editForm.risk}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, risk: v as ProjectObservation["risk"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Baixo", "Moderado", "Elevado", "Crítico"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-obs-interp">Interpretação inicial</Label>
              <Textarea
                id="edit-obs-interp"
                rows={2}
                value={editForm.interpretation}
                onChange={(e) => setEditForm((f) => ({ ...f, interpretation: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit" size="sm" disabled={editSubmitting}>
                {editSubmitting ? "Salvando…" : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={discussionOpen} onOpenChange={setDiscussionOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Nova discussão observacional</DialogTitle>
            <DialogDescription>
              Abra uma discussão a partir desta observação registrada no projeto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDiscussionSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dis-title">Título da discussão</Label>
              <Input
                id="dis-title"
                value={discussionForm.title}
                onChange={(e) => setDiscussionForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dis-question">Pergunta investigativa</Label>
              <Textarea
                id="dis-question"
                rows={3}
                value={discussionForm.question}
                onChange={(e) => setDiscussionForm((f) => ({ ...f, question: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Visibilidade</Label>
                <Select
                  value={discussionForm.visibility}
                  onValueChange={(v) =>
                    setDiscussionForm((f) => ({ ...f, visibility: v as VisibilityScope }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCUSSION_VISIBILITY.map((v) => (
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
                  value={discussionForm.status}
                  onValueChange={(v) =>
                    setDiscussionForm((f) => ({ ...f, status: v as DiscussionStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCUSSION_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" size="sm" disabled={discussionSubmitting}>
                {discussionSubmitting ? "Criando…" : "Criar discussão"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Meta({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-[12.5px] font-medium text-foreground", className)}>{value}</p>
    </div>
  );
}

/* ------------------------- Update / Close project ------------------------- */

function UpdateProjectButton({
  projectId,
  projectName,
  project,
  engagementPercent,
  onUpdated,
}: {
  projectId: string;
  projectName: string;
  project: SvcProject;
  engagementPercent: number;
  onUpdated: (project: SvcProject, engagementPercent: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    status: updateStatusToLabel[project.status],
    progress: project.progress,
    risk: riskCodeToLabel[project.riskLevel],
    engagement: engagementPercent,
    comment: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      status: updateStatusToLabel[project.status],
      progress: project.progress,
      risk: riskCodeToLabel[project.riskLevel],
      engagement: engagementPercent,
      comment: "",
    });
  }, [open, project, engagementPercent]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const progress = Number(form.progress);
    const engagement = Number(form.engagement);
    if (
      !Number.isFinite(progress) ||
      progress < 0 ||
      progress > 100 ||
      !Number.isFinite(engagement) ||
      engagement < 0 ||
      engagement > 100
    ) {
      toast.error("Erro ao atualizar projeto.");
      return;
    }

    const status = updateStatusFromLabel[form.status];
    const riskLevel = riskLabelToCode[form.risk];
    if (!status || !riskLevel) {
      toast.error("Erro ao atualizar projeto.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<SvcProject> = {
        status,
        riskLevel,
        progress,
        clientEngagement: percentToEngagement(engagement),
      };
      if (form.comment.trim()) {
        payload.summary = project.summary
          ? `${project.summary}\n\n${form.comment.trim()}`
          : form.comment.trim();
      }

      const updated = await updateProject(projectId, payload);
      if (!updated) {
        toast.error("Erro ao atualizar projeto.");
        return;
      }

      onUpdated(updated, engagement);
      toast.success("Projeto atualizado com sucesso.");
      setOpen(false);
    } catch {
      toast.error("Erro ao atualizar projeto.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar projeto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar {projectName}</DialogTitle>
          <DialogDescription>
            Atualize o estado observacional do projeto para refletir a evolução percebida.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status observacional</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Em observação", "Estável", "Em risco", "Em revisão", "Encerrado"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Risco atual</Label>
              <Select value={form.risk} onValueChange={(v) => setForm((f) => ({ ...f, risk: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Baixo", "Moderado", "Elevado", "Crítico"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upd-progress">Progresso (%)</Label>
              <Input
                id="upd-progress"
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upd-eng">Engajamento atual (%)</Label>
              <Input
                id="upd-eng"
                type="number"
                min={0}
                max={100}
                value={form.engagement}
                onChange={(e) => setForm((f) => ({ ...f, engagement: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="upd-comment">Comentário de atualização</Label>
            <Textarea
              id="upd-comment"
              rows={3}
              placeholder="Resuma o motivo da atualização e o que mudou na observação do projeto."
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Salvando…" : "Salvar atualização"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CloseObservationButton({ projectName }: { projectName: string }) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    result: "Concluído com sucesso",
    summary: "",
    phenomena: "",
    lessons: "",
    patterns: "",
    recommendation: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setOpen(false);
    }, 1600);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Lock className="h-3.5 w-3.5" /> Encerrar observação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Encerrar observação de {projectName}</DialogTitle>
          <DialogDescription>
            Consolide os aprendizados deste projeto. O caso será mantido no histórico do
            observatório para alimentar análises futuras.
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-sm font-medium">Observação do projeto encerrada com sucesso.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Resultado final</Label>
              <Select
                value={form.result}
                onValueChange={(v) => setForm((f) => ({ ...f, result: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Concluído com sucesso",
                    "Concluído com atraso",
                    "Concluído com mudanças relevantes",
                    "Suspenso",
                    "Cancelado",
                  ].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-summary">Resumo final da observação</Label>
              <Textarea
                id="cl-summary"
                rows={3}
                placeholder="Síntese narrativa do que foi observado durante o ciclo do projeto."
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-phen">Principais fenômenos observados</Label>
              <Textarea
                id="cl-phen"
                rows={2}
                placeholder="Padrões, comportamentos e sinais relevantes identificados."
                value={form.phenomena}
                onChange={(e) => setForm((f) => ({ ...f, phenomena: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-lessons">Lições aprendidas</Label>
              <Textarea
                id="cl-lessons"
                rows={2}
                placeholder="O que deve ser preservado, evitado ou replicado."
                value={form.lessons}
                onChange={(e) => setForm((f) => ({ ...f, lessons: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-patterns">Padrões identificados</Label>
              <Textarea
                id="cl-patterns"
                rows={2}
                placeholder="Padrões que podem caracterizar projetos similares no futuro."
                value={form.patterns}
                onChange={(e) => setForm((f) => ({ ...f, patterns: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-rec">Recomendação para projetos futuros</Label>
              <Textarea
                id="cl-rec"
                rows={2}
                placeholder="Boas práticas e alertas para casos semelhantes."
                value={form.recommendation}
                onChange={(e) => setForm((f) => ({ ...f, recommendation: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit" size="sm">
                Confirmar encerramento
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* --------------- Discussões e Conhecimentos do Projeto ----------------- */

function ProjectDiscussionsAndKnowledge({
  projectId,
  projectName,
  domainName,
  domainSlug,
  phenNameById,
  refreshKey,
}: {
  projectId: string;
  projectName: string;
  domainName: string;
  domainSlug?: string;
  phenNameById: Map<string, string>;
  refreshKey: number;
}) {
  const [projectDiscussions, setProjectDiscussions] = useState<
    ReturnType<typeof toCommunityDiscussion>[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    getDiscussionsByProject(projectId).then((discussions) => {
      if (cancelled) return;
      setProjectDiscussions(
        discussions.map((d) =>
          toCommunityDiscussion(d, {
            domain: domainName,
            project: projectName,
            phenomenon: d.phenomenonId ? (phenNameById.get(d.phenomenonId) ?? d.phenomenonId) : "—",
            originObservation: d.observationId ? `Observação #${d.observationId}` : undefined,
          }),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, projectName, domainName, phenNameById, refreshKey]);

  const projectKnowledge = allKnowledge.filter((k) => k.project === projectName);
  const communityLink = domainSlug ? (
    <Link to="/community/$slug" params={{ slug: domainSlug }}>
      Ir para a comunidade <ArrowRight className="h-3 w-3" />
    </Link>
  ) : (
    <Link to="/community">
      Ir para a comunidade <ArrowRight className="h-3 w-3" />
    </Link>
  );

  if (projectDiscussions.length === 0 && projectKnowledge.length === 0) return null;

  return (
    <>
      {projectDiscussions.length > 0 && (
        <section>
          <SectionTitle
            eyebrow="Camada sociotécnica"
            title="Discussões do Projeto"
            description="Interpretações coletivas vinculadas a fenômenos deste projeto."
            action={
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                {communityLink}
              </Button>
            }
          />
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {projectDiscussions.map((d) => (
              <article key={d.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    <MessageSquare className="h-3 w-3" /> {d.phenomenon}
                  </div>
                  <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {d.status}
                  </span>
                </div>
                <h3 className="mt-2 text-[14px] font-semibold leading-snug text-foreground">
                  {d.title}
                </h3>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  {d.contributions} contribuições · último: {d.lastParticipant}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2 text-[11px]"
                  >
                    {domainSlug ? (
                      <Link to="/community/$slug" params={{ slug: domainSlug }}>
                        <Eye className="h-3 w-3" /> Ver discussão
                      </Link>
                    ) : (
                      <Link to="/community">
                        <Eye className="h-3 w-3" /> Ver discussão
                      </Link>
                    )}
                  </Button>
                  {d.status !== "Consolidada" && d.status !== "Arquivada" && (
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 px-2 text-[11px]"
                    >
                      {domainSlug ? (
                        <Link to="/community/$slug" params={{ slug: domainSlug }}>
                          <Sparkles className="h-3 w-3" /> Consolidar conhecimento
                        </Link>
                      ) : (
                        <Link to="/community">
                          <Sparkles className="h-3 w-3" /> Consolidar conhecimento
                        </Link>
                      )}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {projectKnowledge.length > 0 && (
        <section>
          <SectionTitle
            eyebrow="Aprendizado consolidado"
            title="Conhecimentos do Projeto"
            description="Aprendizados que nasceram das discussões observacionais deste projeto."
          />
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {projectKnowledge.map((k) => (
              <article key={k.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    <BookOpen className="h-3 w-3" /> {k.phenomenon}
                  </div>
                  <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {k.status}
                  </span>
                </div>
                <h3 className="mt-2 text-[14.5px] font-semibold leading-snug text-foreground">
                  {k.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">{k.summary}</p>
                <div className="mt-3 rounded-md border border-border bg-muted/30 p-3 text-[12px] text-foreground">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    recomendação ·{" "}
                  </span>
                  {k.recommendation}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Confiança: <span className="font-medium text-foreground">{k.confidence}</span>
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
