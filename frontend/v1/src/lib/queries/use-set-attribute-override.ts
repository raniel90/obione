import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as visibilityApi from "@/lib/api/visibility";

export type AttributeVisibilityChoice = "inherit" | "visible" | "hidden";

export function useSetAttributeOverride(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      attributeKey,
      choice,
    }: {
      attributeKey: string;
      choice: AttributeVisibilityChoice;
    }) => {
      if (choice === "inherit") {
        return visibilityApi.deleteAttributeOverride(projectId, attributeKey);
      }
      return visibilityApi.setAttributeOverride(projectId, attributeKey, choice === "visible");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "visibility"] });
    },
  });
}
