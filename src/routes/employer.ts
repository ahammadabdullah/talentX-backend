import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireEmployer } from "../middleware/auth";
import {
  validateBody,
  validateParams,
  createJobSchema,
  createInvitationSchema,
  paramsJobIdSchema,
} from "../schemas/validation";
import { generateJobDescription } from "../services/aiService";
import { parseISODate, formatDateToISO } from "../utils";
import { JobApplicant, TalentMatch } from "../types";

const router = Router();

// Apply authentication and role check to all employer routes
router.use(authenticate);
router.use(requireEmployer);

// POST /api/employer/jobs - Create a new job
router.post(
  "/jobs",
  validateBody(createJobSchema),
  async (req: Request, res: Response) => {
    try {
      const { title, companyName, techStack, deadline } = req.body;
      const employerId = req.user!.id;

      // Validate deadline is in the future
      const deadlineDate = parseISODate(deadline);
      if (deadlineDate <= new Date()) {
        res.status(400).json({ error: "Deadline must be in the future" });
        return;
      }

      // Generate job description using AI
      const description = await generateJobDescription({
        title,
        companyName,
        techStack,
      });

      // Create the job
      const job = await prisma.job.create({
        data: {
          title,
          companyName,
          techStack,
          deadline: deadlineDate,
          description,
          employerId,
        },
      });

      // Return the created job with formatted deadline
      const response = {
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        techStack: job.techStack,
        deadline: formatDateToISO(job.deadline),
        description: job.description,
        employerId: job.employerId,
        createdAt: formatDateToISO(job.createdAt),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ error: "Failed to create job" });
    }
  }
);

// GET /api/employer/jobs/:jobId/applicants - Get job applicants
router.get(
  "/jobs/:jobId/applicants",
  validateParams(paramsJobIdSchema),
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const employerId = req.user!.id;

      // First verify the job belongs to this employer
      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          employerId: employerId,
        },
      });

      if (!job) {
        res.status(404).json({ error: "Job not found or access denied" });
        return;
      }

      // Get all applicants for this job
      const applications = await prisma.application.findMany({
        where: {
          jobId: jobId,
        },
        include: {
          talent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const response: JobApplicant[] = applications.map((app) => ({
        talentId: app.talent.id,
        talentName: app.talent.name,
        source: app.source,
        appliedAt: formatDateToISO(app.createdAt),
      }));

      res.json(response);
    } catch (error) {
      console.error("Error fetching job applicants:", error);
      res.status(500).json({ error: "Failed to fetch job applicants" });
    }
  }
);

// GET /api/employer/jobs/:jobId/matches - Get talent matches
router.get(
  "/jobs/:jobId/matches",
  validateParams(paramsJobIdSchema),
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const employerId = req.user!.id;

      // First verify the job belongs to this employer
      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          employerId: employerId,
        },
        include: {
          applications: {
            select: {
              talentId: true,
            },
          },
        },
      });

      if (!job) {
        res.status(404).json({ error: "Job not found or access denied" });
        return;
      }

      // Get talents who haven't applied yet
      const appliedTalentIds = job.applications.map((app) => app.talentId);

      const talents = await prisma.user.findMany({
        where: {
          role: "TALENT",
          id: {
            notIn: appliedTalentIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      // For now, generate mock scores based on talent ID hash
      // In a real system, this would use ML/AI to calculate actual match scores
      const response: TalentMatch[] = talents
        .map((talent) => {
          // Simple hash-based score generation for demo purposes
          const hash = talent.id
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const score = 40 + (hash % 61); // Score between 40-100

          return {
            talentId: talent.id,
            name: talent.name,
            score: score,
          };
        })
        .sort((a, b) => b.score - a.score); // Sort by score descending

      res.json(response);
    } catch (error) {
      console.error("Error fetching talent matches:", error);
      res.status(500).json({ error: "Failed to fetch talent matches" });
    }
  }
);

// POST /api/employer/jobs/:jobId/invite - Invite talent to job
router.post(
  "/jobs/:jobId/invite",
  validateParams(paramsJobIdSchema),
  validateBody(createInvitationSchema),
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { talentId } = req.body;
      const employerId = req.user!.id;

      // Verify the job belongs to this employer
      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          employerId: employerId,
        },
      });

      if (!job) {
        res.status(404).json({ error: "Job not found or access denied" });
        return;
      }

      // Verify the talent exists
      const talent = await prisma.user.findFirst({
        where: {
          id: talentId,
          role: "TALENT",
        },
      });

      if (!talent) {
        res.status(404).json({ error: "Talent not found" });
        return;
      }

      // Check if talent has already applied
      const existingApplication = await prisma.application.findUnique({
        where: {
          jobId_talentId: {
            jobId,
            talentId,
          },
        },
      });

      if (existingApplication) {
        res
          .status(400)
          .json({ error: "Talent has already applied to this job" });
        return;
      }

      // Check if invitation already exists
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          jobId,
          talentId,
          employerId,
        },
      });

      if (existingInvitation) {
        res
          .status(400)
          .json({ error: "Invitation already sent to this talent" });
        return;
      }

      // Create the invitation
      const invitation = await prisma.invitation.create({
        data: {
          jobId,
          talentId,
          employerId,
        },
      });

      const response = {
        id: invitation.id,
        jobId: invitation.jobId,
        talentId: invitation.talentId,
        employerId: invitation.employerId,
        status: invitation.status,
        createdAt: formatDateToISO(invitation.createdAt),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ error: "Failed to create invitation" });
    }
  }
);

export default router;
