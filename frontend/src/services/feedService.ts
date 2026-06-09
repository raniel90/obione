import { request } from "./apiClient";

export interface FeedEvent {
  kind: string; // observation | discussion | knowledge
  id: number;
  title: string;
  projectId: number | null;
  projectName: string | null;
  domainId: number | null;
  actorName: string | null;
  createdAt: string;
}

/** Real observatory timeline — GET /api/feed (optionally scoped by domain/project). */
export function getFeed(params?: {
  domainId?: string;
  projectId?: string;
  limit?: number;
}): Promise<FeedEvent[]> {
  const q = new URLSearchParams();
  if (params?.domainId) q.set("domainId", params.domainId);
  if (params?.projectId) q.set("projectId", params.projectId);
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return request<FeedEvent[]>(`/feed${qs ? `?${qs}` : ""}`);
}
