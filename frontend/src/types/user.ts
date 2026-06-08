export type ProfileCode = "ADMIN" | "CONSULTANT" | "CLIENT";
export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING";

export interface User {
  id: string;
  name: string;
  email: string;
  profileCode: ProfileCode;
  status: UserStatus;
  domainIds: string[];
  projectIds: string[];
  createdAt: string;
}
