import { api } from "./client";
import type { Cockpit } from "./types";

export function getCockpit(): Promise<Cockpit> {
  return api<Cockpit>("/portfolio/cockpit");
}
