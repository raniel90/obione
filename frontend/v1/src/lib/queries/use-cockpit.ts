import { useQuery } from "@tanstack/react-query";
import * as portfolioApi from "@/lib/api/portfolio";

export function useCockpit() {
  return useQuery({
    queryKey: ["portfolio", "cockpit"],
    queryFn: () => portfolioApi.getCockpit(),
  });
}
