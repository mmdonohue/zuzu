import { useState, useEffect } from 'react';
import type { SiteEvent } from './types';

type UseEventsResult = {
  events: SiteEvent[];
  loading: boolean;
  error: string | null;
};

export function useEvents(slug: string): UseEventsResult {
  const [events, setEvents] = useState<SiteEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/events/${slug}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
        return res.json() as Promise<{ events: SiteEvent[] }>;
      })
      .then((data) => {
        if (!cancelled) {
          setEvents(data.events ?? []);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load events');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [slug]);

  return { events, loading, error };
}
