export type MpoGranularity = "GENERAL" | "SPECIFIC" | "INTERMEDIATE";

export interface MpoAttribute {
  id: string;
  name: string;
  category: string;
  granularity: MpoGranularity;
  description: string;
}
