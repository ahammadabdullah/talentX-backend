import { Request, Response, NextFunction } from "express";

// Test middleware for API endpoints
export const testMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`Test - ${req.method} ${req.path}`);
  next();
};

// Simple health check for testing
export const healthCheck = (req: Request, res: Response) => {
  res.json({
    message: "TalentX Backend is running!",
    timestamp: new Date().toISOString(),
    endpoints: {
      public: ["GET /api/jobs", "GET /api/jobs/:jobId"],
      employer: [
        "POST /api/employer/jobs",
        "GET /api/employer/jobs/:jobId/applicants",
        "GET /api/employer/jobs/:jobId/matches",
        "POST /api/employer/jobs/:jobId/invite",
      ],
      talent: [
        "POST /api/talent/jobs/:jobId/apply",
        "GET /api/talent/job-feed",
        "GET /api/talent/invitations",
        "POST /api/talent/invitations/:id/respond",
      ],
    },
  });
};
