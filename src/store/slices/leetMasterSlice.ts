import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { csrfService } from "@/services/csrf.service";

// Type definitions
type TestCase = {
  input: string;
  expected_output: string;
};

type ProblemJson = {
  title: string;
  description: string;
  test_cases: TestCase[];
  starter_code: string;
  solution_code: string;
  hints: string[];
  constraints: string[];
  keywords: string[];
  time_complexity: string;
  space_complexity: string;
};

type Problem = {
  id: string;
  focus_area: string;
  difficulty: string;
  problem_json: ProblemJson;
  created_at: string;
  active: boolean;
};

type FocusAreaStats = {
  count: number;
  avg_rating: number;
};

type UserProgress = {
  total_attempted: number;
  by_focus_area: {
    [key: string]: FocusAreaStats;
  };
};

type LeetMasterState = {
  currentProblem: Problem | null;
  isGenerating: boolean;
  isSavingAttempt: boolean;
  isLoadingProgress: boolean;
  error: string | null;
  selectedFocusArea: string | null;
  selectedDifficulty: "easy" | "medium" | "hard";
  userProgress: UserProgress | null;
  showHints: boolean;
  showSolution: boolean;
};

const initialState: LeetMasterState = {
  currentProblem: null,
  isGenerating: false,
  isSavingAttempt: false,
  isLoadingProgress: false,
  error: null,
  selectedFocusArea: null,
  selectedDifficulty: "medium",
  userProgress: null,
  showHints: false,
  showSolution: false,
};

// Async thunks
export const generateProblem = createAsyncThunk(
  "leetMaster/generateProblem",
  async (
    { focusArea, difficulty }: { focusArea: string; difficulty: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(
        `/api/leetmaster/problems/generate?focus_area=${focusArea}&difficulty=${difficulty}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate problem");
      }

      const data = await response.json();
      return data as Problem;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate problem";
      return rejectWithValue(message);
    }
  },
);

export const saveAttempt = createAsyncThunk(
  "leetMaster/saveAttempt",
  async (
    {
      problemId,
      rating,
      userSolution,
    }: { problemId: string; rating: number; userSolution?: string },
    { rejectWithValue },
  ) => {
    try {
      // Get CSRF token from service (with caching)
      const csrfToken = await csrfService.getToken();

      const response = await fetch("/api/leetmaster/attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          problem_id: problemId,
          rating,
          user_solution: userSolution || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // If CSRF validation failed, refresh token and retry once
        if (response.status === 403 && errorData.code === "CSRF_VALIDATION_FAILED") {
          const newToken = await csrfService.refreshToken();
          
          const retryResponse = await fetch("/api/leetmaster/attempts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": newToken,
            },
            credentials: "include",
            body: JSON.stringify({
              problem_id: problemId,
              rating,
              user_solution: userSolution || null,
            }),
          });
          
          if (!retryResponse.ok) {
            const retryError = await retryResponse.json();
            throw new Error(retryError.error || "Failed to save attempt");
          }
          
          return await retryResponse.json();
        }
        
        throw new Error(errorData.error || "Failed to save attempt");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save attempt";
      return rejectWithValue(message);
    }
  },
);

export const loadProgress = createAsyncThunk(
  "leetMaster/loadProgress",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/leetmaster/progress", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load progress");
      }

      const data = await response.json();
      return data as UserProgress;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load progress";
      return rejectWithValue(message);
    }
  },
);

export const leetMasterSlice = createSlice({
  name: "leetMaster",
  initialState,
  reducers: {
    selectFocusArea: (state, action: PayloadAction<string>) => {
      state.selectedFocusArea = action.payload;
      // Reset problem when focus area changes
      state.currentProblem = null;
      state.showHints = false;
      state.showSolution = false;
      state.error = null;
    },
    selectDifficulty: (
      state,
      action: PayloadAction<"easy" | "medium" | "hard">,
    ) => {
      state.selectedDifficulty = action.payload;
      // Reset problem when difficulty changes
      state.currentProblem = null;
      state.showHints = false;
      state.showSolution = false;
      state.error = null;
    },
    toggleHints: (state) => {
      state.showHints = !state.showHints;
    },
    toggleSolution: (state) => {
      state.showSolution = !state.showSolution;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetProblem: (state) => {
      state.currentProblem = null;
      state.showHints = false;
      state.showSolution = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Generate problem cases
    builder.addCase(generateProblem.pending, (state) => {
      state.isGenerating = true;
      state.error = null;
      state.showHints = false;
      state.showSolution = false;
    });
    builder.addCase(generateProblem.fulfilled, (state, action) => {
      state.isGenerating = false;
      state.currentProblem = action.payload;
      state.error = null;
    });
    builder.addCase(generateProblem.rejected, (state, action) => {
      state.isGenerating = false;
      state.error = action.payload as string;
    });

    // Save attempt cases
    builder.addCase(saveAttempt.pending, (state) => {
      state.isSavingAttempt = true;
      state.error = null;
    });
    builder.addCase(saveAttempt.fulfilled, (state) => {
      state.isSavingAttempt = false;
      state.error = null;
    });
    builder.addCase(saveAttempt.rejected, (state, action) => {
      state.isSavingAttempt = false;
      state.error = action.payload as string;
    });

    // Load progress cases
    builder.addCase(loadProgress.pending, (state) => {
      state.isLoadingProgress = true;
      state.error = null;
    });
    builder.addCase(loadProgress.fulfilled, (state, action) => {
      state.isLoadingProgress = false;
      state.userProgress = action.payload;
      state.error = null;
    });
    builder.addCase(loadProgress.rejected, (state, action) => {
      state.isLoadingProgress = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  selectFocusArea,
  selectDifficulty,
  toggleHints,
  toggleSolution,
  clearError,
  resetProblem,
} = leetMasterSlice.actions;

export default leetMasterSlice.reducer;
