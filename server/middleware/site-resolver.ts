import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase.js';
import { logger } from '../config/logger.js';

export type SiteConfig = {
  owner_email?: string;
  from_name?: string;
  theme?: string;
  [key: string]: unknown;
};

export type ResolvedSite = {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  parent_id: string | null;
  config: SiteConfig;
  active: boolean;
};

declare global {
  namespace Express {
    interface Request {
      site?: ResolvedSite;
    }
  }
}

/**
 * Soft middleware — resolves the current site from req.hostname by matching
 * the `domain` column in the sites table. Attaches req.site if found.
 * Non-blocking: always calls next() even if no match or on DB error.
 *
 * Enables: moxilabs.ai → ZuZu → req.site = { slug: 'moxilabs', ... }
 */
export async function siteResolver(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const hostname = req.hostname;

  // Skip localhost — no domain-based resolution needed in dev
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
    return next();
  }

  try {
    const { data, error } = await supabase
      .from('sites')
      .select('id, slug, name, domain, parent_id, config, active')
      .eq('domain', hostname)
      .eq('active', true)
      .maybeSingle();

    if (!error && data) {
      req.site = data as ResolvedSite;
      logger.info(`Site resolved: ${data.slug} for hostname ${hostname}`);
    }
  } catch (err) {
    // Non-blocking — log and continue even if lookup fails
    logger.warn(`Site resolver error for hostname ${hostname}: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  next();
}
