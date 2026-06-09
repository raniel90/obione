export type MpoAttributeType = "estruturado" | "texto_livre" | "fora_de_escopo";

/** One MPO attribute from the Quadro 37 (the observation lens). */
export interface MpoAttribute {
  id: string; // canonical key, e.g. "escopo_executado"
  name: string; // label, e.g. "Escopo executado"
  category: string; // category key, e.g. "escopo"
  categoryLabel: string;
  type: MpoAttributeType;
}

/** One of the 8 MPO categories with its attributes. */
export interface MpoCategory {
  key: string;
  label: string;
  order: number;
  attributes: MpoAttribute[];
}
