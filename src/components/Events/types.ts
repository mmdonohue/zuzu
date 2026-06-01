export type SiteEvent = {
  id: string;
  site_id: string;
  template: 'single' | 'recurring' | 'series';
  title: string;
  description?: string;
  location?: string;
  location_url?: string;
  image?: string;
  start_at: string;
  end_at?: string;
  rrule?: string;
  max_capacity?: number;
  cta_label?: string;
  cta_url?: string;
  status: 'active' | 'draft' | 'cancelled';
  metadata?: Record<string, unknown>;
  created_at: string;
  registered_count: number;
};

export type EventRegistrationPayload = {
  event_id: string;
  email: string;
  name?: string;
  notes?: string;
};

export type EventRegistrationResult = {
  reference: string;
  registered_count: number;
};

export type EventTopic = {
  id: string;
  event_id: string;
  site_id: string;
  title: string;
  description?: string;
  text?: string;
  image?: string;
  up_votes: number;
  display_order: number;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  user_voted?: boolean;
};
