import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as commentsApi from "@/lib/api/comments";

export function useCreateComment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => commentsApi.createComment(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "comments"] });
      qc.invalidateQueries({ queryKey: ["project", projectId, "detail"] });
    },
  });
}
