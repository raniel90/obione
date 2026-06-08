import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as synthesisApi from "@/lib/api/synthesis";

export function useDeleteSynthesis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => synthesisApi.deleteSynthesis(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["synthesis"] }),
  });
}
