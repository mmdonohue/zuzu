// server/routes/styleGuides.ts
import express from 'express';
import { Request, Response } from 'express';
import { supabase } from '../services/supabase.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import logger from '../config/logger.js';

const router = express.Router();

// Get all active style guides
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('style_guides')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error fetching style guides:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch style guides'
    });
  }
});

// Get single style guide by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('style_guides')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Style guide not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error fetching style guide:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch style guide'
    });
  }
});

export default router;
