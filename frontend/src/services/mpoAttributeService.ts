import { request } from "./apiClient";
import type { MpoAttribute, MpoAttributeType, MpoCategory } from "@/types/mpoAttribute";

interface ApiMpoAttribute {
  key: string;
  label: string;
  category: string;
  categoryLabel: string;
  type: MpoAttributeType;
}

interface ApiMpoCategory {
  key: string;
  label: string;
  order: number;
  attributes: ApiMpoAttribute[];
}

const mapAttribute = (a: ApiMpoAttribute): MpoAttribute => ({
  id: a.key,
  name: a.label,
  category: a.category,
  categoryLabel: a.categoryLabel,
  type: a.type,
});

/** The 44 MPO attributes (flat) — GET /api/mpo/attributes. */
export async function getMpoAttributes(): Promise<MpoAttribute[]> {
  const data = await request<ApiMpoAttribute[]>("/mpo/attributes");
  return data.map(mapAttribute);
}

/** The 8 MPO categories with their attributes — GET /api/mpo/categories. */
export async function getMpoCategories(): Promise<MpoCategory[]> {
  const data = await request<ApiMpoCategory[]>("/mpo/categories");
  return data.map((c) => ({
    key: c.key,
    label: c.label,
    order: c.order,
    attributes: c.attributes.map(mapAttribute),
  }));
}
