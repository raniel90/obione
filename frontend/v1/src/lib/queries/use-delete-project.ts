import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as projectsApi from "@/lib/api/projects";

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}
