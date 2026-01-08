// server/services/leetmaster.service.ts
import { supabase } from "./supabase.js";
import logger from "../config/logger.js";

type Problem = {
  id: string;
  focus_area: string;
  difficulty: string;
  problem_json: {
    title: string;
    description: string;
    test_cases: Array<{ input: string; expected_output: string }>;
    starter_code: string;
    solution_code: string;
    hints: string[];
    constraints: string[];
    keywords: string[];
    time_complexity: string;
    space_complexity: string;
  };
  created_at: string;
  active: boolean;
};

type Attempt = {
  id: string;
  user_id: number;
  problem_id: string;
  user_solution: string | null;
  rating: number;
  created_at: string;
};

type UserProgress = {
  total_attempted: number;
  by_focus_area: {
    [key: string]: {
      count: number;
      avg_rating: number;
    };
  };
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  content?: string;
};

export class LeetMasterService {
  /**
   * Check for existing unused problem for this user
   * Returns a problem that the user has not yet attempted
   */
  static async checkExistingProblem(
    focusArea: string,
    difficulty: string,
    userId: number,
  ): Promise<Problem | null> {
    try {
      // Query for active problems in this focus area and difficulty
      // that the user hasn't attempted yet
      const { data: problems, error: problemError } = await supabase
        .from("problems")
        .select("*")
        .eq("focus_area", focusArea)
        .eq("difficulty", difficulty)
        .eq("active", true)
        .order("created_at", { ascending: true });

      if (problemError) {
        logger.error("Error querying problems:", problemError);
        throw problemError;
      }

      if (!problems || problems.length === 0) {
        return null;
      }

      // Check each problem to see if user has attempted it
      for (const problem of problems) {
        const { data: attempts, error: attemptError } = await supabase
          .from("attempts")
          .select("id")
          .eq("problem_id", problem.id)
          .eq("user_id", userId)
          .limit(1);

        if (attemptError) {
          logger.error("Error checking attempts:", attemptError);
          continue;
        }

        // If no attempts found, this problem is available
        if (!attempts || attempts.length === 0) {
          logger.info(
            `Found existing unused problem ${problem.id} for user ${userId}`,
          );
          return problem as Problem;
        }
      }

      // All problems have been attempted
      return null;
    } catch (error) {
      logger.error("Error in checkExistingProblem:", error);
      return null;
    }
  }

  /**
   * Fetch all existing problem titles to avoid duplicates
   */
  static async getExistingTitles(): Promise<string[]> {
    try {
      const { data: problems, error } = await supabase
        .from("problems")
        .select("problem_json")
        .eq("active", true);

      if (error) {
        logger.error("Error fetching existing titles:", error);
        return [];
      }

      if (!problems || problems.length === 0) {
        return [];
      }

      // Extract titles from problem_json
      const titles = problems
        .map((p) => {
          const json = p.problem_json as { title?: string };
          return json.title;
        })
        .filter((title): title is string => !!title);

      logger.info(`Found ${titles.length} existing problem titles`);
      return titles;
    } catch (error) {
      logger.error("Error in getExistingTitles:", error);
      return [];
    }
  }

  /**
   * Generate a new problem via OpenRouter AI
   */
  static async generateProblem(
    focusArea: string,
    difficulty: string,
    userId: number,
  ): Promise<Problem> {
    const OPENROUTER_API_KEY = process.env.ZUZU_OPENROUTER_KEY;
    const OPENROUTER_MODEL = "mistralai/mistral-7b-instruct";

    if (!OPENROUTER_API_KEY) {
      throw new Error("ZUZU_OPENROUTER_KEY not configured");
    }

    // Fetch existing titles to avoid duplicates
    const existingTitles = await this.getExistingTitles();

    // Create the AI prompt
    const systemPrompt = `You are a coding problem generator. You MUST output ONLY valid JSON with no markdown formatting, no explanations, no code fences. The JSON must match this exact schema:

{
  "title": "Problem Title",
  "description": "Detailed problem description",
  "test_cases": [
    {"input": "example input", "expected_output": "example output"}
  ],
  "starter_code": "function template with empty body",
  "solution_code": "complete working solution",
  "hints": ["hint 1", "hint 2"],
  "constraints": ["constraint 1"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "time_complexity": "Big O notation",
  "space_complexity": "Big O notation"
}

CRITICAL TEST CASE FORMAT - READ CAREFULLY:
- EVERY test case input/output MUST be EXECUTABLE JavaScript code
- If your input has multiple numbers, it MUST be an ARRAY with SQUARE BRACKETS []
- WRONG EXAMPLES (will cause syntax errors):
  ❌ "input": "2,3,-2,4,-1,5" (INVALID - missing brackets)
  ❌ "input": "1, 2, 3, 4" (INVALID - missing brackets)
  ❌ "input": "[1,2,3], 5" (INVALID - missing outer brackets)
  ❌ "input": "hello world" (INVALID - missing quotes)

- CORRECT EXAMPLES (valid JavaScript):
  ✅ "input": "[2, 3, -2, 4, -1, 5]" (array with brackets)
  ✅ "input": "[1, 2, 3, 4]" (array with brackets)
  ✅ "input": "[[1,2,3], 5]" (nested array with brackets)
  ✅ "input": "\"hello world\"" (string with quotes)
  ✅ "input": "42" (single number, no brackets needed)

VALIDATION CHECK: Before finalizing, verify EVERY input can be used as: const input = YOUR_INPUT_HERE;
If YOUR_INPUT_HERE is "2,3,4" this will fail. It MUST be "[2,3,4]"

CRITICAL FUNCTION NAMING:
- The function MUST be named "runSolution" - NOT any other name
- The function MUST take exactly ONE parameter named "input"
- Do NOT use problem-specific names like "longestSubarray", "findMax", "twoSum", etc.
- ALWAYS use: function runSolution(input) { }

CRITICAL: test_cases array must contain 3-5 items (NEVER more than 5). All array inputs must be MAXIMUM 30 elements. Keep all inputs concise and readable.`;

    // Build the existing titles list for the prompt
    const titlesListText =
      existingTitles.length > 0
        ? `\n\nEXISTING PROBLEM TITLES (DO NOT DUPLICATE):\n${existingTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nYou MUST create a unique title that is NOT in the list above.`
        : "";

    const userPrompt = `Generate a ${difficulty} LeetCode-style problem focused on ${focusArea}.${titlesListText}

Requirements:
- Create a UNIQUE title - do not duplicate any existing titles listed above
- Include EXACTLY 3-5 test cases with diverse inputs (MAXIMUM 5 test cases)
- Keep all test case inputs CONCISE - arrays must have MAXIMUM 30 elements
- Keep input values small and readable (single or double digits preferred)
- Add 2-3 helpful hints
- Add 3-5 keywords that describe algorithms, patterns, or techniques used (e.g., "two pointers", "sliding window", "tortoise and hare", "dynamic programming")
- Specify time/space complexity

TEST CASE FORMAT - MANDATORY SQUARE BRACKETS FOR ARRAYS:

❌ WRONG - These will cause JavaScript syntax errors:
  {"input": "2, 3, -2, 4", "expected_output": "4"}  ← INVALID! Missing brackets!
  {"input": "1, 2, 3, 4, 5", "expected_output": "3"}  ← INVALID! Missing brackets!
  
✅ CORRECT - Use square brackets for arrays:
  {"input": "[2, 3, -2, 4]", "expected_output": "4"}  ← Valid array
  {"input": "[1, 2, 3, 4, 5]", "expected_output": "3"}  ← Valid array

More examples:
  {"input": "[[1,2], [3,4]]", "expected_output": "[2, 4]"}  ← Nested arrays
  {"input": "[[1,2,3,4], 5]", "expected_output": "2"}  ← Array with number
  {"input": "[\"hello\", \"world\"]", "expected_output": "\"helloworld\""}  ← Array with strings
  {"input": "\"abcdef\"", "expected_output": "\"fedcba\""}  ← Single string
  {"input": "42", "expected_output": "84"}  ← Single number

FINAL VALIDATION: Test each input by asking "Can I write: const input = YOUR_VALUE;" and have it work?
If YOUR_VALUE is "2,3,4" the answer is NO. It must be "[2,3,4]".

⚠️  ABSOLUTE REQUIREMENT - ARRAYS MUST HAVE SQUARE BRACKETS [ ] ⚠️
If your problem uses an array of numbers like 2,3,-2,4,-1,5 you MUST write: "[2,3,-2,4,-1,5]"
NOT "2,3,-2,4,-1,5" - this is INVALID JavaScript and will fail!
Every array MUST start with [ and end with ]

STARTER CODE FORMAT (ABSOLUTELY CRITICAL):
You MUST use this EXACT template. Do NOT change the function name:
\`\`\`
function runSolution(input) {
  // TODO: Implement your solution here
  // 'input' parameter contains the test case data

  return null; // Replace with your solution
}
\`\`\`

SOLUTION CODE FORMAT (ABSOLUTELY CRITICAL):
You MUST use runSolution as the function name. Example:
\`\`\`
function runSolution(input) {
  // Destructure input if needed
  const [arr, target] = input;

  // Your solution logic with comments

  return result;
}
\`\`\`

FORBIDDEN:
- Do NOT name the function after the problem (e.g., longestSubarray, twoSum, findMax)
- Do NOT use multiple parameters (e.g., function runSolution(arr, k))
- ONLY use: function runSolution(input)

CRITICAL CONSTRAINTS:
- Test cases: 3-5 only (never more than 5)
- Array lengths: Maximum 30 elements per array
- Input sizes: Keep all inputs small and concise for readability
- Function name: MUST be "runSolution" - no exceptions
- Parameter: Single "input" parameter that receives test case input`;

    try {
      logger.info(
        `Generating ${difficulty} problem for ${focusArea} via OpenRouter`,
      );

      // Call OpenRouter API
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "ZuZu LeetMaster",
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("OpenRouter API error:", errorText);
        throw new Error(`OpenRouter API failed: ${response.statusText}`);
      }

      const aiResponse = (await response.json()) as OpenRouterResponse;
      const aiContent =
        aiResponse.choices?.[0]?.message?.content || aiResponse.content || "";

      if (!aiContent) {
        throw new Error("No content in AI response");
      }

      // Sanitize and parse JSON response
      const problemData = this.sanitizeJsonResponse(aiContent);

      // Validate difficulty
      const validatedDifficulty = this.validateDifficulty(
        (problemData.difficulty as string) || difficulty,
      );

      // Save to database
      const { data: savedProblem, error: insertError } = await supabase
        .from("problems")
        .insert([
          {
            focus_area: focusArea,
            difficulty: validatedDifficulty,
            problem_json: problemData,
          },
        ])
        .select()
        .single();

      if (insertError) {
        logger.error("Error saving problem to database:", insertError);
        throw insertError;
      }

      if (!savedProblem) {
        throw new Error("Problem saved but no data returned");
      }

      // Log to openrouter_events for cost tracking
      await supabase.from("openrouter_events").insert([
        {
          user_id: userId,
          model: OPENROUTER_MODEL,
          prompt: userPrompt,
          response: JSON.stringify(problemData),
          response_time: 0,
        },
      ]);

      logger.info(
        `Problem generated and saved successfully: ${savedProblem.id}`,
      );
      return savedProblem as Problem;
    } catch (error) {
      logger.error("Error generating problem:", error);
      throw error;
    }
  }

  /**
   * Sanitize JSON response from AI (strip markdown wrappers)
   */
  static sanitizeJsonResponse(aiResponse: string): Record<string, unknown> {
    try {
      // Strip markdown code fences
      let cleaned = aiResponse
        .replace(/```json\s*/g, "")
        .replace(/```\s*$/g, "")
        .trim();

      // Attempt to parse JSON
      const parsed = JSON.parse(cleaned);

      // Fix test case inputs that are missing brackets
      if (parsed.test_cases && Array.isArray(parsed.test_cases)) {
        parsed.test_cases = parsed.test_cases.map((tc: any) => {
          if (tc.input && typeof tc.input === "string") {
            // Check if input looks like comma-separated numbers without brackets
            // Pattern: starts with optional minus, has digits and commas, no brackets
            if (/^-?\d+(?:\s*,\s*-?\d+)+$/.test(tc.input.trim())) {
              logger.warn(
                `Fixing malformed test case input: "${tc.input}" -> "[${tc.input}]"`,
              );
              tc.input = `[${tc.input}]`;
            }
          }
          return tc;
        });
      }

      // Validate required fields
      const requiredFields = [
        "title",
        "description",
        "test_cases",
        "starter_code",
        "solution_code",
        "keywords",
      ];
      for (const field of requiredFields) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return parsed;
    } catch (error) {
      logger.error("Error sanitizing JSON response:", error);
      logger.error("Raw AI response:", aiResponse);
      throw new Error("Failed to parse AI response as valid JSON");
    }
  }

  /**
   * Validate difficulty and default to 'medium' if invalid
   */
  static validateDifficulty(difficulty: string): string {
    const validDifficulties = ["easy", "medium", "hard"];

    if (!validDifficulties.includes(difficulty)) {
      logger.warn(`Invalid difficulty "${difficulty}", defaulting to "medium"`);
      return "medium";
    }

    return difficulty;
  }

  /**
   * Save user attempt and rating
   */
  static async saveAttempt(
    userId: number,
    problemId: string,
    userSolution: string | null,
    rating: number,
  ): Promise<Attempt> {
    try {
      const { data, error } = await supabase
        .from("attempts")
        .insert([
          {
            user_id: userId,
            problem_id: problemId,
            user_solution: userSolution || null,
            rating: rating,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error("Error saving attempt:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Attempt saved but no data returned");
      }

      logger.info(
        `Attempt saved for user ${userId}, problem ${problemId}, rating: ${rating}`,
      );
      return data as Attempt;
    } catch (error) {
      logger.error("Error in saveAttempt:", error);
      throw error;
    }
  }

  /**
   * Get user progress statistics
   */
  static async getUserProgress(userId: number): Promise<UserProgress> {
    try {
      // Query all attempts for this user with problem data
      const { data: attempts, error } = await supabase
        .from("attempts")
        .select("rating, problems(focus_area)")
        .eq("user_id", userId);

      if (error) {
        logger.error("Error querying user progress:", error);
        throw error;
      }

      if (!attempts || attempts.length === 0) {
        return {
          total_attempted: 0,
          by_focus_area: {},
        };
      }

      // Calculate stats
      const byFocusArea: Record<
        string,
        { count: number; total_rating: number; avg_rating: number }
      > = {};

      attempts.forEach((attempt) => {
        const focusArea = (attempt.problems as { focus_area?: string })
          ?.focus_area;
        if (!focusArea) return;

        if (!byFocusArea[focusArea]) {
          byFocusArea[focusArea] = { count: 0, total_rating: 0, avg_rating: 0 };
        }

        byFocusArea[focusArea].count++;
        if (attempt.rating && attempt.rating > 0) {
          byFocusArea[focusArea].total_rating += attempt.rating;
        }
      });

      // Calculate averages
      Object.keys(byFocusArea).forEach((area) => {
        const stats = byFocusArea[area];
        stats.avg_rating =
          stats.total_rating > 0 ? stats.total_rating / stats.count : 0;
      });

      return {
        total_attempted: attempts.length,
        by_focus_area: byFocusArea,
      };
    } catch (error) {
      logger.error("Error in getUserProgress:", error);
      throw error;
    }
  }

  /**
   * Get user's attempted problems for a specific focus area
   */
  static async getUserAttemptsByFocusArea(
    userId: number,
    focusArea: string,
  ): Promise<
    Array<{
      attempt_id: string;
      problem_id: string;
      title: string;
      difficulty: string;
      rating: number;
      created_at: string;
    }>
  > {
    try {
      const { data: attempts, error } = await supabase
        .from("attempts")
        .select(
          "id, problem_id, rating, created_at, problems(id, focus_area, difficulty, problem_json)",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error querying user attempts by focus area:", error);
        throw error;
      }

      if (!attempts || attempts.length === 0) {
        return [];
      }

      // Filter by focus area and extract problem titles
      const result = attempts
        .filter((attempt) => {
          const problemArray = attempt.problems as Array<{
            focus_area?: string;
            difficulty?: string;
            problem_json?: { title?: string };
          }>;
          const problem = problemArray?.[0];
          return problem?.focus_area === focusArea;
        })
        .map((attempt) => {
          const problemArray = attempt.problems as Array<{
            id: string;
            focus_area: string;
            difficulty: string;
            problem_json: { title?: string };
          }>;
          const problem = problemArray[0];

          return {
            attempt_id: attempt.id,
            problem_id: problem.id,
            title: problem.problem_json?.title || "Untitled Problem",
            difficulty: problem.difficulty,
            rating: attempt.rating,
            created_at: attempt.created_at,
          };
        });

      logger.info(
        `Found ${result.length} attempts for user ${userId} in ${focusArea}`,
      );
      return result;
    } catch (error) {
      logger.error("Error in getUserAttemptsByFocusArea:", error);
      throw error;
    }
  }
}
