import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as draftsApi from "@/lib/api/drafts";

export function useUpdateDraft(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ draftId, patch }: { draftId: string; patch: { title?: string; body?: string } }) =>
      draftsApi.updateDraft(draftId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "drafts"] });
    },
  });
}
