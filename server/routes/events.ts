import { Router, Request, Response, NextFunction } from "express";
import { EmailService } from "../services/email.service.js";
import { supabase } from "../services/supabase.js";
import { logger } from "../config/logger.js";

const router = Router();

// GET /api/events/:slug — return active events for a site with registration counts
router.get(
  "/:slug",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const { data: site, error: siteError } = await supabase
        .from("sites")
        .select("id, name, owner_id, config")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();

      if (siteError || !site) {
        res.status(404).json({ message: "Site not found." });
        return;
      }

      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("site_id", site.id)
        .eq("status", "active")
        .order("start_at", { ascending: true });

      if (eventsError) throw eventsError;

      // Get registration counts for all events in one query
      const eventIds = (events ?? []).map((e) => e.id as string);
      let countMap: Record<string, number> = {};

      if (eventIds.length > 0) {
        const { data: counts } = await supabase
          .from("event_registrations")
          .select("event_id")
          .in("event_id", eventIds);

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
  },
);

// GET /api/events/:slug/:eventId/topics
router.get(
  "/:slug/:eventId/topics",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { eventId } = req.params;

      // Join through assignment table so topics can be reused across events
      const { data: assignments, error } = await supabase
        .from("event_topic_assignments")
        .select("display_order, event_topics(*)")
        .eq("event_id", eventId)
        .order("display_order", { ascending: true });

      if (error) throw error;

      const topics = (assignments || []).map((a: any) => ({
        ...a.event_topics,
        display_order: a.display_order,
      }));
      const filteredTopics = topics.filter((t: any) => t.status === "active");
      res.json({ topics: filteredTopics });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/events/:slug/:eventId/topics/:topicId/vote
router.post(
  "/:slug/:eventId/topics/:topicId/vote",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { topicId } = req.params;
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
        req.socket.remoteAddress ??
        "unknown";

      // Check for duplicate vote
      const { data: existing } = await supabase
        .from("event_topic_votes")
        .select("id")
        .eq("topic_id", topicId)
        .eq("ip_address", ip)
        .maybeSingle();

      if (existing) {
        res.status(409).json({ message: "Already voted." });
        return;
      }

      // Record vote
      const { error: voteError } = await supabase
        .from("event_topic_votes")
        .insert({ topic_id: topicId, ip_address: ip });

      if (voteError) throw voteError;

      // Increment counter
      const { data: topic, error: topicError } = await supabase
        .from("event_topics")
        .select("up_votes")
        .eq("id", topicId)
        .maybeSingle();

      if (topicError || !topic)
        throw topicError ?? new Error("Topic not found");

      const newCount = (topic.up_votes as number) + 1;
      await supabase
        .from("event_topics")
        .update({ up_votes: newCount })
        .eq("id", topicId);

      res.json({ up_votes: newCount });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/events/:slug/register
router.post(
  "/:slug/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const { event_id, email, name, notes } = req.body as {
        event_id?: string;
        email?: string;
        name?: string;
        notes?: string;
      };

      if (!event_id || typeof event_id !== "string") {
        res.status(400).json({ message: "event_id is required." });
        return;
      }
      if (!email || typeof email !== "string" || !email.includes("@")) {
        res.status(400).json({ message: "A valid email address is required." });
        return;
      }

      const { data: site, error: siteError } = await supabase
        .from("sites")
        .select("id, name, owner_id, config")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();

      if (siteError || !site) {
        res.status(404).json({ message: "Site not found." });
        return;
      }

      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", event_id)
        .eq("site_id", site.id)
        .eq("status", "active")
        .maybeSingle();

      if (eventError || !event) {
        res.status(404).json({ message: "Event not found." });
        return;
      }

      // Check capacity
      const { count: existingCount } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event_id);

      const registered = existingCount ?? 0;

      if (
        event.max_capacity !== null &&
        registered >= (event.max_capacity as number)
      ) {
        res.status(409).json({ message: "This event is at capacity." });
        return;
      }

      // Insert registration (unique constraint handles duplicate silently)
      const { error: insertError } = await supabase
        .from("event_registrations")
        .insert({
          event_id,
          site_id: site.id,
          email,
          name: name ? name.slice(0, 100) : null,
          notes: notes ? notes.slice(0, 500) : null,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          res
            .status(409)
            .json({ message: "You are already registered for this event." });
          return;
        }
        throw insertError;
      }

      const newCount = registered + 1;

      // Correlate any prior topic votes from this IP with the registrant's email
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
        req.socket.remoteAddress ??
        "unknown";
      const { data: priorVotes } = await supabase
        .from("event_topic_votes")
        .select("id, topic_id")
        .eq("ip_address", ip)
        .is("voter_email", null);

      const votedTopicIds: string[] = [];
      if (priorVotes && priorVotes.length > 0) {
        const voteIds = priorVotes.map((v) => v.id as string);
        votedTopicIds.push(...priorVotes.map((v) => v.topic_id as string));
        await supabase
          .from("event_topic_votes")
          .update({ voter_email: email })
          .in("id", voteIds);
      }

      // Store voted topics in registration metadata
      if (votedTopicIds.length > 0) {
        await supabase
          .from("event_registrations")
          .update({ metadata: { voted_topic_ids: votedTopicIds } })
          .eq("event_id", event_id)
          .eq("email", email);
      }

      logger.info(
        `Event registration: ${email} → ${event.title} (${event_id}), count: ${newCount}, voted_topics: ${votedTopicIds.length}`,
      );

      // Resolve owner email via owner_id FK, fall back to config.owner_email, then hardcoded default
      let ownerEmail = "donohue.matt@gmail.com";
      if (site.owner_id) {
        const { data: owner } = await supabase
          .from("users")
          .select("email")
          .eq("id", site.owner_id)
          .maybeSingle();
        if (owner?.email) ownerEmail = owner.email;
      } else {
        const config = site.config as { owner_email?: string };
        if (config.owner_email) ownerEmail = config.owner_email;
      }

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
  },
);

export default router;
