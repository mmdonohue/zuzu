import { Router, Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/email.service.js';
import { supabase } from '../services/supabase.js';
import { logger } from '../config/logger.js';

const router = Router();

// GET /api/events/:slug — return active events for a site with registration counts
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();

    if (siteError || !site) {
      res.status(404).json({ message: 'Site not found.' });
      return;
    }

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('site_id', site.id)
      .eq('status', 'active')
      .order('start_at', { ascending: true });

    if (eventsError) throw eventsError;

    // Get registration counts for all events in one query
    const eventIds = (events ?? []).map((e) => e.id as string);
    let countMap: Record<string, number> = {};

    if (eventIds.length > 0) {
      const { data: counts } = await supabase
        .from('event_registrations')
        .select('event_id')
        .in('event_id', eventIds);

      (counts ?? []).forEach((row) => {
        const id = row.event_id as string;
        countMap[id] = (countMap[id] ?? 0) + 1;
      });
    }

    const result = (events ?? []).map((e) => ({
      ...e,
      registered_count: countMap[e.id as string] ?? 0,
    }));

    res.json({ events: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:slug/register
router.post('/:slug/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { event_id, email, name, notes } = req.body as {
      event_id?: string;
      email?: string;
      name?: string;
      notes?: string;
    };

    if (!event_id || typeof event_id !== 'string') {
      res.status(400).json({ message: 'event_id is required.' });
      return;
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ message: 'A valid email address is required.' });
      return;
    }

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, config')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();

    if (siteError || !site) {
      res.status(404).json({ message: 'Site not found.' });
      return;
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .eq('site_id', site.id)
      .eq('status', 'active')
      .maybeSingle();

    if (eventError || !event) {
      res.status(404).json({ message: 'Event not found.' });
      return;
    }

    // Check capacity
    const { count: existingCount } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id);

    const registered = existingCount ?? 0;

    if (event.max_capacity !== null && registered >= (event.max_capacity as number)) {
      res.status(409).json({ message: 'This event is at capacity.' });
      return;
    }

    // Insert registration (unique constraint handles duplicate silently)
    const { error: insertError } = await supabase
      .from('event_registrations')
      .insert({
        event_id,
        site_id: site.id,
        email,
        name: name ? name.slice(0, 100) : null,
        notes: notes ? notes.slice(0, 500) : null,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        res.status(409).json({ message: 'You are already registered for this event.' });
        return;
      }
      throw insertError;
    }

    const newCount = registered + 1;
    logger.info(`Event registration: ${email} → ${event.title} (${event_id}), count: ${newCount}`);

    const config = site.config as { owner_email?: string };
    const ownerEmail = config.owner_email || 'donohue.matt@gmail.com';

    await EmailService.sendEventRegistrationConfirmation({
      eventId: event_id,
      eventTitle: event.title as string,
      location: (event.location as string) ?? null,
      locationUrl: (event.location_url as string) ?? null,
      startAt: event.start_at as string,
      registrantEmail: email,
      registrantName: name ? name.slice(0, 100) : null,
      registeredCount: newCount,
      maxCapacity: (event.max_capacity as number) ?? null,
      siteName: site.name as string,
      ownerEmail,
    });

    res.json({ success: true, registered_count: newCount });
  } catch (error) {
    next(error);
  }
});

export default router;
