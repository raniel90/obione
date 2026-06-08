import { useQuery } from "@tanstack/react-query";
import * as draftsApi from "@/lib/api/drafts";

export function useDrafts(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId, "drafts"],
    queryFn: () => draftsApi.listDrafts(projectId),
    enabled: projectId.length > 0,
  });
}
