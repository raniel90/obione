export type AttributePhase = "INITIAL" | "TRACKING" | "CLOSURE";
export type AttributeStatus = "NOT_OBSERVED" | "PARTIAL" | "FILLED" | "NOT_APPLICABLE";

export interface MpoAttribute {
  id: number;
  code: string;
  name: string;
  description: string;
  phase: AttributePhase;
  categoryCode: string;
  categoryName: string;
}

export interface MpoCategory {
  id: number;
  code: string;
  name: string;
  orderIndex: number;
  attributes: MpoAttribute[];
}

export interface ProjectAttributeValue {
  id: number | null;
  attributeCode: string;
  attributeName: string;
  attributeDescription: string;
  phase: AttributePhase;
  categoryCode: string;
  categoryName: string;
  currentValue: string | null;
  status: AttributeStatus;
  lastObservationId: number | null;
  updatedBy: string | null;
  updatedAt: string | null;
}
