import type { Permission, ProfilePermission } from "@/types/permission";
import type { ProfileCode } from "@/types/user";

type Matrix = Record<ProfileCode, boolean>;

interface Seed {
  code: string;
  name: string;
  category: string;
  matrix: Matrix;
}

const seeds: Seed[] = [
  // Observatório
  {
    code: "dashboard",
    name: "Visualizar dashboard global",
    category: "Observatório",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: false },
  },
  // Domínios
  {
    code: "view-domains",
    name: "Visualizar domínios",
    category: "Domínios",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: false },
  },
  {
    code: "create-domain",
    name: "Criar domínio",
    category: "Domínios",
    matrix: { ADMIN: true, CONSULTANT: false, CLIENT: false },
  },
  // Projetos
  {
    code: "create-project",
    name: "Criar projeto",
    category: "Projetos",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: false },
  },
  {
    code: "edit-project",
    name: "Editar projeto",
    category: "Projetos",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: false },
  },
  {
    code: "view-projects",
    name: "Visualizar projetos vinculados",
    category: "Projetos",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: true },
  },
  {
    code: "upload",
    name: "Fazer upload de artefatos",
    category: "Projetos",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: false },
  },
  {
    code: "insights",
    name: "Visualizar insights",
    category: "Projetos",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: true },
  },
  {
    code: "attribute-map",
    name: "Visualizar mapa de atributos",
    category: "Projetos",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: false },
  },
  {
    code: "configure",
    name: "Configurar perfis e acessos",
    category: "Governança",
    matrix: { ADMIN: true, CONSULTANT: false, CLIENT: false },
  },
  // Comunidade
  {
    code: "community-participate",
    name: "Participar da comunidade",
    category: "Comunidade",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: true },
  },
  {
    code: "community-view-domain",
    name: "Visualizar discussões do domínio",
    category: "Comunidade",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: false },
  },
  {
    code: "community-view-project",
    name: "Visualizar apenas discussões dos projetos vinculados",
    category: "Comunidade",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: true },
  },
  {
    code: "community-create-discussion",
    name: "Criar discussão observacional",
    category: "Comunidade",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: false },
  },
  {
    code: "community-comment",
    name: "Comentar em discussão",
    category: "Comunidade",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: true },
  },
  {
    code: "community-change-status",
    name: "Alterar status da discussão",
    category: "Comunidade",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: false },
  },
  {
    code: "community-archive-discussion",
    name: "Arquivar discussão",
    category: "Comunidade",
    matrix: { ADMIN: true, CONSULTANT: false, CLIENT: false },
  },
  {
    code: "community-propose-knowledge",
    name: "Propor conhecimento",
    category: "Conhecimento",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: false },
  },
  {
    code: "community-consolidate-knowledge",
    name: "Consolidar conhecimento",
    category: "Conhecimento",
    matrix: { ADMIN: true, CONSULTANT: false, CLIENT: false },
  },
  {
    code: "community-validate-knowledge",
    name: "Validar conhecimento consolidado",
    category: "Conhecimento",
    matrix: { ADMIN: true, CONSULTANT: false, CLIENT: false },
  },
  {
    code: "community-view-knowledge",
    name: "Visualizar conhecimentos consolidados",
    category: "Conhecimento",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: true },
  },
  {
    code: "community-propose-insight",
    name: "Propor insight colaborativo",
    category: "Comunidade",
    matrix: { ADMIN: true, CONSULTANT: true, CLIENT: false },
  },
  {
    code: "community-validate-insight",
    name: "Validar insight colaborativo",
    category: "Comunidade",
    matrix: { ADMIN: true, CONSULTANT: false, CLIENT: false },
  },
  {
    code: "community-moderate",
    name: "Moderar comunidade",
    category: "Comunidade",
    matrix: { ADMIN: true, CONSULTANT: false, CLIENT: false },
  },
  {
    code: "community-configure-participants",
    name: "Configurar participantes da comunidade",
    category: "Governança",
    matrix: { ADMIN: true, CONSULTANT: false, CLIENT: false },
  },
];

export const mockPermissions: Permission[] = seeds.map((s) => ({
  id: `perm-${s.code}`,
  code: s.code,
  name: s.name,
  description: s.name,
  category: s.category,
}));

export const mockProfilePermissions: ProfilePermission[] = seeds.flatMap((s) =>
  (Object.keys(s.matrix) as ProfileCode[]).map((profileCode) => ({
    profileCode,
    permissionCode: s.code,
    enabled: s.matrix[profileCode],
  })),
);
