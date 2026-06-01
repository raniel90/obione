import { useQuery } from "@tanstack/react-query";
import * as projectsApi from "@/lib/api/projects";

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: ["project", id, "detail"],
    queryFn: () => projectsApi.getProjectDetail(id),
    enabled: id.length > 0,
  });
}
