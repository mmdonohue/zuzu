import express from 'express';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Get code review summary
router.get('/summary', (req: Request, res: Response) => {
  try {
    const reviewPath = path.join(process.cwd(), '.claude', 'CODEBASE_REVIEW.json');

    // Check if file exists
    if (!fs.existsSync(reviewPath)) {
      return res.status(404).json({
        error: 'Code review data not found',
        message: 'Run code review to generate data'
      });
    }

    // Read the JSON file
    const reviewData = JSON.parse(fs.readFileSync(reviewPath, 'utf-8'));

    res.json(reviewData);
  } catch (error) {
    console.error('Error reading code review data:', error);
    res.status(500).json({
      error: 'Failed to read code review data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get detailed report for a specific category
router.get('/details/:category', (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const categoryUpper = category.toUpperCase();
    const reportPath = path.join(process.cwd(), '.claude', `CODEBASE_REVIEW_${categoryUpper}.md`);

    // Check if file exists
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({
        error: 'Detailed report not found',
        message: `No detailed report found for category: ${category}`
      });
    }

    // Read the markdown file
    const reportContent = fs.readFileSync(reportPath, 'utf-8');

    res.json({
      category,
      content: reportContent
    });
  } catch (error) {
    console.error('Error reading detailed report:', error);
    res.status(500).json({
      error: 'Failed to read detailed report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
