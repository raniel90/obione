import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as draftsApi from "@/lib/api/drafts";

export function useGenerateDrafts(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => draftsApi.generateDrafts(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "drafts"] });
    },
  });
}
