// server/routes/openrouter.ts
import express from "express";
import { Request, Response } from "express";
import { supabase } from "../services/supabase.js";
import {
  authenticateToken,
  isAdminRole,
} from "../middleware/auth.middleware.js";
import {
  chatLimiter,
  enhancementLimiter,
} from "../middleware/rateLimiter.middleware.js";
import {
  validateChatCompletion,
  validatePromptEnhancement,
} from "../middleware/validation.middleware.js";
import {
  assertModelAllowed,
  clampMaxTokens,
  ModelPolicyError,
} from "../services/openrouterPolicy.js";
import {
  classifyUpstreamError,
  fetchActivity,
  fetchGeneration,
  fetchKeyInfo,
  OpenRouterConfigError,
  streamChatCompletion,
} from "../services/openrouter.service.js";
import logger from "../config/logger.js";

const router = express.Router();

const HTTP_OK = 200;
const HTTP_BAD_GATEWAY = 502;
const HTTP_SERVICE_UNAVAILABLE = 503;
const MS_PER_SECOND = 1000;
const SSE_DATA_PREFIX = "data: ";
const SSE_DONE_MARKER = "[DONE]";

// Type for OpenRouter API response
interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

type ChatRequestBody = {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  template_id?: string | null;
  tags?: string[];
};

type ChatStreamChunk = {
  id?: string;
  choices?: Array<{ delta?: { content?: string } }>;
  error?: { message?: string };
};

function writeSseEvent(
  res: Response,
  event: string,
  data: Record<string, unknown>,
): void {
  if (res.writableEnded || res.destroyed) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function relay(
  res: Response,
  call: () => Promise<{ status: number; body: unknown }>,
  what: string,
): Promise<void> {
  try {
    const { status, body } = await call();
    res.status(status).json(body);
  } catch (error) {
    const configError = error instanceof OpenRouterConfigError;
    logger.error(`OpenRouter ${what} proxy failed:`, error);
    res.status(configError ? HTTP_SERVICE_UNAVAILABLE : HTTP_BAD_GATEWAY).json({
      success: false,
      code: configError ? "NOT_CONFIGURED" : "UPSTREAM_ERROR",
      message: configError
        ? error.message
        : `Failed to fetch OpenRouter ${what}`,
    });
  }
}

// Get conversation history (last 24 hours by default)
router.get(
  "/history",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { timeframe } = req.query;
    const days = timeframe === "week" ? 7 : timeframe === "all" ? null : 1; // Default to 1 day if not specified

    logger.info(
      `Fetching history for user ${req.user?.userId}, timeframe: ${timeframe}`,
    );

    try {
      // Build query with user name and template joins
      let query = supabase
        .from("openrouter_events")
        .select(
          `
        *,
        users!openrouter_events_user_id_fkey (
          first_name,
          last_name
        ),
        prompt_templates (
          name,
          category
        )
      `,
        )
        .eq("active", true);

      // Add date filter only if not "all"
      if (days !== null) {
        const dateThreshold = new Date(
          Date.now() - days * 24 * 60 * 60 * 1000,
        ).toISOString();
        query = query.gte("created", dateThreshold);
      }

      // Filter by user_id unless user is ADMIN or SUPER_ADMIN
      const userRole = req.user?.role;
      if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
        query = query.eq("user_id", req.user?.userId);
      }

      const { data, error } = await query.order("created", {
        ascending: false,
      });

      if (error) {
        logger.error("Supabase error fetching history:", error);
        throw error;
      }

      // Flatten the user data into the response
      const formattedData = data?.map((event) => ({
        ...event,
        first_name: event.users?.first_name,
        last_name: event.users?.last_name,
        users: undefined, // Remove nested users object
      }));

      logger.info(`Returning ${formattedData?.length || 0} conversations`);
      res.json(formattedData);
    } catch (error) {
      logger.error("Error fetching conversation history:", error);
      res.status(500).json({ error: "Failed to fetch conversation history" });
    }
  },
);

// Stream a playground completion. The server holds the key, enforces the model
// policy, relays OpenRouter's SSE unchanged, then saves the event and emits
// `event: saved` (or `save_error` / `save_skipped`) before closing.
router.post(
  "/chat",
  authenticateToken,
  chatLimiter,
  validateChatCompletion,
  async (req: Request, res: Response) => {
    const { model, messages, temperature, max_tokens, template_id, tags } =
      req.body as ChatRequestBody;
    const userId = req.user?.userId;
    const startedAt = Date.now();

    // Client disconnect (Stop button, tab close) cancels the upstream call too
    const upstreamAbort = new AbortController();
    res.on("close", () => {
      if (!res.writableFinished) upstreamAbort.abort();
    });

    try {
      await assertModelAllowed(model, {
        allowPaid: isAdminRole(req.user?.role),
      });

      const upstream = await streamChatCompletion(
        {
          model,
          messages,
          temperature,
          max_tokens: await clampMaxTokens(model, max_tokens),
        },
        upstreamAbort.signal,
      );

      if (!upstream.ok || !upstream.body) {
        const err = classifyUpstreamError(
          upstream.status,
          await upstream.text(),
          upstream.headers,
        );
        logger.warn(
          `Chat ${model} for user ${userId} rejected upstream: ${err.code} ${err.message}`,
        );
        return res.status(err.status).json({ success: false, ...err });
      }

      res.writeHead(HTTP_OK, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      res.flushHeaders();

      let fullResponse = "";
      let generationId: string | null = null;
      let streamError: string | null = null;
      let buffer = "";
      const decoder = new TextDecoder();
      const reader = upstream.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith(SSE_DATA_PREFIX)) continue;
          const payload = line.slice(SSE_DATA_PREFIX.length).trim();
          if (!payload || payload === SSE_DONE_MARKER) continue;
          try {
            const chunk = JSON.parse(payload) as ChatStreamChunk;
            generationId ??= chunk.id ?? null;
            if (chunk.error)
              streamError = chunk.error.message || "Upstream stream error";
            fullResponse += chunk.choices?.[0]?.delta?.content ?? "";
          } catch {
            // keep-alive comment or partial line — nothing to accumulate
          }
        }
      }

      const responseTime = (Date.now() - startedAt) / MS_PER_SECOND;

      if (streamError || !fullResponse) {
        const message = streamError || "Model returned an empty response";
        logger.warn(`Chat ${model} for user ${userId} not saved: ${message}`);
        writeSseEvent(res, "save_skipped", { message });
        return res.end();
      }

      const generation = generationId
        ? await fetchGeneration(generationId)
        : null;
      const stats = generation?.data;

      const { data, error } = await supabase
        .from("openrouter_events")
        .insert([
          {
            model,
            prompt: messages[messages.length - 1].content,
            response: fullResponse,
            response_time: responseTime,
            user_id: userId,
            template_id: template_id || null,
            tags: tags || [],
            generation_id: generationId,
            latency: stats?.latency ?? null,
            moderation_latency: stats?.moderation_latency ?? null,
            generation_time: stats?.generation_time ?? null,
            tokens_prompt: stats?.tokens_prompt ?? null,
            tokens_completion: stats?.tokens_completion ?? null,
            total_cost: stats?.total_cost ?? null,
          },
        ])
        .select("id")
        .single();

      if (error || !data?.id) {
        logger.error(
          `Chat ${model} for user ${userId} completed but save failed:`,
          error,
        );
        writeSseEvent(res, "save_error", {
          message: "Response received but could not be saved",
        });
      } else {
        logger.info(
          `Chat ${model} for user ${userId} saved as event ${data.id} (${responseTime}s)`,
        );
        writeSseEvent(res, "saved", { id: data.id });
      }
      res.end();
    } catch (error) {
      if (upstreamAbort.signal.aborted) {
        logger.info(`Chat ${model} for user ${userId} cancelled by client`);
        if (!res.writableEnded) res.end();
        return;
      }

      if (error instanceof ModelPolicyError) {
        return res
          .status(error.status)
          .json({ success: false, code: error.code, message: error.message });
      }

      const configError = error instanceof OpenRouterConfigError;
      logger.error(`Chat ${model} for user ${userId} failed:`, error);
      const message = configError
        ? "OpenRouter is not configured on the server"
        : "Chat request failed";

      if (res.headersSent) {
        writeSseEvent(res, "error", { message });
        return res.end();
      }
      res
        .status(configError ? HTTP_SERVICE_UNAVAILABLE : HTTP_BAD_GATEWAY)
        .json({
          success: false,
          code: configError ? "NOT_CONFIGURED" : "UPSTREAM_ERROR",
          message,
        });
    }
  },
);

// Proxy OpenRouter key info (usage, limits) — keeps the API key server-side
router.get("/key", authenticateToken, async (req: Request, res: Response) => {
  await relay(res, fetchKeyInfo, "key info");
});

// Proxy OpenRouter account activity — needs the provisioning key, server-side only
router.get(
  "/activity",
  authenticateToken,
  async (req: Request, res: Response) => {
    await relay(res, fetchActivity, "activity");
  },
);

// Update conversation status (deactivate)
router.patch("/status/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { active } = req.body;

  try {
    const { data, error } = await supabase
      .from("openrouter_events")
      .update({ active })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (error) {
    console.error("Error updating conversation status:", error);
    res.status(500).json({ error: "Failed to update conversation status" });
  }
});

// Update event rating (1-5 stars)
router.patch(
  "/events/:id/rating",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rating } = req.body;

    // Validate rating value
    if (rating !== -1 && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error:
          "Invalid rating value. Must be between 1 and 5, or -1 to clear rating.",
      });
    }

    try {
      const { data, error } = await supabase
        .from("openrouter_events")
        .update({ rating })
        .eq("id", id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({ error: "Event not found" });
      }

      logger.info(
        `Event ${id} rating updated to ${rating} by user ${req.user?.userId}`,
      );
      res.json(data[0]);
    } catch (error) {
      logger.error("Error updating event rating:", error);
      res.status(500).json({ error: "Failed to update event rating" });
    }
  },
);

// Enhance prompt with AI suggestions
router.post(
  "/enhance",
  authenticateToken,
  enhancementLimiter,
  validatePromptEnhancement,
  async (req: Request, res: Response) => {
    const { prompt, style_guide_id, context } = req.body;

    try {
      // Get style guide if provided
      let styleGuide = null;
      if (style_guide_id) {
        const { data: guideData, error: guideError } = await supabase
          .from("style_guides")
          .select("*")
          .eq("id", style_guide_id)
          .eq("active", true)
          .single();

        if (guideError) {
          logger.warn(`Style guide not found: ${style_guide_id}`);
        } else {
          styleGuide = guideData;
        }
      }

      // Build enhancement system prompt
      const systemPrompt = styleGuide
        ? styleGuide.system_prompt
        : "You are an expert prompt engineer. Analyze and improve prompts for clarity, specificity, and effectiveness.";

      const enhancementPrompt = `
Analyze the following prompt and provide suggestions to improve it. Consider:
1. Clarity and specificity
2. Structure and organization
3. Missing context or details
4. Potential ambiguities
${context ? `\n\nAdditional context: ${context}` : ""}

Original prompt:
${prompt}

Provide:
1. An enhanced version of the prompt
2. A list of specific improvements made
3. Any additional suggestions

Format your response as JSON:
{
  "enhanced_prompt": "...",
  "improvements": ["...", "..."],
  "suggestions": ["...", "..."]
}
      `.trim();

      // Call OpenRouter API (placeholder - implement actual API call)
      const openRouterKey = process.env.ZUZU_OPENROUTER_KEY;
      if (!openRouterKey) {
        throw new Error("OpenRouter API key not configured");
      }

      // Make API call to OpenRouter
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer":
              process.env.PRODUCTION_FRONTEND_URL || "http://localhost:3000",
            "X-Title": "ZuZu Prompt Enhancer",
          },
          body: JSON.stringify({
            model: "anthropic/claude-3.5-sonnet",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: enhancementPrompt,
              },
            ],
            temperature: styleGuide?.temperature || 0.7,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("OpenRouter API error:", errorText);
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      // Parse and validate API response
      let result: OpenRouterResponse;
      let enhancedContent: string;
      try {
        result = (await response.json()) as OpenRouterResponse;

        if (!result || typeof result !== "object") {
          throw new Error("Invalid response format from OpenRouter API");
        }

        enhancedContent = result.choices?.[0]?.message?.content || "";

        if (!enhancedContent) {
          throw new Error("No response content from OpenRouter API");
        }
      } catch (parseError) {
        logger.error("Error parsing OpenRouter response:", parseError);
        throw new Error(
          `Failed to parse API response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
        );
      }

      // Parse JSON response from AI
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(enhancedContent);
      } catch (parseError) {
        // If JSON parsing fails, return raw response
        logger.warn("AI response was not valid JSON, using raw content");
        parsedResponse = {
          enhanced_prompt: enhancedContent,
          improvements: [],
          suggestions: [],
        };
      }

      // Save enhancement to history
      const { data: enhancementData, error: enhancementError } = await supabase
        .from("prompt_enhancements")
        .insert([
          {
            user_id: req.user?.userId,
            original_prompt: prompt,
            enhanced_prompt: parsedResponse.enhanced_prompt,
            suggestions: parsedResponse,
            accepted: false,
          },
        ])
        .select()
        .single();

      if (enhancementError) {
        logger.error("Error saving enhancement:", enhancementError);
        // Continue even if saving fails
      }

      res.json({
        success: true,
        data: {
          original_prompt: prompt,
          enhanced_prompt: parsedResponse.enhanced_prompt,
          improvements: parsedResponse.improvements || [],
          suggestions: parsedResponse.suggestions || [],
          style_guide: styleGuide
            ? {
                id: styleGuide.id,
                name: styleGuide.name,
              }
            : null,
          enhancement_id: enhancementData?.id,
        },
      });
    } catch (error) {
      logger.error("Error enhancing prompt:", error);
      res.status(500).json({
        success: false,
        message: "Failed to enhance prompt",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
