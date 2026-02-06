import { z } from "zod";

// Base schemas
export const userRoleSchema = z.enum(["EMPLOYER", "TALENT"]);
export const applicationSourceSchema = z.enum(["MANUAL", "INVITATION"]);
export const invitationStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "DECLINED",
]);

// Job creation schema (for employers)
export const createJobSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    companyName: z
      .string()
      .min(1, "Company name is required")
      .max(100, "Company name too long"),
    techStack: z
      .array(z.string().min(1))
      .min(1, "At least one technology is required")
      .max(20, "Too many technologies"),
    deadline: z
      .string()
      .datetime("Invalid deadline format. Use ISO 8601 format."),
  })
  .strict();

// Job application schema (for talents)
export const applyToJobSchema = z
  .object({
    source: applicationSourceSchema,
  })
  .strict();

// Invitation creation schema (for employers)
export const createInvitationSchema = z
  .object({
    talentId: z.string().uuid("Invalid talent ID"),
  })
  .strict();

// Invitation response schema (for talents)
export const respondToInvitationSchema = z
  .object({
    status: z.enum(["ACCEPTED", "DECLINED"]),
  })
  .strict();

// Query parameter schemas
export const jobsQuerySchema = z.object({
  search: z.string().optional(),
});

export const paramsJobIdSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
});

export const paramsInvitationIdSchema = z.object({
  id: z.string().uuid("Invalid invitation ID"),
});

// Validation middleware helper
export const validateBody = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Invalid parameters",
          details: error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Invalid query parameters",
          details: error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
};
