import type { Profile } from "@/types/profile";
import type { ProfileCode } from "@/types/user";
import { request } from "./apiClient";
import { type ApiProfile, mapProfile } from "./apiMappers";

export async function getProfiles(): Promise<Profile[]> {
  const data = await request<ApiProfile[]>("/profiles");
  return data.map(mapProfile);
}

export async function getProfileByCode(code: ProfileCode): Promise<Profile | null> {
  try {
    const data = await request<ApiProfile>(`/profiles/${code}`);
    return mapProfile(data);
  } catch {
    return null;
  }
}
