import type { User } from "@/types/user";

export const mockUsers: User[] = [
  { id: "u1", name: "Ana Coelho", email: "admin@obione.dev", profileCode: "ADMIN", status: "ACTIVE", domainIds: ["d1", "d2", "d3", "d4", "d5", "d6"], projectIds: ["p1", "p6"], createdAt: "2026-01-10" },
  { id: "u2", name: "Lucas Martins", email: "lucas@obione.dev", profileCode: "CONSULTANT", status: "ACTIVE", domainIds: ["d1", "d2"], projectIds: ["p2", "p9"], createdAt: "2026-01-15" },
  { id: "u3", name: "Marina Reis", email: "marina@obione.dev", profileCode: "CONSULTANT", status: "ACTIVE", domainIds: ["d3"], projectIds: ["p3", "p7"], createdAt: "2026-01-18" },
  { id: "u4", name: "Pedro Almeida", email: "pedro@obione.dev", profileCode: "CONSULTANT", status: "ACTIVE", domainIds: ["d4"], projectIds: ["p4", "p8"], createdAt: "2026-01-20" },
  { id: "u5", name: "Júlia Santos", email: "julia@obione.dev", profileCode: "CONSULTANT", status: "ACTIVE", domainIds: ["d5"], projectIds: ["p5"], createdAt: "2026-02-01" },
  { id: "u6", name: "Cliente Athos Capital", email: "athos@cliente.com", profileCode: "CLIENT", status: "ACTIVE", domainIds: ["d1"], projectIds: ["p1"], createdAt: "2026-02-10" },
  { id: "u7", name: "Cliente Norvik", email: "norvik@cliente.com", profileCode: "CLIENT", status: "PENDING", domainIds: ["d2"], projectIds: ["p2"], createdAt: "2026-02-12" },
];
