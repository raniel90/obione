import type { MpoAttribute, MpoGranularity } from "@/types/mpoAttribute";
import { mockMpoAttributes } from "@/data/mockMpoAttributes";
import { delay } from "./apiClient";

// Future: GET /api/mpo-attributes
export async function getMpoAttributes(): Promise<MpoAttribute[]> {
  return delay([...mockMpoAttributes]);
}

export async function getMpoAttributesByGranularity(
  granularity: MpoGranularity,
): Promise<MpoAttribute[]> {
  return delay(mockMpoAttributes.filter((m) => m.granularity === granularity));
}

export async function getMpoAttributesByCategory(category: string): Promise<MpoAttribute[]> {
  return delay(mockMpoAttributes.filter((m) => m.category === category));
}

export async function getMpoAttributeById(id: string): Promise<MpoAttribute | null> {
  return delay(mockMpoAttributes.find((m) => m.id === id) ?? null);
}
