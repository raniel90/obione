import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as synthesisApi from "@/lib/api/synthesis";

export function usePublishSynthesis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => synthesisApi.publishSynthesis(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["synthesis"] }),
  });
}
