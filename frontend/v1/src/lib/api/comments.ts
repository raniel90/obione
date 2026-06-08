import { api } from "./client";
import type { Comment } from "./types";

export function listComments(projectId: string): Promise<Comment[]> {
  return api<Comment[]>(`/projects/${projectId}/comments`);
}

export function createComment(projectId: string, body: string): Promise<Comment> {
  return api<Comment>(`/projects/${projectId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function updateComment(commentId: string, body: string): Promise<Comment> {
  return api<Comment>(`/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({ body }),
  });
}

export function deleteComment(commentId: string): Promise<void> {
  return api<void>(`/comments/${commentId}`, { method: "DELETE" });
}
