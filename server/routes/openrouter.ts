// server/routes/openrouter.ts
import express from "express";
import { Request, Response } from "express";
import { supabase } from "../services/supabase.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { enhancementLimiter } from "../middleware/rateLimiter.middleware.js";
import { validatePromptEnhancement } from "../middleware/validation.middleware.js";
import logger from "../config/logger.js";

const router = express.Router();

// Type for OpenRouter API response
interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

// Get conversation history (last 24 hours by default)
router.get(
  "/history",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { timeframe } = req.query;
    const days = timeframe === "week" ? 7 : timeframe === "all" ? null : 1; // Default to 1 day if not specified

    logger.info(`Fetching history for user ${req.user?.userId}, timeframe: ${timeframe}`);

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
        const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
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

// Save a new conversation
router.post("/save", authenticateToken, async (req: Request, res: Response) => {
  const {
    model,
    prompt,
    response,
    response_time,
    user_id,
    template_id,
    tags,
    generation_id,
    latency,
    moderation_latency,
    generation_time,
    tokens_prompt,
    tokens_completion,
    total_cost,
  } = req.body;

  try {
    // Use user_id from request body if provided, otherwise use authenticated user's ID
    const finalUserId = user_id || req.user?.userId;

    logger.info(`Saving conversation for user ${finalUserId}, model: ${model}`);

    const { data, error } = await supabase
      .from("openrouter_events")
      .insert([
        {
          model,
          prompt,
          response,
          response_time,
          user_id: finalUserId,
          template_id: template_id || null,
          tags: tags || [],
          generation_id: generation_id || null,
          latency: latency || null,
          moderation_latency: moderation_latency || null,
          generation_time: generation_time || null,
          tokens_prompt: tokens_prompt || null,
          tokens_completion: tokens_completion || null,
          total_cost: total_cost || null,
        },
      ])
      .select();

    if (error) {
      logger.error("Supabase insert error:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      logger.error("No data returned from insert");
      throw new Error("Insert succeeded but no data returned");
    }

    if (!data[0].id) {
      logger.error("Insert returned data without ID:", data[0]);
      throw new Error("Insert returned data without ID");
    }

    logger.info(
      `Conversation saved successfully with ID: ${data[0].id} for user ${finalUserId}`,
    );
    res.json(data[0]);
  } catch (error) {
    logger.error("Error saving conversation:", error);
    res.status(500).json({ error: "Failed to save conversation" });
  }
});

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
