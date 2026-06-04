import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as projectsApi from "@/lib/api/projects";
import type { ProjectCreate } from "@/lib/api/types";

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ProjectCreate>) => projectsApi.updateProject(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", id, "detail"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}
