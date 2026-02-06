export type UserRole = "EMPLOYER" | "TALENT";
export type ApplicationSource = "MANUAL" | "INVITATION";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export interface JobWithApplications {
  id: string;
  title: string;
  companyName: string;
  applicationsCount: number;
}

export interface JobDetails extends JobWithApplications {
  techStack: string[];
  deadline: string;
  description: string;
  isExpired: boolean;
}

export interface JobApplicant {
  talentId: string;
  talentName: string;
  source: ApplicationSource;
  appliedAt: string;
}

export interface TalentMatch {
  talentId: string;
  name: string;
  score: number;
}

export interface JobFeedItem {
  jobId: string;
  title: string;
  companyName: string;
  score: number;
}

export interface TalentInvitation {
  id: string;
  jobTitle: string;
  companyName: string;
  deadline: string;
  status: InvitationStatus;
}
