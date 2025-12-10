// server/routes/openrouter.ts
import express from 'express';
import { Request, Response } from 'express';
import { supabase } from '../services/supabase.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get conversation history (last 24 hours by default)
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  const { timeframe } = req.query;
  const days = timeframe === 'week' ? 7 : 1; // Default to 1 day if not specified

  try {
    // Build query with user name join
    let query = supabase
      .from('openrouter_events')
      .select(`
        *,
        users!openrouter_events_user_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('active', true)
      .gte('created', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    // Filter by user_id unless user is ADMIN or SUPER_ADMIN
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      query = query.eq('user_id', req.user?.userId);
    }

    const { data, error } = await query.order('created', { ascending: false });

    if (error) throw error;

    // Flatten the user data into the response
    const formattedData = data?.map(event => ({
      ...event,
      first_name: event.users?.first_name,
      last_name: event.users?.last_name,
      users: undefined // Remove nested users object
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ error: 'Failed to fetch conversation history' });
  }
});

// Save a new conversation
router.post('/save', authenticateToken, async (req: Request, res: Response) => {
  const { model, prompt, response, response_time, user_id } = req.body;

  try {
    // Use user_id from request body if provided, otherwise use authenticated user's ID
    const finalUserId = user_id || req.user?.userId;

    const { data, error } = await supabase
      .from('openrouter_events')
      .insert([
        {
          model,
          prompt,
          response,
          response_time,
          user_id: finalUserId
        }
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