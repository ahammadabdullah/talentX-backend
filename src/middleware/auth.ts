import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedUser, UserRole } from "../types";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface JWTPayload {
  sub: string;
  role: UserRole;
  exp?: number;
  iat?: number;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization token required" });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({ error: "Authorization token required" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET not configured");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    if (!decoded.sub || !decoded.role) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    // Validate role
    if (!["EMPLOYER", "TALENT"].includes(decoded.role)) {
      res.status(401).json({ error: "Invalid user role" });
      return;
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
    } else {
      console.error("Authentication error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Insufficient permissions",
        required: allowedRoles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};

export const requireEmployer = requireRole(["EMPLOYER"]);
export const requireTalent = requireRole(["TALENT"]);
