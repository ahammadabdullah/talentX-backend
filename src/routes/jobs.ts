import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  validateQuery,
  validateParams,
  jobsQuerySchema,
  paramsJobIdSchema,
} from "../schemas/validation";
import { isDateExpired, formatDateToISO } from "../utils";
import { JobWithApplications, JobDetails } from "../types";

const router = Router();

// GET /api/jobs - Public endpoint to get all jobs
router.get(
  "/",
  validateQuery(jobsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { search } = req.query;

      const whereClause = search
        ? {
            OR: [
              {
                title: {
                  contains: search as string,
                  mode: "insensitive" as const,
                },
              },
              {
                companyName: {
                  contains: search as string,
                  mode: "insensitive" as const,
                },
              },
              { techStack: { hasSome: [search as string] } },
            ],
          }
        : {};

      const jobs = await prisma.job.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          companyName: true,
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const response: JobWithApplications[] = jobs.map((job) => ({
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        applicationsCount: job._count.applications,
      }));

      res.json(response);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  }
);

// GET /api/jobs/:jobId - Public endpoint to get job details
router.get(
  "/:jobId",
  validateParams(paramsJobIdSchema),
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          title: true,
          companyName: true,
          techStack: true,
          deadline: true,
          description: true,
          _count: {
            select: {
              applications: true,
            },
          },
        },
      });

      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      const response: JobDetails = {
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        techStack: job.techStack,
        deadline: formatDateToISO(job.deadline),
        description: job.description,
        applicationsCount: job._count.applications,
        isExpired: isDateExpired(job.deadline),
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching job details:", error);
      res.status(500).json({ error: "Failed to fetch job details" });
    }
  }
);

export default router;
