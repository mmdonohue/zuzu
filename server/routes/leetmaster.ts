// server/routes/leetmaster.ts
import express from "express";
import { Request, Response } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { problemGenerationLimiter } from "../middleware/rateLimiter.middleware.js";
import { validateProblemGeneration } from "../middleware/validation.middleware.js";
import { LeetMasterService } from "../services/leetmaster.service.js";
import logger from "../config/logger.js";

const router = express.Router();

// Focus areas configuration
const FOCUS_AREAS = [
  {
    id: "arrays",
    name: "Arrays",
    icon: "📊",
    description: "Array manipulation and algorithms",
  },
  {
    id: "strings",
    name: "Strings",
    icon: "📝",
    description: "String processing and pattern matching",
  },
  {
    id: "hash-tables",
    name: "Hash Tables",
    icon: "🗂️",
    description: "Hash maps and sets",
  },
  {
    id: "linked-lists",
    name: "Linked Lists",
    icon: "🔗",
    description: "Linked list operations",
  },
  {
    id: "trees",
    name: "Trees",
    icon: "🌳",
    description: "Tree traversal and manipulation",
  },
];

/**
 * GET /api/leetmaster/focus-areas
 * Returns available focus areas (public endpoint)
 */
router.get("/focus-areas", async (req: Request, res: Response) => {
  try {
    res.json(FOCUS_AREAS);
  } catch (error) {
    logger.error("Error fetching focus areas:", error);
    res.status(500).json({ error: "Failed to fetch focus areas" });
  }
});

/**
 * GET /api/leetmaster/problems/generate
 * Generate or retrieve a coding problem
 * Query params: focus_area (required), difficulty (optional, defaults to 'medium')
 */
router.get(
  "/problems/generate",
  authenticateToken,
  problemGenerationLimiter,
  validateProblemGeneration,
  async (req: Request, res: Response) => {
    const { focus_area, difficulty = "medium" } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!focus_area || typeof focus_area !== "string") {
      return res.status(400).json({ error: "focus_area is required" });
    }

    try {
      logger.info(
        `Problem generation request: ${focus_area}, ${difficulty} for user ${userId}`,
      );

      // Generate new problem
      const newProblem = await LeetMasterService.generateProblem(
        focus_area,
        difficulty as string,
        parseInt(userId),
      );

      res.json(newProblem);
    } catch (error) {
      logger.error("Error in problem generation:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to generate problem",
      });
    }
  },
);

/**
 * POST /api/leetmaster/attempts
 * Save user attempt and rating
 * Body: { problem_id, user_solution?, rating }
 */
router.post(
  "/attempts",
  authenticateToken,
  csrfProtection,
  async (req: Request, res: Response) => {
    const { problem_id, user_solution, rating } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!problem_id) {
      return res.status(400).json({ error: "problem_id is required" });
    }

    if (rating === undefined || rating === null) {
      return res.status(400).json({ error: "rating is required" });
    }

    // Validate rating range
    if (rating < -1 || rating > 5) {
      return res.status(400).json({
        error: "rating must be between -1 and 5 (-1 = no rating, 1-5 = stars)",
      });
    }

    try {
      const attempt = await LeetMasterService.saveAttempt(
        parseInt(userId),
        problem_id,
        user_solution || null,
        rating,
      );

      logger.info(
        `Attempt saved: ${attempt.id} for user ${userId}, problem ${problem_id}`,
      );
      res.json(attempt);
    } catch (error) {
      logger.error("Error saving attempt:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to save attempt",
      });
    }
  },
);

/**
 * GET /api/leetmaster/progress
 * Get user progress statistics
 */
router.get(
  "/progress",
  authenticateToken,
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const progress = await LeetMasterService.getUserProgress(
        parseInt(userId),
      );

      res.json(progress);
    } catch (error) {
      logger.error("Error fetching progress:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to fetch progress",
      });
    }
  },
);

/**
 * GET /api/leetmaster/problems/:id
 * Get a specific problem by ID
 */
router.get(
  "/problems/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!id) {
      return res.status(400).json({ error: "Problem ID is required" });
    }

    try {
      const problem = await LeetMasterService.getProblemById(id);

      if (!problem) {
        return res.status(404).json({ error: "Problem not found" });
      }

      res.json(problem);
    } catch (error) {
      logger.error("Error fetching problem:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to fetch problem",
      });
    }
  },
);

/**
 * GET /api/leetmaster/attempts/by-focus-area/:focusArea
 * Get user's attempted problems for a specific focus area
 */
router.get(
  "/attempts/by-focus-area/:focusArea",
  authenticateToken,
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { focusArea } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!focusArea) {
      return res.status(400).json({ error: "focusArea is required" });
    }

    try {
      const attempts = await LeetMasterService.getUserAttemptsByFocusArea(
        parseInt(userId),
        focusArea,
      );

      res.json(attempts);
    } catch (error) {
      logger.error("Error fetching attempts by focus area:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to fetch attempts",
      });
    }
  },
);

export default router;
