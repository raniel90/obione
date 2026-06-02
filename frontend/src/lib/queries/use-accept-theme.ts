import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as themesApi from "@/lib/api/themes";

export function useAcceptTheme(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (suggestionId: string) => themesApi.acceptThemeSuggestion(suggestionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "themes"] });
      qc.invalidateQueries({ queryKey: ["project", projectId, "detail"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
