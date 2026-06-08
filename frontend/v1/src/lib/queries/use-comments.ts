import { useQuery } from "@tanstack/react-query";
import * as commentsApi from "@/lib/api/comments";

export function useComments(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId, "comments"],
    queryFn: () => commentsApi.listComments(projectId),
    enabled: projectId.length > 0,
  });
}
