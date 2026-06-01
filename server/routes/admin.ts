import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

// Middleware: require authenticated admin or site admin
async function requireAdmin(req: Request, res: Response, next: Function) {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Check users.role as platform admin (ADMIN role in users table)
  const { data: userRow } = await supabase
    .from('users')
    .select('role_id, roles(role)')
    .eq('id', userId)
    .single();

  const userRole = (userRow as any)?.roles?.role?.toLowerCase();
  const isUserAdmin = userRole === 'admin';

  // Also check site_members for zuzu root site
  const { data: zuzuMember } = await supabase
    .from('site_members')
    .select('role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .in('role', ['admin'])
    .limit(1);

  (req as any).isPlatformAdmin = isUserAdmin || (zuzuMember && zuzuMember.length > 0);
  (req as any).adminUserId = Number(userId);
  next();
}

// GET /api/admin/sites — platform admin sees all, site admin sees own
router.get('/sites', requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).adminUserId;
    const isPlatformAdmin = (req as any).isPlatformAdmin;

    let sites;
    if (isPlatformAdmin) {
      const { data, error } = await supabase
        .from('sites')
        .select('id, slug, domain, config, owner_id, created_at')
        .order('created_at', { ascending: true });
      if (error) throw error;
      sites = data;
    } else {
      // Only sites where this user is admin or partner
      const { data, error } = await supabase
        .from('site_members')
        .select('role, sites(id, slug, domain, config, owner_id, created_at)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .in('role', ['admin', 'partner', 'client_partner']);
      if (error) throw error;
      sites = (data || []).map((m: any) => ({ ...m.sites, member_role: m.role }));
    }

    res.json({ sites });
  } catch (err) {
    console.error('Admin sites error:', err);
    res.status(500).json({ error: 'Failed to load sites' });
  }
});

// GET /api/admin/sites/:slug/events
router.get('/sites/:slug/events', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const { data: site } = await supabase
      .from('sites').select('id').eq('slug', slug).single();
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id, title, description, template, start_at, end_at, location,
        max_capacity, status, rrule, created_at,
        event_registrations(count),
        event_topics(count)
      `)
      .eq('site_id', site.id)
      .order('start_at', { ascending: true });

    if (error) throw error;

    const enriched = (events || []).map((e: any) => ({
      ...e,
      registered_count: e.event_registrations?.[0]?.count ?? 0,
      topic_count: e.event_topics?.[0]?.count ?? 0,
    }));

    res.json({ events: enriched });
  } catch (err) {
    console.error('Admin events error:', err);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

// GET /api/admin/sites/:slug/contacts
router.get('/sites/:slug/contacts', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const { data: site } = await supabase
      .from('sites').select('id').eq('slug', slug).single();
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const { data: contacts, error } = await supabase
      .from('site_contacts')
      .select('id, email, interest, notes, metadata, created_at')
      .eq('site_id', site.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ contacts: contacts || [] });
  } catch (err) {
    console.error('Admin contacts error:', err);
    res.status(500).json({ error: 'Failed to load contacts' });
  }
});

// GET /api/admin/sites/:slug/registrations
router.get('/sites/:slug/registrations', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const { data: site } = await supabase
      .from('sites').select('id').eq('slug', slug).single();
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const { data: registrations, error } = await supabase
      .from('event_registrations')
      .select('id, email, name, notes, metadata, created_at, events(title, start_at)')
      .eq('site_id', site.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ registrations: registrations || [] });
  } catch (err) {
    console.error('Admin registrations error:', err);
    res.status(500).json({ error: 'Failed to load registrations' });
  }
});

// PUT /api/admin/sites/:slug/events/:eventId
router.put('/sites/:slug/events/:eventId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { title, description, location, location_url, start_at, end_at, max_capacity, status, rrule, cta_label, cta_url } = req.body;

    const { data, error } = await supabase
      .from('events')
      .update({ title, description, location, location_url, start_at, end_at, max_capacity, status, rrule, cta_label, cta_url })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    res.json({ event: data });
  } catch (err) {
    console.error('Admin update event error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// GET /api/admin/sites/:slug/events/:eventId/assignments (assigned topic IDs for this event)
router.get('/sites/:slug/events/:eventId/assignments', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { data, error } = await supabase
      .from('event_topic_assignments')
      .select('display_order, event_topics(id, title, description, text, image, up_votes, display_order, status)')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true });
    if (error) throw error;
    const assignments = (data || []).map((a: any) => ({ topic_id: (a.event_topics as any).id, display_order: a.display_order }));
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load topics' });
  }
});

// GET /api/admin/sites/:slug/topics (site-level topic library)
router.get('/sites/:slug/topics', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { data: site } = await supabase.from('sites').select('id').eq('slug', slug).single();
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const { data, error } = await supabase
      .from('event_topics')
      .select('id, title, description, text, image, up_votes, display_order, status, event_id')
      .eq('site_id', (site as any).id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ topics: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load site topics' });
  }
});

// POST /api/admin/sites/:slug/topics (create site-level topic, not tied to an event)
router.post('/sites/:slug/topics', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { title, description, text, image, display_order } = req.body;
    const { data: site } = await supabase.from('sites').select('id').eq('slug', slug).single();
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const { data, error } = await supabase
      .from('event_topics')
      .insert({ site_id: (site as any).id, title, description, text, image, display_order: display_order ?? 0 })
      .select().single();
    if (error) throw error;
    res.json({ topic: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// PUT /api/admin/sites/:slug/topics/:topicId
router.put('/sites/:slug/topics/:topicId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const { title, description, text, image, display_order, status } = req.body;
    const { data, error } = await supabase
      .from('event_topics')
      .update({ title, description, text, image, display_order, status })
      .eq('id', topicId).select().single();
    if (error) throw error;
    res.json({ topic: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

// GET /api/admin/sites/:slug/events/:eventId/assignments (which topic IDs are assigned)
router.get('/sites/:slug/events/:eventId/assignments', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { data, error } = await supabase
      .from('event_topic_assignments')
      .select('topic_id, display_order')
      .eq('event_id', eventId);
    if (error) throw error;
    res.json({ assignments: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load assignments' });
  }
});

// POST /api/admin/sites/:slug/events/:eventId/assignments (assign topic to event)
router.post('/sites/:slug/events/:eventId/assignments', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { topic_id, display_order } = req.body;
    const { data, error } = await supabase
      .from('event_topic_assignments')
      .insert({ event_id: eventId, topic_id, display_order: display_order ?? 0 })
      .select().single();
    if (error) throw error;
    res.json({ assignment: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign topic' });
  }
});

// DELETE /api/admin/sites/:slug/events/:eventId/assignments/:topicId (unassign)
router.delete('/sites/:slug/events/:eventId/assignments/:topicId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { eventId, topicId } = req.params;
    const { error } = await supabase
      .from('event_topic_assignments')
      .delete()
      .eq('event_id', eventId)
      .eq('topic_id', topicId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unassign topic' });
  }
});





export default router;
