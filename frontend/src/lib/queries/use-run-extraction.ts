import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as extractionsApi from "@/lib/api/extractions";

export function useRunExtraction(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => extractionsApi.runExtraction(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "extractions"] });
      qc.invalidateQueries({ queryKey: ["project", projectId, "detail"] });
      qc.invalidateQueries({ queryKey: ["portfolio", "cockpit"] });
    },
  });
}
