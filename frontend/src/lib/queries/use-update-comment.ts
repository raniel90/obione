import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as commentsApi from "@/lib/api/comments";

export function useUpdateComment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      commentsApi.updateComment(commentId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "comments"] });
      qc.invalidateQueries({ queryKey: ["project", projectId, "detail"] });
    },
  });
}
