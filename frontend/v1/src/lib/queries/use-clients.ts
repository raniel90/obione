import { useQuery } from "@tanstack/react-query";
import * as usersApi from "@/lib/api/users";

export function useClients() {
  return useQuery({
    queryKey: ["users", "clients"],
    queryFn: () => usersApi.listClients(),
  });
}
