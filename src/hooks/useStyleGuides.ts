import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { fetchStyleGuides, fetchStyleGuideById } from '../services/api';
import {
  setStyleGuides,
  setSelectedStyleGuide,
  setIsLoadingStyleGuides,
  setError,
} from '../store/slices/openRouterSlice';
import type { StyleGuide } from '../store/slices/templatesSlice';

// Query keys
export const styleGuideKeys = {
  all: ['styleGuides'] as const,
  lists: () => [...styleGuideKeys.all, 'list'] as const,
  list: () => [...styleGuideKeys.lists()] as const,
  details: () => [...styleGuideKeys.all, 'detail'] as const,
  detail: (id: string) => [...styleGuideKeys.details(), id] as const,
};

// Hook to fetch all style guides
export const useStyleGuides = () => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: styleGuideKeys.list(),
    queryFn: async () => {
      dispatch(setIsLoadingStyleGuides(true));
      try {
        const result = await fetchStyleGuides();
        dispatch(setStyleGuides(result.data));
        return result.data as StyleGuide[];
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch style guides';
        dispatch(setError(message));
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - style guides rarely change
  });
};

// Hook to fetch a single style guide by ID
export const useStyleGuide = (id: string) => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: styleGuideKeys.detail(id),
    queryFn: async () => {
      try {
        const result = await fetchStyleGuideById(id);
        dispatch(setSelectedStyleGuide(result.data));
        return result.data as StyleGuide;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch style guide';
        dispatch(setError(message));
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
