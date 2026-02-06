# TalentX Backend – Instructions

## Purpose
This project is the backend REST API for the TalentX MVP.
It must be a real backend with real persistence, real validation, and real role enforcement.

Frontend depends on these APIs exactly as defined here.
DO NOT change response shapes without updating the frontend.

---

## Tech Stack (Mandatory)
- Node.js + Express.js
- TypeScript
- Prisma ORM
- Supabase PostgreSQL (database only)
- Zod (request validation)
- REST APIs only

---

## Architecture Rules
- No backend-as-a-service logic
- No mock APIs
- No hardcoded counters
- All data must come from the database
- Role-based authorization is enforced on every protected route

---

## Authentication & Authorization
- Authentication is handled by the frontend (NextAuth)
- Backend receives an access token in:
  Authorization: Bearer <token>

Backend responsibilities:
1. Verify token
2. Extract:
   - userId
   - role (EMPLOYER | TALENT)
3. Attach to request:
   ```ts
   req.user = { id: string, role: "EMPLOYER" | "TALENT" }
Reject requests if:

Token is missing or invalid

Role does not match endpoint requirements

Shared Enums (Must Match Frontend)
export type UserRole = "EMPLOYER" | "TALENT";
export type ApplicationSource = "MANUAL" | "INVITATION";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED";
Prisma Data Models (Source of Truth)
User
id: string (uuid)
name: string
email: string (unique)
role: UserRole
createdAt: Date
Job
id: string (uuid)
title: string
companyName: string
techStack: string[]     // text[]
deadline: Date
description: string    // AI-generated
employerId: string
createdAt: Date
Application
id: string (uuid)
jobId: string
talentId: string
source: ApplicationSource
createdAt: Date

UNIQUE(jobId, talentId)
Invitation
id: string (uuid)
jobId: string
talentId: string
employerId: string
status: InvitationStatus
createdAt: Date
API Contracts (DO NOT DEVIATE)
Public
GET /api/jobs
Response:

{
  id: string
  title: string
  companyName: string
  applicationsCount: number
}[]
Supports:

?search=keyword

GET /api/jobs/:jobId
Response:

{
  id: string
  title: string
  companyName: string
  techStack: string[]
  deadline: string
  description: string
  applicationsCount: number
  isExpired: boolean
}
Employer APIs (role = EMPLOYER)
POST /api/employer/jobs
Request:

{
  title: string
  companyName: string
  techStack: string[]
  deadline: string
}
Behavior:

Generate job description using AI

Persist job

Response: Job

GET /api/employer/jobs/:jobId/applicants
Response:

{
  talentId: string
  talentName: string
  source: ApplicationSource
  appliedAt: string
}[]
GET /api/employer/jobs/:jobId/matches
Response:

{
  talentId: string
  name: string
  score: number // 0–100
}[]
POST /api/employer/jobs/:jobId/invite
Request:

{
  talentId: string
}
Response: Invitation

Talent APIs (role = TALENT)
POST /api/talent/jobs/:jobId/apply
Request:

{
  source: ApplicationSource
}
Rules:

Reject if deadline passed

Reject if already applied

Increment application counter immediately

Response: Application

GET /api/talent/job-feed
Response:

{
  jobId: string
  title: string
  companyName: string
  score: number
}[]
GET /api/talent/invitations
Response:

{
  id: string
  jobTitle: string
  companyName: string
  deadline: string
  status: InvitationStatus
}[]
POST /api/talent/invitations/:id/respond
Request:

{
  status: "ACCEPTED" | "DECLINED"
}
If ACCEPTED:

Optionally create Application with source = INVITATION

Validation Rules
All incoming requests must use Zod schemas

Never trust frontend input

Dates must be validated

Seeder Requirements
Create a seed script that inserts:

1 Employer

3 Talents

2 Jobs

1 Application

1 Invitation (PENDING)

Seeder data must be relationally consistent.

Non-Goals
No real-time features

No notifications system

No overengineering

Build fast. Build correctly.