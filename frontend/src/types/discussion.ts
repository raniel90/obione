export type DiscussionStatusCode =
  | "OPEN"
  | "IN_ANALYSIS"
  | "REVIEWED"
  | "CONSOLIDATED"
  | "ARCHIVED";

export type DiscussionVisibility = "DOMAIN" | "PROJECT" | "CONSULTANTS" | "ADMINS";

export type ContributionType =
  | "EVIDENCE"
  | "INTERPRETATION"
  | "FEEDBACK"
  | "HYPOTHESIS"
  | "VALIDATION"
  | "COUNTERPOINT";

export interface DiscussionContribution {
  id: string;
  discussionId: string;
  userId: string;
  userName?: string;
  type: ContributionType;
  text: string;
  createdAt: string;
}

export interface Discussion {
  id: string;
  domainId: string;
  projectId?: string;
  phenomenonId?: string;
  observationId?: string;
  title: string;
  question: string;
  status: DiscussionStatusCode;
  visibility: DiscussionVisibility;
  contributions: DiscussionContribution[];
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}
