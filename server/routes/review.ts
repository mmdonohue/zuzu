import express from "express";
import { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const router = express.Router();
const execPromise = promisify(exec);

// Get code review summary
router.get("/summary", (req: Request, res: Response) => {
  try {
    // Check if example mode is requested
    const useExample = req.query.example === "true";

    let reviewPath: string;
    if (useExample) {
      reviewPath = path.join(
        process.cwd(),
        ".claude",
        "review",
        "results",
        "codebase_review_example.json",
      );
    } else {
      // Actual review results are in .claude/review/results/
      reviewPath = path.join(
        process.cwd(),
        ".claude",
        "review",
        "results",
        "codebase_review.json",
      );
    }

    // Check if file exists
    if (!fs.existsSync(reviewPath)) {
      return res.status(404).json({
        error: "Code review data not found",
        message: useExample
          ? "Example review data not found"
          : "Run code review to generate data",
      });
    }

    // Read the JSON file
    const reviewData = JSON.parse(fs.readFileSync(reviewPath, "utf-8"));

    res.json(reviewData);
  } catch (error) {
    console.error("Error reading code review data:", error);
    res.status(500).json({
      error: "Failed to read code review data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get detailed findings for a specific category
router.get("/details/:category", (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const categoryLower = category.toLowerCase();

    // Read from main JSON file
    const jsonPath = path.join(
      process.cwd(),
      ".claude",
      "review",
      "results",
      "codebase_review.json",
    );

    // Check if file exists
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({
        error: "Code review data not found",
        message: "Run code review to generate data",
      });
    }

    // Read the JSON file
    const reviewData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    // Find the category in reviews array
    const categoryData = reviewData.reviews?.find(
      (r: { category: string }) => r.category === categoryLower,
    );

    if (!categoryData) {
      return res.status(404).json({
        error: "Category not found",
        message: `No data found for category: ${category}`,
      });
    }

    res.json({
      category: categoryLower,
      displayName: categoryData.displayName,
      findings: categoryData.findings || [],
      metrics: categoryData.metrics,
      status: categoryData.status,
      healthScore: categoryData.healthScore,
      lastUpdated: categoryData.lastUpdated,
    });
  } catch (error) {
    console.error("Error reading category details:", error);
    res.status(500).json({
      error: "Failed to read category details",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Trigger code review
router.post("/trigger", async (_req: Request, res: Response) => {
  try {
    const projectRoot = process.cwd();
    const scriptPath = path.join(
      projectRoot,
      ".claude",
      "hooks",
      "scripts",
      "review-agent.py",
    );

    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({
        error: "Review script not found",
        message: "The review-agent.py script could not be found",
      });
    }

    // Execute the review script
    const { stdout, stderr } = await execPromise(`python3 "${scriptPath}"`, {
      cwd: projectRoot,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large outputs
    });

    // Check if the review data was generated
    const reviewPath = path.join(
      projectRoot,
      ".claude",
      "review",
      "results",
      "codebase_review.json",
    );
    const reviewExists = fs.existsSync(reviewPath);

    res.json({
      success: true,
      message: "Code review completed successfully",
      reviewGenerated: reviewExists,
      output: stdout,
      errors: stderr || undefined,
    });
  } catch (error) {
    console.error("Error triggering code review:", error);

    // Extract error details
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorOutput = (error as any).stderr || "";

    res.status(500).json({
      error: "Failed to run code review",
      message: errorMessage,
      details: errorOutput || undefined,
    });
  }
});

export default router;
