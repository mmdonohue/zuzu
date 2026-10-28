// server/services/openrouterPolicy.ts
// OpenRouter cost policy, ported from Seravanna. Every playground completion
// passes through assertModelAllowed() so a paid model is never called unless
// the caller is allowed to spend (admins).
//
// Free = every numeric pricing field in the OpenRouter catalog is exactly 0.
// Routers like openrouter/auto report -1 (variable) and are NOT free.
import logger from "../config/logger.js";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const CATALOG_TTL_MS = 60 * 60 * 1000;
const CATALOG_TIMEOUT_MS = 10 * 1000;
const POLICY_ERROR_STATUS = 403;

export const FREE_FALLBACK_MODEL = "openrouter/free";

export type CatalogModel = {
  id: string;
  context_length?: number;
  pricing?: Record<string, string>;
  top_provider?: {
    max_completion_tokens?: number | null;
  };
};

type CatalogResponse = {
  data?: CatalogModel[];
};

export type PolicyErrorCode = "MODEL_NOT_FREE" | "MODEL_NOT_IN_CATALOG";

export class ModelPolicyError extends Error {
  status = POLICY_ERROR_STATUS;

  constructor(
    message: string,
    public code: PolicyErrorCode,
  ) {
    super(message);
    Object.setPrototypeOf(this, ModelPolicyError.prototype);
  }
}

let catalog: Map<string, CatalogModel> | null = null;
let catalogFetchedAt = 0;
let inflight: Promise<Map<string, CatalogModel> | null> | null = null;

export function isModelFree(model: CatalogModel | undefined): boolean {
  const pricing = model?.pricing;
  if (
    !pricing ||
    pricing.prompt === undefined ||
    pricing.completion === undefined
  ) {
    return false;
  }
  return Object.values(pricing).every((v) => parseFloat(v) === 0);
}

async function refreshCatalog(): Promise<Map<string, CatalogModel>> {
  const response = await fetch(OPENROUTER_MODELS_URL, {
    signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`catalog request failed: ${response.status}`);
  }
  const body = (await response.json()) as CatalogResponse;
  catalog = new Map((body.data || []).map((m) => [m.id, m]));
  catalogFetchedAt = Date.now();
  return catalog;
}

// Returns the cached catalog, refreshing when stale. On refresh failure the stale
// copy is kept; returns null only if the catalog has never been fetched.
export async function getCatalog(): Promise<Map<string, CatalogModel> | null> {
  if (catalog && Date.now() - catalogFetchedAt < CATALOG_TTL_MS) return catalog;
  if (!inflight) {
    inflight = refreshCatalog()
      .catch((err: Error) => {
        logger.error(`OpenRouter catalog refresh failed: ${err.message}`);
        return catalog;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export async function getModel(
  modelId: string,
): Promise<CatalogModel | undefined> {
  return (await getCatalog())?.get(modelId);
}

/**
 * Throws ModelPolicyError unless the model is free or allowPaid is set.
 * With no catalog at all (first fetch failed), only `:free` ids and openrouter/free pass.
 */
export async function assertModelAllowed(
  modelId: string,
  { allowPaid }: { allowPaid: boolean },
): Promise<void> {
  if (allowPaid) return;

  const models = await getCatalog();
  if (!models) {
    if (modelId === FREE_FALLBACK_MODEL || modelId.endsWith(":free")) return;
    throw new ModelPolicyError(
      `Model ${modelId} blocked: catalog unavailable and id is not :free`,
      "MODEL_NOT_FREE",
    );
  }

  const model = models.get(modelId);
  if (!model) {
    throw new ModelPolicyError(
      `Model ${modelId} is not in the OpenRouter catalog`,
      "MODEL_NOT_IN_CATALOG",
    );
  }
  if (!isModelFree(model)) {
    throw new ModelPolicyError(
      `${modelId} is a paid model. Paid models are limited to admins — pick a :free model.`,
      "MODEL_NOT_FREE",
    );
  }
}

/**
 * Caps max_tokens at what the model can actually produce, so oversized client
 * values don't 400 on smaller models. Unknown models pass through unchanged.
 */
export async function clampMaxTokens(
  modelId: string,
  requested: number | undefined,
): Promise<number | undefined> {
  const model = await getModel(modelId);
  const ceiling =
    model?.top_provider?.max_completion_tokens || model?.context_length;
  if (!ceiling) return requested;
  return requested ? Math.min(requested, ceiling) : undefined;
}
