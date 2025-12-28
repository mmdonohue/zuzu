import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { enhancePrompt } from '../services/api';
import {
  setEnhancementResult,
  addEnhancementToHistory,
  setIsEnhancing,
  setError,
} from '../store/slices/openRouterSlice';
import type { EnhancementResult, PromptEnhancement } from '../store/slices/openRouterSlice';

// Hook to enhance a prompt
export const usePromptEnhancement = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (data: {
      prompt: string;
      style_guide_id?: string;
      context?: string;
    }) => {
      dispatch(setIsEnhancing(true));
      return enhancePrompt(data);
    },
    onSuccess: (result) => {
      const enhancementResult = result.data as EnhancementResult;
      dispatch(setEnhancementResult(enhancementResult));

      // Add to history if we have an enhancement_id
      if (enhancementResult.enhancement_id) {
        const historyEntry: PromptEnhancement = {
          id: enhancementResult.enhancement_id,
          user_id: '', // Will be populated from backend
          original_prompt: enhancementResult.original_prompt,
          enhanced_prompt: enhancementResult.enhanced_prompt,
          suggestions: {
            enhanced_prompt: enhancementResult.enhanced_prompt,
            improvements: enhancementResult.improvements,
            suggestions: enhancementResult.suggestions,
          },
          accepted: false,
          created_at: new Date().toISOString(),
        };
        dispatch(addEnhancementToHistory(historyEntry));
      }
    },
    onError: (error: Error) => {
      dispatch(setIsEnhancing(false));
      dispatch(setError(error.message));
    },
  });
};
