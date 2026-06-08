import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as themesApi from "@/lib/api/themes";

export function useSuggestTheme(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => themesApi.suggestTheme(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "themes"] });
    },
  });
}
