import type { Permission, PermissionCode, ProfilePermission } from "@/types/permission";
import type { ProfileCode } from "@/types/user";
import { request } from "./apiClient";
import {
  type ApiPermission,
  type ApiProfilePermission,
  mapPermission,
  mapProfilePermission,
} from "./apiMappers";

export async function getPermissions(): Promise<Permission[]> {
  const data = await request<ApiPermission[]>("/permissions");
  return data.map(mapPermission);
}

export async function getProfilePermissions(): Promise<ProfilePermission[]> {
  const data = await request<ApiProfilePermission[]>("/profile-permissions");
  return data.map(mapProfilePermission);
}

export async function updateProfilePermission(
  profileCode: ProfileCode,
  permissionCode: PermissionCode,
  enabled: boolean,
): Promise<ProfilePermission> {
  const updated = await request<ApiProfilePermission>("/profile-permissions", {
    method: "PUT",
    json: { profileCode, permissionCode, enabled },
  });
  return mapProfilePermission(updated);
}
