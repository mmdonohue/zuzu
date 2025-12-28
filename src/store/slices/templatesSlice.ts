import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Template variable type
export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  required: boolean;
  default?: string | number;
  options?: string[];
}

// Style guide type
export interface StyleGuide {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  temperature: number;
  created_at: string;
  active: boolean;
}

// Template type
export interface Template {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  category: 'code' | 'content' | 'analysis' | 'creative' | 'custom';
  content: string;
  variables: TemplateVariable[];
  style_guide_id: string | null;
  style_guides?: StyleGuide;
  is_public: boolean;
  is_system: boolean;
  tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
  active: boolean;
}

export interface TemplatesState {
  templates: Template[];
  selectedTemplate: Template | null;
  filters: {
    category: string | null;
    tag: string | null;
    search: string | null;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: TemplatesState = {
  templates: [],
  selectedTemplate: null,
  filters: {
    category: null,
    tag: null,
    search: null,
  },
  isLoading: false,
  error: null,
};

export const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setTemplates: (state, action: PayloadAction<Template[]>) => {
      state.templates = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    setSelectedTemplate: (state, action: PayloadAction<Template | null>) => {
      state.selectedTemplate = action.payload;
    },

    addTemplate: (state, action: PayloadAction<Template>) => {
      state.templates.unshift(action.payload);
    },

    updateTemplate: (state, action: PayloadAction<Template>) => {
      const index = state.templates.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.templates[index] = action.payload;
      }
      if (state.selectedTemplate?.id === action.payload.id) {
        state.selectedTemplate = action.payload;
      }
    },

    removeTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter(t => t.id !== action.payload);
      if (state.selectedTemplate?.id === action.payload) {
        state.selectedTemplate = null;
      }
    },

    incrementTemplateUsage: (state, action: PayloadAction<string>) => {
      const template = state.templates.find(t => t.id === action.payload);
      if (template) {
        template.usage_count += 1;
      }
    },

    setFilterCategory: (state, action: PayloadAction<string | null>) => {
      state.filters.category = action.payload;
    },

    setFilterTag: (state, action: PayloadAction<string | null>) => {
      state.filters.tag = action.payload;
    },

    setFilterSearch: (state, action: PayloadAction<string | null>) => {
      state.filters.search = action.payload;
    },

    clearFilters: (state) => {
      state.filters = {
        category: null,
        tag: null,
        search: null,
      };
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setTemplates,
  setSelectedTemplate,
  addTemplate,
  updateTemplate,
  removeTemplate,
  incrementTemplateUsage,
  setFilterCategory,
  setFilterTag,
  setFilterSearch,
  clearFilters,
  setLoading,
  setError,
  clearError,
} = templatesSlice.actions;

export default templatesSlice.reducer;
