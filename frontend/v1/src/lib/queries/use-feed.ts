import { useQuery } from "@tanstack/react-query";
import * as feedApi from "@/lib/api/feed";

export function useFeed() {
  return useQuery({
    queryKey: ["feed"],
    queryFn: () => feedApi.getFeed(),
  });
}
