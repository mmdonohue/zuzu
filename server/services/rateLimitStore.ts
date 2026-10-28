// server/services/rateLimitStore.ts
// express-rate-limit store backed by Supabase (migration 013), so counters are
// shared across Vercel instances instead of resetting per cold start.
import type { ClientRateLimitInfo, Options, Store } from "express-rate-limit";
import { supabase } from "./supabase.js";

type IncrementRow = {
  total_hits: number;
  reset_time: string;
};

const DEFAULT_WINDOW_MS = 60 * 1000;

export class SupabaseRateLimitStore implements Store {
  localKeys = false;
  prefix: string;
  private windowMs = DEFAULT_WINDOW_MS;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const { data, error } = await supabase.rpc("increment_rate_limit", {
      p_key: this.prefix + key,
      p_window_ms: this.windowMs,
    });
    if (error) throw new Error(`rate limit increment failed: ${error.message}`);

    const row = (data as IncrementRow[] | null)?.[0];
    if (!row) throw new Error("rate limit increment returned no row");

    return { totalHits: row.total_hits, resetTime: new Date(row.reset_time) };
  }

  async decrement(key: string): Promise<void> {
    const { error } = await supabase.rpc("decrement_rate_limit", {
      p_key: this.prefix + key,
    });
    if (error) throw new Error(`rate limit decrement failed: ${error.message}`);
  }

  async resetKey(key: string): Promise<void> {
    const { error } = await supabase
      .from("rate_limits")
      .delete()
      .eq("key", this.prefix + key);
    if (error) throw new Error(`rate limit reset failed: ${error.message}`);
  }
}
