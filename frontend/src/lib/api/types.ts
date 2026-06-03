export type Role = "consultant" | "client" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export type Domain =
  | "legal"
  | "health"
  | "sports"
  | "branding"
  | "gastronomy"
  | "other";

export interface Project {
  id: string;
  name: string;
  domain: Domain;
  description: string;
  consultant_id: string;
  created_at: string;
  updated_at: string;
}

export interface ExtractionBrief {
  id: string;
  source: string;
  llm_model: string | null;
  created_at: string;
}

export interface Coverage {
  extraction_id: string | null;
  filled: number;
  total_in_scope: number;
  out_of_scope_count: number;
  percentage: number;
}

export interface Evaluation {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  f1: number;
  needs_human_review_count: number;
}

export interface CommentBrief {
  id: string;
  author_id: string | null;
  parent_id: string | null;
  body: string;
  created_at: string;
}

export interface ProjectDetail {
  project: Project;
  latest_llm_extraction: ExtractionBrief | null;
  latest_gabarito: ExtractionBrief | null;
  coverage: Coverage;
  evaluation: Evaluation | null;
  recent_comments: CommentBrief[];
  counts: { extractions: number; comments: number };
}

export type ExtractionContent = Record<string, unknown>;

export interface ExtractionRun {
  id: string;
  project_id: string;
  source: "llm" | "manual";
  llm_model: string | null;
  source_description_hash: string | null;
  content: ExtractionContent;
  created_at: string;
}

export interface ThemeSuggestion {
  id: string;
  project_id: string;
  suggested_domain: Domain;
  confidence: number;
  model_id: string;
  reasoning: string | null;
  accepted: boolean;
  accepted_by: string | null;
  accepted_at: string | null;
  created_at: string;
}

export interface CategoryVisibility {
  category_key: string;
  visible: boolean;
  updated_at: string;
}

export interface AttributeVisibility {
  attribute_key: string;
  visible: boolean;
  updated_at: string;
}

export interface VisibilityState {
  categories: CategoryVisibility[];
  overrides: AttributeVisibility[];
  resolved: Record<string, boolean>;
}

export interface StatusDistribution {
  registered: number;
  extracted: number;
  reviewed: number;
}

export interface ThemeBreakdown {
  domain: Domain;
  count: number;
  avg_coverage: number;
  status_distribution: StatusDistribution;
  reviewed_pct: number;
}

export interface Cockpit {
  total_projects: number;
  avg_coverage_overall: number;
  status_distribution: StatusDistribution;
  themes: ThemeBreakdown[];
}

export interface Comment {
  id: string;
  project_id: string;
  author_id: string | null;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export type DraftKind = "next_step" | "attention_point";
export type DraftStatus = "draft" | "published";

export interface Draft {
  id: string;
  project_id: string;
  source_extraction_id: string | null;
  kind: DraftKind;
  title: string | null;
  body: string;
  status: DraftStatus;
  llm_model: string | null;
  generated_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type FeedEventKind = "new_comment" | "new_extraction";

export interface FeedEvent {
  kind: FeedEventKind;
  project_id: string;
  project_name: string;
  actor_id: string | null;
  target_id: string;
  created_at: string;
  summary: string;
}

export interface FeedResponse {
  events: FeedEvent[];
}
