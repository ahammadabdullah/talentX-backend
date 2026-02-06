import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireTalent } from "../middleware/auth";
import {
  validateBody,
  validateParams,
  applyToJobSchema,
  respondToInvitationSchema,
  paramsJobIdSchema,
  paramsInvitationIdSchema,
} from "../schemas/validation";
import { isDateExpired, formatDateToISO } from "../utils";
import { JobFeedItem, TalentInvitation } from "../types";

const router = Router();

// Apply authentication and role check to all talent routes
router.use(authenticate);
router.use(requireTalent);

// POST /api/talent/jobs/:jobId/apply - Apply to a job
router.post(
  "/jobs/:jobId/apply",
  validateParams(paramsJobIdSchema),
  validateBody(applyToJobSchema),
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { source } = req.body;
      const talentId = req.user!.id;

      // Check if job exists
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          deadline: true,
          title: true,
        },
      });

      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      // Check if deadline has passed
      if (isDateExpired(job.deadline)) {
        res.status(400).json({ error: "Job application deadline has passed" });
        return;
      }

      // Check if already applied
      const existingApplication = await prisma.application.findUnique({
        where: {
          jobId_talentId: {
            jobId,
            talentId,
          },
        },
      });

      if (existingApplication) {
        res.status(400).json({ error: "You have already applied to this job" });
        return;
      }

      // Create the application
      const application = await prisma.application.create({
        data: {
          jobId,
          talentId,
          source,
        },
      });

      const response = {
        id: application.id,
        jobId: application.jobId,
        talentId: application.talentId,
        source: application.source,
        createdAt: formatDateToISO(application.createdAt),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Error applying to job:", error);
      res.status(500).json({ error: "Failed to apply to job" });
    }
  }
);

// GET /api/talent/job-feed - Get personalized job feed
router.get("/job-feed", async (req: Request, res: Response) => {
  try {
    const talentId = req.user!.id;

    // Get jobs the talent hasn't applied to yet and that aren't expired
    const jobs = await prisma.job.findMany({
      where: {
        deadline: {
          gt: new Date(), // Only non-expired jobs
        },
        applications: {
          none: {
            talentId: talentId,
          },
        },
      },
      select: {
        id: true,
        title: true,
        companyName: true,
        techStack: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate personalized scores for each job
    // In a real system, this would use ML/AI to calculate actual personalized scores
    const response: JobFeedItem[] = jobs
      .map((job) => {
        // Simple scoring based on job ID hash for demo purposes
        const hash = job.id
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const score = 60 + (hash % 41); // Score between 60-100

        return {
          jobId: job.id,
          title: job.title,
          companyName: job.companyName,
          score: score,
        };
      })
      .sort((a, b) => b.score - a.score); // Sort by score descending

    res.json(response);
  } catch (error) {
    console.error("Error fetching job feed:", error);
    res.status(500).json({ error: "Failed to fetch job feed" });
  }
});

// GET /api/talent/invitations - Get talent's invitations
router.get("/invitations", async (req: Request, res: Response) => {
  try {
    const talentId = req.user!.id;

    const invitations = await prisma.invitation.findMany({
      where: {
        talentId: talentId,
      },
      include: {
        job: {
          select: {
            title: true,
            companyName: true,
            deadline: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response: TalentInvitation[] = invitations.map((invitation) => ({
      id: invitation.id,
      jobTitle: invitation.job.title,
      companyName: invitation.job.companyName,
      deadline: formatDateToISO(invitation.job.deadline),
      status: invitation.status,
    }));

    res.json(response);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

// POST /api/talent/invitations/:id/respond - Respond to invitation
router.post(
  "/invitations/:id/respond",
  validateParams(paramsInvitationIdSchema),
  validateBody(respondToInvitationSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const talentId = req.user!.id;

      // Find the invitation
      const invitation = await prisma.invitation.findFirst({
        where: {
          id: id,
          talentId: talentId,
        },
        include: {
          job: {
            select: {
              deadline: true,
            },
          },
        },
      });

      if (!invitation) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }

      // Check if invitation is already responded to
      if (invitation.status !== "PENDING") {
        res
          .status(400)
          .json({ error: "Invitation has already been responded to" });
        return;
      }

      // Check if job deadline has passed
      if (isDateExpired(invitation.job.deadline)) {
        res.status(400).json({ error: "Job deadline has passed" });
        return;
      }

      // Update invitation status
      const updatedInvitation = await prisma.invitation.update({
        where: { id: id },
        data: { status: status },
      });

      // If accepted, optionally create an application
      if (status === "ACCEPTED") {
        // Check if talent has already applied manually
        const existingApplication = await prisma.application.findUnique({
          where: {
            jobId_talentId: {
              jobId: invitation.jobId,
              talentId: talentId,
            },
          },
        });

        // Only create application if one doesn't exist
        if (!existingApplication) {
          await prisma.application.create({
            data: {
              jobId: invitation.jobId,
              talentId: talentId,
              source: "INVITATION",
            },
          });
        }
      }

      const response = {
        id: updatedInvitation.id,
        jobId: updatedInvitation.jobId,
        talentId: updatedInvitation.talentId,
        employerId: updatedInvitation.employerId,
        status: updatedInvitation.status,
        createdAt: formatDateToISO(updatedInvitation.createdAt),
      };

      res.json(response);
    } catch (error) {
      console.error("Error responding to invitation:", error);
      res.status(500).json({ error: "Failed to respond to invitation" });
    }
  }
);

export default router;
