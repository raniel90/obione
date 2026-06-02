import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as visibilityApi from "@/lib/api/visibility";

export function useSetCategoryVisibility(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryKey, visible }: { categoryKey: string; visible: boolean }) =>
      visibilityApi.setCategoryVisibility(projectId, categoryKey, visible),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "visibility"] });
    },
  });
}
