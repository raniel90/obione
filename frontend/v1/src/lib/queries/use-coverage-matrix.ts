import { useQuery } from "@tanstack/react-query";
import * as portfolioApi from "@/lib/api/portfolio";

export function useCoverageMatrix() {
  return useQuery({
    queryKey: ["portfolio", "coverage-matrix"],
    queryFn: () => portfolioApi.getCoverageMatrix(),
  });
}
