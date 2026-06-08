import { useQuery } from "@tanstack/react-query";
import * as themesApi from "@/lib/api/themes";

export function useThemeSuggestions(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId, "themes"],
    queryFn: () => themesApi.listThemeSuggestions(projectId),
    enabled: projectId.length > 0,
  });
}
