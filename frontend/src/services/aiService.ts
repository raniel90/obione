import { request } from "./apiClient";

/** Reproducibility metadata attached to every AI suggestion (RNF04). */
export interface AiSuggestionMeta {
  suggestionId: number;
  provider: string;
  model: string;
  generatedAt: string;
}

export interface DomainSuggestion extends AiSuggestionMeta {
  suggestedDomainSlug: string;
  confidence: number;
  rationale: string;
}

export interface ObservationSuggestion {
  title: string;
  description: string;
  attributeId: string;
  impact: string;
  sourceExcerpt: string;
}

export interface ObservationSuggestions extends AiSuggestionMeta {
  suggestions: ObservationSuggestion[];
}

export interface KnowledgeDraft extends AiSuggestionMeta {
  title: string;
  summary: string;
  evidence: string;
  recommendation: string;
  confidence: string;
}

export interface DomainSynthesis extends AiSuggestionMeta {
  summary: string;
  patterns: string[];
  lessons: string[];
}

/** Categorizadora — suggest the project's domain/theme. */
export function suggestDomain(projectId: string): Promise<DomainSuggestion> {
  return request<DomainSuggestion>(`/projects/${projectId}/ai/suggest-domain`, { method: "POST" });
}

/** Observadora assistida — suggest observations mapped to the MPO lens. */
export function suggestObservations(projectId: string): Promise<ObservationSuggestions> {
  return request<ObservationSuggestions>(`/projects/${projectId}/ai/suggest-observations`, {
    method: "POST",
  });
}

/** Sintetizadora — draft consolidated knowledge from a discussion. */
export function suggestKnowledge(discussionId: string): Promise<KnowledgeDraft> {
  return request<KnowledgeDraft>(`/discussions/${discussionId}/ai/suggest-knowledge`, {
    method: "POST",
  });
}

/** Conectora — cross-project synthesis for a domain. */
export function synthesizeDomain(domainId: string): Promise<DomainSynthesis> {
  return request<DomainSynthesis>(`/domains/${domainId}/ai/synthesize`, { method: "POST" });
}

/** Estruturadora — structure a free-text observation into a titled, MPO-attributed record. */
export interface StructuredObservation extends AiSuggestionMeta {
  title: string;
  attributeId: string;
  interpretation: string;
}

export function structureObservation(
  projectId: string,
  description: string,
): Promise<StructuredObservation> {
  return request<StructuredObservation>(`/projects/${projectId}/ai/structure-observation`, {
    method: "POST",
    json: { description },
  });
}

export interface ProjectSetupSuggestion extends AiSuggestionMeta {
  suggestedDomainSlug: string | null;
  suggestedDomainId: number | null;
  confidence: number;
  attributeIds: string[];
  expectedPhenomena: string[];
  rationale: string;
}

/** Setup assistido — suggest domain, MPO attributes and phenomena for a project being created. */
export function suggestProjectSetup(input: {
  name: string;
  description: string;
  observationObjective?: string;
}): Promise<ProjectSetupSuggestion> {
  return request<ProjectSetupSuggestion>("/ai/project-setup", {
    method: "POST",
    json: input,
  });
}

export type AiSuggestionType =
  | "DOMAIN"
  | "OBSERVATIONS"
  | "KNOWLEDGE"
  | "SYNTHESIS"
  | "PROJECT_SETUP";

export interface AiTypeStats {
  type: AiSuggestionType;
  total: number;
  accepted: number;
  acceptanceRatePercent: number;
}

export interface AiStats {
  totalSuggestions: number;
  totalAccepted: number;
  byType: AiTypeStats[];
}

/** Suggestion × acceptance metrics derived from the AI suggestion log. */
export function getAiStats(): Promise<AiStats> {
  return request<AiStats>("/ai/stats");
}
