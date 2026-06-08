import { useQuery } from "@tanstack/react-query";
import * as projectsApi from "@/lib/api/projects";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.listProjects(),
  });
}
