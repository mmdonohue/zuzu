import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

// Hello endpoint
// add error handling
router.get('/hello', (req: Request, res: Response) => {
  try {
    res.json({ message: 'ZuZu is online' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  } 
});

export default router;