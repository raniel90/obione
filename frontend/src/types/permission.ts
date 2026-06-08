import type { ProfileCode } from "./user";

// Permission codes are free-form strings to allow the UI to define rich,
// product-specific permissions without churning a TypeScript union.
export type PermissionCode = string;

export interface Permission {
  id: string;
  code: PermissionCode;
  name: string;
  description: string;
  category: string;
}

export interface ProfilePermission {
  profileCode: ProfileCode;
  permissionCode: PermissionCode;
  enabled: boolean;
}
