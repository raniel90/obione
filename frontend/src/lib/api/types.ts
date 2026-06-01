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
