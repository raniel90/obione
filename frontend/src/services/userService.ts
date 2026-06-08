import type { User, ProfileCode } from "@/types/user";
import { request } from "./apiClient";
import { type ApiUser, mapUser } from "./apiMappers";

export async function getUsers(): Promise<User[]> {
  const data = await request<ApiUser[]>("/users");
  return data.map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const data = await request<ApiUser>(`/users/${id}`);
    return mapUser(data);
  } catch {
    return null;
  }
}

export async function createUser(
  data: Omit<User, "id" | "createdAt"> & { password: string },
): Promise<User> {
  const created = await request<ApiUser>("/users", {
    method: "POST",
    json: {
      name: data.name,
      email: data.email,
      password: data.password,
      profileCode: data.profileCode,
      status: data.status,
      domainIds: data.domainIds ?? [],
      projectIds: data.projectIds ?? [],
    },
  });
  return mapUser(created);
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | null> {
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.email !== undefined) body.email = data.email;
  if (data.profileCode !== undefined) body.profileCode = data.profileCode;
  if (data.status !== undefined) body.status = data.status;
  if (data.domainIds !== undefined) body.domainIds = data.domainIds;
  if (data.projectIds !== undefined) body.projectIds = data.projectIds;

  const updated = await request<ApiUser>(`/users/${id}`, {
    method: "PUT",
    json: body,
  });
  return mapUser(updated);
}

export async function getUsersByProfile(profileCode: ProfileCode): Promise<User[]> {
  const all = await getUsers();
  return all.filter((u) => u.profileCode === profileCode);
}

export async function getUsersByDomain(domainId: string): Promise<User[]> {
  const all = await getUsers();
  return all.filter((u) => u.domainIds.includes(domainId));
}

export async function getUsersByProject(projectId: string): Promise<User[]> {
  const all = await getUsers();
  return all.filter((u) => u.projectIds.includes(projectId));
}
