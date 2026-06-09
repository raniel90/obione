import { request } from "./apiClient";

export interface DomainSuggestion {
  suggestedDomainSlug: string;
  confidence: number;
  rationale: string;
}

export interface ObservationSuggestion {
  title: string;
  description: string;
  attributeId: string;
  impact: string;
}

export interface ObservationSuggestions {
  suggestions: ObservationSuggestion[];
}

export interface KnowledgeDraft {
  title: string;
  summary: string;
  evidence: string;
  recommendation: string;
  confidence: string;
}

export interface DomainSynthesis {
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
