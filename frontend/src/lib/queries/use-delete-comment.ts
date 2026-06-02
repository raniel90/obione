import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as commentsApi from "@/lib/api/comments";

export function useDeleteComment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.deleteComment(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "comments"] });
      qc.invalidateQueries({ queryKey: ["project", projectId, "detail"] });
    },
  });
}
