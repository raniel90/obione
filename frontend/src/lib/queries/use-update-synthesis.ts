import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as synthesisApi from "@/lib/api/synthesis";

export function useUpdateSynthesis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { title?: string; body?: string } }) =>
      synthesisApi.updateSynthesis(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["synthesis"] }),
  });
}
