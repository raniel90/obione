import { request } from "./apiClient";
import type {
  AttributePhase,
  AttributeStatus,
  ManageAttributesResult,
  MpoAttribute,
  MpoCategory,
  ProjectAttributeValue,
} from "@/types/mpoAttribute";

export async function getMpoCategories(): Promise<MpoCategory[]> {
  return request<MpoCategory[]>("/mpo/categories");
}

export async function getMpoAttributes(phase?: AttributePhase): Promise<MpoAttribute[]> {
  const params = phase ? `?phase=${phase}` : "";
  return request<MpoAttribute[]>(`/mpo/attributes${params}`);
}

export async function getProjectAttributeMap(
  projectId: string | number,
): Promise<ProjectAttributeValue[]> {
  return request<ProjectAttributeValue[]>(`/projects/${projectId}/attributes`);
}

export async function manageProjectAttributes(
  projectId: string | number,
  add: string[],
  remove: string[],
  force = false,
): Promise<ManageAttributesResult> {
  return request<ManageAttributesResult>(`/projects/${projectId}/attributes/manage`, {
    method: "POST",
    json: { add, remove, force },
  });
}

export async function setProjectAttributeValue(
  projectId: string | number,
  attributeCode: string,
  value: string | null,
  status: AttributeStatus,
  updatedBy?: string,
): Promise<ProjectAttributeValue> {
  return request<ProjectAttributeValue>(`/projects/${projectId}/attributes/${attributeCode}`, {
    method: "PUT",
    json: { value, status, updatedBy },
  });
}
