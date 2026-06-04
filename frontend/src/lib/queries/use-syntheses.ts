import { useQuery } from "@tanstack/react-query";
import * as synthesisApi from "@/lib/api/synthesis";

export function useSyntheses(domain: string) {
  return useQuery({
    queryKey: ["synthesis", "domain", domain],
    queryFn: () => synthesisApi.listSyntheses(domain),
    enabled: domain.length > 0,
  });
}
