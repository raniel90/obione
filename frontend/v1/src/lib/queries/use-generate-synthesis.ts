import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as synthesisApi from "@/lib/api/synthesis";

export function useGenerateSynthesis(domain: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => synthesisApi.generateSynthesis(domain),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["synthesis"] }),
  });
}
