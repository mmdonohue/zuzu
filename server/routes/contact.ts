import { Router, Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/email.service.js';
import { supabase } from '../services/supabase.js';
import { logger } from '../config/logger.js';

const router = Router();

// POST /api/contact/:slug
router.post('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { email, interest, notes } = req.body as { email?: string; interest?: string; notes?: string };

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ message: 'A valid email address is required.' });
      return;
    }

    // Look up site by slug
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, owner_id, config, active')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();

    if (siteError || !site) {
      res.status(404).json({ message: 'Site not found.' });
      return;
    }

    const sanitizedInterest = typeof interest === 'string' ? interest.slice(0, 200) : 'Not specified';
    const sanitizedNotes = typeof notes === 'string' ? notes.slice(0, 1000) : '';

    logger.info(`Contact request for site '${slug}' from ${email}, interest: ${sanitizedInterest}`);

    // Write to site_contacts
    await supabase
      .from('site_contacts')
      .insert({
        site_id: site.id,
        email,
        interest: sanitizedInterest,
        notes: sanitizedNotes || null,
      });

    // Resolve owner email via owner_id FK, fall back to config.owner_email, then hardcoded default
    let ownerEmail = 'donohue.matt@gmail.com';
    if (site.owner_id) {
      const { data: owner } = await supabase
        .from('users')
        .select('email')
        .eq('id', site.owner_id)
        .maybeSingle();
      if (owner?.email) ownerEmail = owner.email;
    } else {
      const config = site.config as { owner_email?: string };
      if (config.owner_email) ownerEmail = config.owner_email;
    }
    await EmailService.sendSiteContactRequest(site.name, ownerEmail, email, sanitizedInterest, sanitizedNotes);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
