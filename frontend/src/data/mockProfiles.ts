import type { Profile } from "@/types/profile";

export const mockProfiles: Profile[] = [
  { id: "pr-admin", code: "ADMIN", name: "Administrador", description: "Configura governança, perfis, permissões e domínios do observatório." },
  { id: "pr-consultant", code: "CONSULTANT", name: "Consultor", description: "Conduz projetos, registra observações e participa de discussões observacionais." },
  { id: "pr-client", code: "CLIENT", name: "Cliente", description: "Acompanha projetos contratados, valida entregas e contribui com feedbacks." },
];
