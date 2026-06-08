import { useQuery } from "@tanstack/react-query";
import * as synthesisApi from "@/lib/api/synthesis";

export function useProjectSyntheses(projectId: string) {
  return useQuery({
    queryKey: ["synthesis", "project", projectId],
    queryFn: () => synthesisApi.listProjectSyntheses(projectId),
    enabled: projectId.length > 0,
  });
}
