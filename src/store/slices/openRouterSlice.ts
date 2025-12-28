import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StyleGuide } from './templatesSlice';

// Prompt enhancement types
export interface PromptEnhancement {
  id: string;
  user_id: string;
  original_prompt: string;
  enhanced_prompt: string;
  suggestions: {
    enhanced_prompt: string;
    improvements: string[];
    suggestions: string[];
  };
  accepted: boolean;
  created_at: string;
}

export interface EnhancementResult {
  original_prompt: string;
  enhanced_prompt: string;
  improvements: string[];
  suggestions: string[];
  style_guide: {
    id: string;
    name: string;
  } | null;
  enhancement_id?: string;
}

export interface OpenRouterState {
  styleGuides: StyleGuide[];
  selectedStyleGuide: StyleGuide | null;
  currentPrompt: string;
  enhancementResult: EnhancementResult | null;
  enhancementHistory: PromptEnhancement[];
  isEnhancing: boolean;
  isLoadingStyleGuides: boolean;
  error: string | null;
}

const initialState: OpenRouterState = {
  styleGuides: [],
  selectedStyleGuide: null,
  currentPrompt: '',
  enhancementResult: null,
  enhancementHistory: [],
  isEnhancing: false,
  isLoadingStyleGuides: false,
  error: null,
};

export const openRouterSlice = createSlice({
  name: 'openRouter',
  initialState,
  reducers: {
    setStyleGuides: (state, action: PayloadAction<StyleGuide[]>) => {
      state.styleGuides = action.payload;
      state.isLoadingStyleGuides = false;
      state.error = null;
    },

    setSelectedStyleGuide: (state, action: PayloadAction<StyleGuide | null>) => {
      state.selectedStyleGuide = action.payload;
    },

    setCurrentPrompt: (state, action: PayloadAction<string>) => {
      state.currentPrompt = action.payload;
    },

    setEnhancementResult: (state, action: PayloadAction<EnhancementResult | null>) => {
      state.enhancementResult = action.payload;
      state.isEnhancing = false;
    },

    addEnhancementToHistory: (state, action: PayloadAction<PromptEnhancement>) => {
      state.enhancementHistory.unshift(action.payload);
    },

    setEnhancementHistory: (state, action: PayloadAction<PromptEnhancement[]>) => {
      state.enhancementHistory = action.payload;
    },

    acceptEnhancement: (state) => {
      if (state.enhancementResult) {
        state.currentPrompt = state.enhancementResult.enhanced_prompt;
      }
    },

    clearEnhancementResult: (state) => {
      state.enhancementResult = null;
    },

    setIsEnhancing: (state, action: PayloadAction<boolean>) => {
      state.isEnhancing = action.payload;
    },

    setIsLoadingStyleGuides: (state, action: PayloadAction<boolean>) => {
      state.isLoadingStyleGuides = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isEnhancing = false;
      state.isLoadingStyleGuides = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    resetPromptState: (state) => {
      state.currentPrompt = '';
      state.enhancementResult = null;
      state.error = null;
    },
  },
});

export const {
  setStyleGuides,
  setSelectedStyleGuide,
  setCurrentPrompt,
  setEnhancementResult,
  addEnhancementToHistory,
  setEnhancementHistory,
  acceptEnhancement,
  clearEnhancementResult,
  setIsEnhancing,
  setIsLoadingStyleGuides,
  setError,
  clearError,
  resetPromptState,
} = openRouterSlice.actions;

export default openRouterSlice.reducer;
