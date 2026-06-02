import { useQuery } from "@tanstack/react-query";
import * as visibilityApi from "@/lib/api/visibility";

export function useVisibility(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId, "visibility"],
    queryFn: () => visibilityApi.getVisibilityState(projectId),
    enabled: projectId.length > 0,
  });
}
