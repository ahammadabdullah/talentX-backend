# TalentX Backend

A production-ready REST API backend for the TalentX MVP, built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Features

- ✅ **Real Backend**: Full persistence, validation, and role-based authorization
- ✅ **TypeScript**: Full type safety throughout the application
- ✅ **Prisma ORM**: Type-safe database queries with PostgreSQL
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Role-based Authorization**: Separate endpoints for employers and talents
- ✅ **Request Validation**: Comprehensive Zod schema validation
- ✅ **AI Integration**: Automatic job description generation
- ✅ **Production Ready**: Error handling, logging, and security middleware

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT
- **AI**: OpenAI API (optional)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- OpenAI API key (optional, for AI job descriptions)

### Installation

1. **Clone and install dependencies:**
   \`\`\`bash
   cd backend
   npm install
   \`\`\`

2. **Setup environment variables:**
   \`\`\`bash
   cp .env.example .env
   \`\`\`

   Edit \`.env\` with your configuration:
   \`\`\`env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL="postgresql://username:password@hostname:port/database"
   JWT_SECRET=your-jwt-secret-here
   OPENAI_API_KEY=your-openai-api-key-here # Optional
   \`\`\`

3. **Setup database:**
   \`\`\`bash

   # Generate Prisma client

   npm run db:generate

   # Run migrations

   npm run db:migrate

   # Seed database with sample data

   npm run db:seed
   \`\`\`

4. **Start development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

   Server will run at \`http://localhost:3000\`

## API Documentation

### Authentication

All protected endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

The JWT token must contain:

- \`sub\`: User ID
- \`role\`: "EMPLOYER" or "TALENT"

### Public Endpoints

#### Get All Jobs

\`\`\`
GET /api/jobs?search=keyword
\`\`\`

#### Get Job Details

\`\`\`
GET /api/jobs/:jobId
\`\`\`

### Employer Endpoints (requires EMPLOYER role)

#### Create Job

\`\`\`
POST /api/employer/jobs
Content-Type: application/json

{
"title": "Senior Developer",
"companyName": "TechCorp",
"techStack": ["React", "Node.js"],
"deadline": "2026-03-15T10:00:00.000Z"
}
\`\`\`

#### Get Job Applicants

\`\`\`
GET /api/employer/jobs/:jobId/applicants
\`\`\`

#### Get Talent Matches

\`\`\`
GET /api/employer/jobs/:jobId/matches
\`\`\`

#### Invite Talent

\`\`\`
POST /api/employer/jobs/:jobId/invite
Content-Type: application/json

{
"talentId": "uuid-of-talent"
}
\`\`\`

### Talent Endpoints (requires TALENT role)

#### Apply to Job

\`\`\`
POST /api/talent/jobs/:jobId/apply
Content-Type: application/json

{
"source": "MANUAL"
}
\`\`\`

#### Get Job Feed

\`\`\`
GET /api/talent/job-feed
\`\`\`

#### Get Invitations

\`\`\`
GET /api/talent/invitations
\`\`\`

#### Respond to Invitation

\`\`\`
POST /api/talent/invitations/:id/respond
Content-Type: application/json

{
"status": "ACCEPTED"
}
\`\`\`

## Database Schema

### Users

- \`id\`: UUID primary key
- \`name\`: User's full name
- \`email\`: Unique email address
- \`role\`: "EMPLOYER" | "TALENT"

### Jobs

- \`id\`: UUID primary key
- \`title\`: Job title
- \`companyName\`: Company name
- \`techStack\`: Array of technologies
- \`deadline\`: Application deadline
- \`description\`: AI-generated job description
- \`employerId\`: Foreign key to User

### Applications

- \`id\`: UUID primary key
- \`jobId\`: Foreign key to Job
- \`talentId\`: Foreign key to User
- \`source\`: "MANUAL" | "INVITATION"
- Unique constraint: (jobId, talentId)

### Invitations

- \`id\`: UUID primary key
- \`jobId\`: Foreign key to Job
- \`talentId\`: Foreign key to User
- \`employerId\`: Foreign key to User
- \`status\`: "PENDING" | "ACCEPTED" | "DECLINED"

## Development

### Available Scripts

- \`npm run dev\`: Start development server with hot reload
- \`npm run build\`: Build for production
- \`npm start\`: Start production server
- \`npm run db:generate\`: Generate Prisma client
- \`npm run db:migrate\`: Run database migrations
- \`npm run db:seed\`: Seed database with sample data
- \`npm run db:studio\`: Open Prisma Studio
- \`npm run type-check\`: Run TypeScript type checking

### Development Workflow

1. Make changes to code
2. Server auto-restarts (ts-node-dev)
3. Run migrations if schema changes: \`npm run db:migrate\`
4. Type check: \`npm run type-check\`

## Production Deployment

1. **Build the application:**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Set production environment variables**

3. **Run database migrations:**
   \`\`\`bash
   npm run db:migrate
   \`\`\`

4. **Start the server:**
   \`\`\`bash
   npm start
   \`\`\`

## Health Check

Check if the API is running:
\`\`\`
GET /health
\`\`\`

Response:
\`\`\`json
{
"status": "OK",
"timestamp": "2026-02-05T10:30:00.000Z",
"environment": "development"
}
\`\`\`

## Error Handling

All endpoints return consistent error responses:
\`\`\`json
{
"error": "Error message description",
"details": [/* optional validation details */]
}
\`\`\`

HTTP Status Codes:

- \`200\`: Success
- \`201\`: Created
- \`400\`: Bad Request (validation errors)
- \`401\`: Unauthorized (authentication required)
- \`403\`: Forbidden (insufficient permissions)
- \`404\`: Not Found
- \`500\`: Internal Server Error

## License

MIT
