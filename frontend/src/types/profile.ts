import type { ProfileCode } from "./user";

export interface Profile {
  id: string;
  code: ProfileCode;
  name: string;
  description: string;
}
