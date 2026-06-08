import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as draftsApi from "@/lib/api/drafts";

export function usePublishDraft(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) => draftsApi.publishDraft(draftId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "drafts"] });
    },
  });
}
