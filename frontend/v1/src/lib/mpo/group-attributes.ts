import { CATEGORIES } from "./catalog";
import type { AttributeDef } from "./catalog";
import type { ExtractionContent } from "@/lib/api/types";

export interface GroupedAttribute extends AttributeDef {
  value: unknown;
}

export interface GroupedCategory {
  key: string;
  label: string;
  attributes: GroupedAttribute[];
}

/**
 * Groups a flat extraction `content` dict into the 8 MPO categories.
 * Presence of a key encodes CBAC: consultants/admins get all 44 keys;
 * clients get only the keys the CBAC released. A category with no present
 * keys is dropped entirely (so the client never learns something was hidden).
 * `_meta` is never a catalog key, so it is naturally skipped.
 */
export function groupAttributes(content: ExtractionContent): GroupedCategory[] {
  const result: GroupedCategory[] = [];
  for (const cat of CATEGORIES) {
    const attributes: GroupedAttribute[] = [];
    for (const def of cat.attributes) {
      if (Object.prototype.hasOwnProperty.call(content, def.key)) {
        attributes.push({ ...def, value: content[def.key] });
      }
    }
    if (attributes.length > 0) {
      result.push({ key: cat.key, label: cat.label, attributes });
    }
  }
  return result;
}
