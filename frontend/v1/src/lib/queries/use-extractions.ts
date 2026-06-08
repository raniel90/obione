import { useQuery } from "@tanstack/react-query";
import * as extractionsApi from "@/lib/api/extractions";

export function useExtractions(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId, "extractions"],
    queryFn: () => extractionsApi.listExtractions(projectId),
    enabled: projectId.length > 0,
  });
}
