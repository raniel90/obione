import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as projectsApi from "@/lib/api/projects";

export function useAddProjectClient(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => projectsApi.addProjectClient(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "detail"] });
    },
  });
}
