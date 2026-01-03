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
      // Example file stays in .claude root for backward compatibility
      reviewPath = path.join(
        process.cwd(),
        ".claude",
        "CODEBASE_REVIEW_EXAMPLE.json",
      );
    } else {
      // Actual review results are in .claude/review/results/
      reviewPath = path.join(
        process.cwd(),
        ".claude",
        "review",
        "results",
        "CODEBASE_REVIEW.json",
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

// Get detailed report for a specific category
router.get("/details/:category", (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const categoryUpper = category.toUpperCase();
    const reportPath = path.join(
      process.cwd(),
      ".claude",
      `CODEBASE_REVIEW_${categoryUpper}.md`,
    );

    // Check if file exists
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({
        error: "Detailed report not found",
        message: `No detailed report found for category: ${category}`,
      });
    }

    // Read the markdown file
    const reportContent = fs.readFileSync(reportPath, "utf-8");

    res.json({
      category,
      content: reportContent,
    });
  } catch (error) {
    console.error("Error reading detailed report:", error);
    res.status(500).json({
      error: "Failed to read detailed report",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Trigger code review
router.post("/trigger", async (req: Request, res: Response) => {
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
      "CODEBASE_REVIEW.json",
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
