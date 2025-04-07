// server/routes/openrouter.ts
import express from 'express';
import { Request, Response } from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

// Get conversation history (last 24 hours by default)
router.get('/history', async (req: Request, res: Response) => {
  const { timeframe } = req.query;
  const days = timeframe === 'week' ? 7 : 1; // Default to 1 day if not specified
  
  try {
    const { data, error } = await supabase
      .from('openrouter_events')
      .select('*')
      .eq('active', true)
      .gte('created', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created', { ascending: false });
      
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ error: 'Failed to fetch conversation history' });
  }
});

// Save a new conversation
router.post('/save', async (req: Request, res: Response) => {
  const { model, prompt, response, response_time } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('openrouter_events')
      .insert([
        { model, prompt, response, response_time }
      ])
      .select();
      
    if (error) throw error;
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// Update conversation status (deactivate)
router.patch('/status/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { active } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('openrouter_events')
      .update({ active })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating conversation status:', error);
    res.status(500).json({ error: 'Failed to update conversation status' });
  }
});

export default router;