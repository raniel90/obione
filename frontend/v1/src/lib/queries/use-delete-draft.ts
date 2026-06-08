import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as draftsApi from "@/lib/api/drafts";

export function useDeleteDraft(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) => draftsApi.deleteDraft(draftId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "drafts"] });
    },
  });
}
