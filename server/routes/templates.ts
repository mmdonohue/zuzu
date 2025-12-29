// server/routes/templates.ts
import express from 'express';
import { Request, Response } from 'express';
import { supabase } from '../services/supabase.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  validateTemplateCreate,
  validateTemplateUpdate,
  validateTemplateUsage
} from '../middleware/validation.middleware.js';
import logger from '../config/logger.js';

const router = express.Router();

// Get all templates (user's own + public + system templates)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const { category, tag, search } = req.query;

  try {
    // Build query - RLS will automatically filter for user's own + public + system templates
    let query = supabase
      .from('prompt_templates')
      .select(`
        *,
        style_guides (
          id,
          name,
          description,
          temperature
        )
      `)
      .eq('active', true);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query.order('usage_count', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
});

// Get single template by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select(`
        *,
        style_guides (
          id,
          name,
          description,
          system_prompt,
          temperature
        )
      `)
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template'
    });
  }
});

// Create new template
router.post(
  '/',
  authenticateToken,
  validateTemplateCreate,
  async (req: Request, res: Response) => {
    const {
      name,
      description,
      category,
      content,
      variables,
      style_guide_id,
      is_public,
      tags
    } = req.body;

    try {
      // Log the data being inserted for debugging
      logger.info('Creating template with data:', {
        user_id: req.user?.userId,
        name,
        category,
        style_guide_id,
        is_public,
        tags,
        tags_type: typeof tags,
        tags_array: Array.isArray(tags)
      });

      const { data, error } = await supabase
        .from('prompt_templates')
        .insert([
          {
            user_id: req.user?.userId,
            name,
            description,
            category,
            content,
            variables: variables || [],
            style_guide_id: style_guide_id || null,
            is_public: is_public || false,
            is_system: false, // User-created templates are never system templates
            tags: tags || []
          }
        ])
        .select(`
          *,
          style_guides (
            id,
            name,
            description,
            temperature
          )
        `)
        .single();

      if (error) throw error;

      logger.info(`Template created: ${data.id} by user ${req.user?.userId}`);

      res.status(201).json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template'
      });
    }
  }
);

// Update template
router.put(
  '/:id',
  authenticateToken,
  validateTemplateUpdate,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      content,
      variables,
      style_guide_id,
      is_public,
      tags,
      active
    } = req.body;

    try {
      // Build update object with only provided fields
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (category !== undefined) updates.category = category;
      if (content !== undefined) updates.content = content;
      if (variables !== undefined) updates.variables = variables;
      if (style_guide_id !== undefined) updates.style_guide_id = style_guide_id;
      if (is_public !== undefined) updates.is_public = is_public;
      if (tags !== undefined) updates.tags = tags;
      if (active !== undefined) updates.active = active;

      // RLS will prevent updating if user doesn't own the template
      const { data, error } = await supabase
        .from('prompt_templates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', req.user?.userId) // Ensure user owns the template
        .eq('is_system', false) // Cannot update system templates
        .select(`
          *,
          style_guides (
            id,
            name,
            description,
            temperature
          )
        `)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Template not found or you do not have permission to update it'
        });
      }

      logger.info(`Template updated: ${id} by user ${req.user?.userId}`);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update template'
      });
    }
  }
);

// Delete template (soft delete by setting active = false)
router.delete(
  '/:id',
  authenticateToken,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // RLS will prevent deleting if user doesn't own the template
      const { data, error } = await supabase
        .from('prompt_templates')
        .update({ active: false })
        .eq('id', id)
        .eq('user_id', req.user?.userId) // Ensure user owns the template
        .eq('is_system', false) // Cannot delete system templates
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Template not found or you do not have permission to delete it'
        });
      }

      logger.info(`Template deleted: ${id} by user ${req.user?.userId}`);

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete template'
      });
    }
  }
);

// Track template usage
router.post(
  '/usage',
  authenticateToken,
  validateTemplateUsage,
  async (req: Request, res: Response) => {
    const { template_id, model_used } = req.body;

    try {
      // Insert usage record (trigger will auto-increment usage_count)
      const { data, error } = await supabase
        .from('template_usage')
        .insert([
          {
            template_id,
            user_id: req.user?.userId,
            model_used
          }
        ])
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Error tracking template usage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track template usage'
      });
    }
  }
);

export default router;
