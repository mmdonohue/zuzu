import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  fetchTemplates,
  fetchTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  trackTemplateUsage,
} from "../services/api";
import {
  setTemplates,
  setSelectedTemplate,
  addTemplate,
  updateTemplate as updateTemplateInStore,
  removeTemplate,
  incrementTemplateUsage,
  setLoading,
  setError,
} from "../store/slices/templatesSlice";
import type {
  Template,
  TemplateVariable,
} from "../store/slices/templatesSlice";

// Query keys
export const templateKeys = {
  all: ["templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  list: (filters?: { category?: string; tag?: string; search?: string }) =>
    [...templateKeys.lists(), filters] as const,
  details: () => [...templateKeys.all, "detail"] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

// Hook to fetch all templates with optional filters
export const useTemplates = (filters?: {
  category?: string;
  tag?: string;
  search?: string;
}) => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: templateKeys.list(filters),
    queryFn: async () => {
      dispatch(setLoading(true));
      try {
        const result = await fetchTemplates(filters);
        dispatch(setTemplates(result.data));
        return result.data as Template[];
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to fetch templates";
        dispatch(setError(message));
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch a single template by ID
export const useTemplate = (id: string) => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: async () => {
      try {
        const result = await fetchTemplateById(id);
        dispatch(setSelectedTemplate(result.data));
        return result.data as Template;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to fetch template";
        dispatch(setError(message));
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to create a new template
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: (result) => {
      const template = result.data as Template;
      dispatch(addTemplate(template));
      // Invalidate all template lists to refetch
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
    onError: (error: Error) => {
      dispatch(setError(error.message));
    },
  });
};

// Hook to update a template
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        name?: string;
        description?: string;
        category?: string;
        content?: string;
        variables?: TemplateVariable[];
        style_guide_id?: string;
        is_public?: boolean;
        tags?: string[];
        active?: boolean;
      };
    }) => updateTemplate(id, updates),
    onSuccess: (result, variables) => {
      const template = result.data as Template;
      dispatch(updateTemplateInStore(template));
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: templateKeys.detail(variables.id),
      });
    },
    onError: (error: Error) => {
      dispatch(setError(error.message));
    },
  });
};

// Hook to delete a template
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (_, id) => {
      dispatch(removeTemplate(id));
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.removeQueries({ queryKey: templateKeys.detail(id) });
    },
    onError: (error: Error) => {
      dispatch(setError(error.message));
    },
  });
};

// Hook to track template usage
export const useTrackTemplateUsage = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({
      templateId,
      modelUsed,
    }: {
      templateId: string;
      modelUsed?: string;
    }) => trackTemplateUsage(templateId, modelUsed),
    onSuccess: (_, variables) => {
      dispatch(incrementTemplateUsage(variables.templateId));
      // Update the template detail cache
      queryClient.invalidateQueries({
        queryKey: templateKeys.detail(variables.templateId),
      });
    },
    onError: (error: Error) => {
      // Don't show error for usage tracking failures
      console.error("Failed to track template usage:", error);
    },
  });
};
