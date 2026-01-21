// src/pages/OpenRouter.tsx
import { useRef, useEffect, useState, SyntheticEvent } from "react";
import { createParser, EventSourceParserEvent } from "eventsource-parser";
import {
  get_encoding,
  encoding_for_model,
  Tiktoken,
  TiktokenModel,
} from "tiktoken";
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  ListSubheader,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  Typography,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  Collapse,
  Rating,
} from "@mui/material";

import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  RefreshRounded,
  DeleteOutlined,
  RestartAltOutlined,
  CancelOutlined,
  ContentCopyOutlined,
  SettingsOutlined,
  Add as AddIcon,
  AutoFixHigh as EnhanceIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
import { format, max, set } from "date-fns";
import { on } from "events";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/api";
import { fetchWithCsrf } from "@/services/api";
import {
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "@/hooks/useTemplates";
import { useSnackbar } from "@/contexts/SnackbarContext";
import TemplateLibrary from "@/components/TemplateLibrary";
import TemplateForm, { TemplateFormData } from "@/components/TemplateForm";
import TemplateDetailView from "@/components/TemplateDetailView";
import PromptEnhancer from "@/components/PromptEnhancer";
import TemplateVariableSubstitution from "@/components/TemplateVariableSubstitution";
import OpenRouterDashboard from "@/components/OpenRouterDashboard";
import OpenRouterActivity from "@/components/OpenRouterActivity";
import type { Template } from "@/store/slices/templatesSlice";
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  DialogContentText,
} from "@mui/material";
import Zoom from "@mui/material/Zoom";
import { BACKGROUND_COLORS } from "@/context/BackgroundContext";
import { ThemeProvider } from '@mui/material/styles';
import { COLORS, darkTheme } from "@/styles/themes";

// Dialog Paper styling for transparent white backgrounds
const dialogPaperProps = {
  sx: {
    backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent",
    border: "1px solid #fff",
    color: "#fff",
  },
};

// Define types
type Conversation = {
  id: string;
  created: string;
  model: string;
  prompt: string;
  response: string;
  response_time: number;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  active: boolean;
  template_id?: string | null;
  tags?: string[];
  prompt_templates?: {
    name: string;
    category: string;
  };
};

type OpenRouterGenerationData = {
  data?: {
    latency?: number;
    moderation_latency?: number;
    generation_time?: number;
    tokens_prompt?: number;
    tokens_completion?: number;
    total_cost?: number;
  };
} | null;

// Updated types for OpenRouter API models response
type ModelPricing = {
  prompt: string;
  completion: string;
  image: string;
  request: string;
  input_cache_read: string;
  input_cache_write: string;
  web_search: string;
  internal_reasoning: string;
};

type ModelArchitecture = {
  input_modalities: string[];
  output_modalities: string[];
  tokenizer: string;
};

type ModelProvider = {
  is_moderated: boolean;
};

type ModelLimits = {
  [key: string]: string;
};

type OpenRouterModel = {
  id: string;
  name: string;
  created: number;
  description: string;
  architecture: ModelArchitecture;
  top_provider: ModelProvider;
  pricing: ModelPricing;
  context_length: number;
  per_request_limits: ModelLimits;
};

const model_default = "xiaomi/mimo-v2-flash:free";
const model_temp_min = 0.0;
const model_temp_max = 1.0;
const model_temp_step = 0.1;
const model_step_marks = 0.5;
const model_encoding_default = "o200k_base";
const max_context_length = 2000000;
const min_context_length = 1000;
const context_adjust = 1.2;
const token_adjust = 1.2;
const max_token_display = 1000000;
const min_token_display = 1000;
const token_step = 10000;

function displayTokenCost(tokens: number): string {
  if (tokens < max_token_display) {
    return `${(tokens / min_token_display).toFixed(0)}K`;
  } else {
    return `${(tokens / max_token_display).toFixed(1)}M`;
  }
}

const OpenRouterComponent = () => {
  // Get current user from auth context
  const { user } = useAuth();

  // Snackbar for notifications
  const { showSnackbar } = useSnackbar();

  // Template mutations
  const createTemplateMutation = useCreateTemplate();
  const updateTemplateMutation = useUpdateTemplate();
  const deleteTemplateMutation = useDeleteTemplate();

  // remove later

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // State for tabs
  const [tabValue, setTabValue] = useState(0);

  // Add new state for models
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);

  const handleMenuOpen = (event: SyntheticEvent<Element>) => {
    setAnchorEl(event.currentTarget as HTMLElement);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Helper function to check if a model is free
  const isModelFree = (model: OpenRouterModel): boolean => {
    // Consider a model free if both prompt and completion prices are 0
    return (
      parseFloat(model.pricing.prompt) === 0 &&
      parseFloat(model.pricing.completion) === 0
    );
  };

  const convert_milli = 1000;
  // Format creation date from timestamp
  const formatCreationDate = (timestamp: number): string => {
    const date = new Date(timestamp * convert_milli); // Convert seconds to milliseconds
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Fetch models from OpenRouter API
  const fetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models");
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();

      // Sort models: first by free status, then by creation date (newest first)
      const sortedModels = [...(data.data || [])].sort((a, b) => {
        const aFree = isModelFree(a);
        const bFree = isModelFree(b);

        // First sort by free status
        if (aFree && !bFree) return -1;
        if (!aFree && bFree) return 1;

        // Then sort by creation date (newer first)
        return b.created - a.created;
      });
      console.log("Fetched and sorted models:", sortedModels);
      setAvailableModels(sortedModels);
      if (model_default) {
        let modelSelectedModel = sortedModels.find(
          (m) => m.id === model_default,
        );
        console.log(
          "Default model context length:",
          modelSelectedModel ? modelSelectedModel.context_length : "not found",
        );
        setMaxTokens(
          modelSelectedModel
            ? modelSelectedModel.context_length
            : max_context_length,
        );
        setCurrTokens(
          modelSelectedModel
            ? modelSelectedModel.context_length * 0.8
            : max_context_length * 0.8,
        );
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Load models on component mount
  useEffect(() => {
    fetchModels();
  }, []);

  // State for OpenRouter API
  const apiKey = process.env.REACT_APP_ZUZU_OPENROUTER_KEY;
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState("");
  const [model, setModel] = useState(model_default);
  const [modelObject, setModelObject] = useState<OpenRouterModel | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [controller, setController] = useState<AbortController | null>(null);
  const [promptTokens, setPromptTokens] = useState<number>(0);

  // State for advanced parameters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000000);
  const [currTokens, setCurrTokens] = useState(1600000);
  const [systemMessage, setSystemMessage] = useState("");

  // State for conversation history
  const [historyTimeframe, setHistoryTimeframe] = useState<
    "day" | "week" | "all"
  >("day");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // State for current template (for tracking usage)
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);

  // State for OpenRouter generation ID
  const [generationId, setGenerationId] = useState<string | null>(null);

  // State for event rating
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentRating, setCurrentRating] = useState<number>(-1);

  // Dialog states
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [enhancerOpen, setEnhancerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(
    null,
  );
  const [variableSubOpen, setVariableSubOpen] = useState(false);
  const [templateForSubstitution, setTemplateForSubstitution] =
    useState<Template | null>(null);
  const [dashboardVisible, setDashboardVisible] = useState(false);

  // Update token count whenever prompt changes
  useEffect(() => {
    if (prompt) {
      const encoding = get_encoding(model_encoding_default);
      setPromptTokens(encoding.encode(prompt).length);
      encoding.free();
    } else {
      setPromptTokens(0);
    }
  }, [prompt]);

  // Define columns for DataGrid
  const columns: GridColDef[] = [
    {
      field: "created",
      headerName: "Date",
      width: 80,
      valueFormatter: (value: string | Date | number | undefined) => {
        if (!value) return "N/A";
        try {
          return format(new Date(value), "MMM d, yy h:mm a");
        } catch (error) {
          console.error("Error formatting date:", error, value);
          return String(value);
        }
      },
    },
    {
      field: "user_id",
      headerName: "User",
      width: 60,
      renderCell: (params: GridRenderCellParams) => {
        const firstName = params.row.first_name;
        const lastName = params.row.last_name;
        const userId = params.value;

        // Display full name if available, otherwise show user_id
        const displayText =
          firstName && lastName
            ? `${firstName[0]}${lastName[0]}`
            : userId || "N/A";

        return (
          <Typography sx={{ fontSize: "0.875rem", color: "#fff" }}>
            {displayText}
          </Typography>
        );
      },
    },
    {
      field: "model",
      headerName: "Model",
      width: 180,
      renderCell: (params: GridRenderCellParams) => {
        const modelName = params.value.split("/").pop();
        return (
          <Chip
            size="small"
            label={modelName}
            sx={{
              color: "#fff",
              border: "1px solid #fff",
              borderRadius: "5px",
            }}
            onClick={() => {
              setModel(modelName);
              setTabValue(0);
            }}
          />
        );
      },
    },
    {
      field: "template_id",
      headerName: "Template",
      width: 60,
      renderCell: (params: GridRenderCellParams) => {
        const template = params.row.prompt_templates;
        if (!template)
          return (
            <Typography variant="caption" sx={{ color: "#ffffff99" }}>
              -
            </Typography>
          );

        const categoryColors: Record<
          string,
          "primary" | "secondary" | "success" | "warning" | "info"
        > = {
          code: "primary",
          content: "info",
          analysis: "secondary",
          creative: "warning",
          custom: "success",
        };

        return (
          <Chip
            size="small"
            label={template.name}
            color={categoryColors[template.category] || "default"}
            variant="outlined"
          />
        );
      },
    },
    {
      field: "prompt",
      headerName: "Prompt",
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const text = params.value as string;
        return (
          <Tooltip
            title={text.split("\n").join("<br>")}
            placement="right"
            slots={{
              transition: Zoom,
            }}
            slotProps={{
              tooltip: {
                sx: {
                  color: "#fff",
                  backgroundColor: "#000",
                  padding: 2, // 'p: 1' shorthand works here too
                },
              },
            }}
          >
            <Typography
              sx={{
                color: "#fff",
                lineHeight: 1.2,
                fontSize: "12px",
                maxWidth: 300,
                backgroundColor: "#0000003f",
                p: "5px",
                borderRadius: "5px",
              }}
            >
              {text.length > 60 ? text.substring(0, 60) + "..." : text}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      field: "response",
      headerName: "Response",
      width: 200,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const text = params.value as string;
        return (
          <Tooltip
            title={text.split("\n").join("<br>")}
            placement="right"
            slots={{
              transition: Zoom,
            }}
            slotProps={{
              tooltip: {
                sx: {
                  color: "#fff",
                  backgroundColor: "#000000",
                  padding: 2, // 'p: 1' shorthand works here too
                },
              },
            }}
          >
            <Typography
              sx={{
                color: "#fff",
                lineHeight: 1.2,
                fontSize: "12px",
                maxWidth: 300,
                backgroundColor: "#0000003f",
                p: "5px",
                borderRadius: "5px",
              }}
            >
              {text.length > 100 ? text.substring(0, 100) + "..." : text}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      field: "response_time",
      headerName: "Time",
      width: 60,
      valueFormatter: (value: number | undefined) => {
        return value ? value.toFixed(2) : "N/A";
      },
    },
    {
      field: "rating",
      headerName: "Rating",
      width: 140,
      renderCell: (params: GridRenderCellParams) => {
        const rating = params.value as number;
        const eventId = params.row.id;

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Rating
              sx={{ "& .MuiRating-iconEmpty": { color: "#ffffff99" } }}
              value={rating === -1 ? null : rating}
              onChange={(_event, newValue) => {
                if (newValue !== null && eventId) {
                  submitRating(eventId, newValue);
                }
              }}
              size="small"
            />
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Use this prompt">
            <IconButton
              size="small"
              onClick={() => reloadPrompt(params.row)}
              color="primary"
            >
              <RestartAltOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Copy response">
            <IconButton size="small" onClick={() => copyResponse(params.row)}>
              <ContentCopyOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove from history">
            <IconButton
              size="small"
              onClick={() => deactivateConversation(params.row.id)}
              color="error"
            >
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Load conversation history
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await apiFetch(
        `/api/openrouter/history?timeframe=${historyTimeframe}`,
      );
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Save conversation to Supabase
  const saveConversation = async (
    model: string,
    prompt: string,
    response: string,
    responseTime: number,
    generationId: string | null = null,
    generationData: OpenRouterGenerationData = null,
    isRetry = false,
  ) => {
    const requestBody = {
      model,
      prompt,
      response,
      response_time: responseTime,
      user_id: user?.id || null,
      template_id: currentTemplate?.id || null,
      tags: currentTemplate?.tags || [],
      generation_id: generationId,
      // Extract generation data fields if available
      latency: generationData?.data?.latency || null,
      moderation_latency: generationData?.data?.moderation_latency || null,
      generation_time: generationData?.data?.generation_time || null,
      tokens_prompt: generationData?.data?.tokens_prompt || null,
      tokens_completion: generationData?.data?.tokens_completion || null,
      total_cost: generationData?.data?.total_cost || null,
    };

    const saveResponse = await fetchWithCsrf("/api/openrouter/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!saveResponse.ok) {
      const errorData = await saveResponse.json().catch(() => null);

      // If auth token expired, refresh and retry once
      if (saveResponse.status === 401 && !isRetry) {
        console.log("Auth token expired, refreshing...");

        // Call refresh endpoint
        const refreshResponse = await fetch("/api/auth/refresh-token", {
          method: "POST",
          credentials: "include",
        });

        if (refreshResponse.ok) {
          console.log("Token refreshed, retrying save...");
          const AUTH_RETRY_DELAY_MS = 100;
          await new Promise((resolve) =>
            setTimeout(resolve, AUTH_RETRY_DELAY_MS),
          );

          // Retry with refreshed token
          return saveConversation(
            model,
            prompt,
            response,
            responseTime,
            generationId,
            generationData,
            true,
          );
        } else {
          throw new Error(
            "Session expired. Please refresh the page and try again.",
          );
        }
      }

      // If CSRF validation failed, retry once with a fresh token
      if (
        saveResponse.status === 403 &&
        errorData?.code === "CSRF_VALIDATION_FAILED"
      ) {
        console.log("CSRF token failed, retrying with fresh token...");

        const CSRF_RETRY_DELAY_MS = 100;
        await new Promise((resolve) =>
          setTimeout(resolve, CSRF_RETRY_DELAY_MS),
        );

        // Retry the request
        const retryResponse = await fetchWithCsrf("/api/openrouter/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!retryResponse.ok) {
          throw new Error(
            `Failed to save conversation after retry: ${retryResponse.statusText}`,
          );
        }

        const retryData = await retryResponse.json();
        // Store event ID and reset rating for new event
        setCurrentEventId(retryData.id);
        setCurrentRating(-1);
        return; // Success on retry
      }

      throw new Error(
        `Failed to save conversation: ${saveResponse.statusText}`,
      );
    }

    // Capture the saved event data to get the ID
    const savedEvent = await saveResponse.json();

    // Verify we got an ID back
    if (!savedEvent?.id) {
      console.error("Save response missing ID:", savedEvent);
      throw new Error("Failed to save: No event ID returned from server");
    }

    // Store event ID and reset rating for new event
    setCurrentEventId(savedEvent.id);
    setCurrentRating(-1);

    // Clear current template after saving
    setCurrentTemplate(null);
    // Reload history if we're on the history tab
    if (tabValue === 1) {
      loadHistory();
    }
  };

  // Deactivate a conversation
  const deactivateConversation = async (id: string) => {
    try {
      await apiFetch(`/api/openrouter/status/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      // Update the local state to reflect the change
      setConversations((prev) => prev.filter((conv) => conv.id !== id));
    } catch (error) {
      console.error("Error deactivating conversation:", error);
    }
  };

  // Submit event rating
  const submitRating = async (
    eventId: string,
    rating: number,
    isRetry = false,
  ) => {
    try {
      const response = await fetchWithCsrf(
        `/api/openrouter/events/${eventId}/rating`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // If auth token expired, refresh and retry once
        if (response.status === 401 && !isRetry) {
          console.log("Auth token expired, refreshing...");

          try {
            // Call refresh endpoint
            const refreshResponse = await fetch("/api/auth/refresh-token", {
              method: "POST",
              credentials: "include",
            });

            if (refreshResponse.ok) {
              console.log("Token refreshed, retrying rating submission...");
              const AUTH_RETRY_DELAY_MS = 100;
              await new Promise((resolve) =>
                setTimeout(resolve, AUTH_RETRY_DELAY_MS),
              );

              // Retry with refreshed token
              return submitRating(eventId, rating, true);
            } else {
              throw new Error("Failed to refresh auth token");
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            throw new Error(
              "Session expired. Please refresh the page and try again.",
            );
          }
        }

        // If CSRF validation failed, retry once with a fresh token
        if (
          response.status === 403 &&
          errorData?.code === "CSRF_VALIDATION_FAILED"
        ) {
          console.log("CSRF token failed, retrying with fresh token...");

          const CSRF_RETRY_DELAY_MS = 100;
          await new Promise((resolve) =>
            setTimeout(resolve, CSRF_RETRY_DELAY_MS),
          );

          const retryResponse = await fetchWithCsrf(
            `/api/openrouter/events/${eventId}/rating`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rating }),
            },
          );

          if (!retryResponse.ok) {
            throw new Error(
              `Failed to update rating after retry: ${retryResponse.statusText}`,
            );
          }

          showSnackbar("Rating saved successfully!", "success");
          setCurrentRating(rating);
          // Refresh history to show updated rating
          if (tabValue === 1) {
            loadHistory();
          }
          return;
        }

        throw new Error(`Failed to update rating: ${response.statusText}`);
      }

      showSnackbar("Rating saved successfully!", "success");
      setCurrentRating(rating);
      // Refresh history to show updated rating
      if (tabValue === 1) {
        loadHistory();
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      showSnackbar(
        error instanceof Error ? error.message : "Failed to save rating",
        "error",
      );
    }
  };

  // Reload a prompt from history
  const reloadPrompt = (conversation: Conversation) => {
    setTabValue(0); // Switch to the chat tab
    setPrompt(
      prompt ? prompt + "\n" + conversation.prompt : conversation.prompt,
    );
    // setModel(conversation.model);
  };

  // Copy response to clipboard
  const copyResponse = (conversation: Conversation) => {
    navigator.clipboard.writeText(conversation.response);
  };

  // Load history when tab changes or timeframe changes
  useEffect(() => {
    if (tabValue === 1) {
      loadHistory();
    }
  }, [tabValue, historyTimeframe]);

  // Validate API key on component mount
  useEffect(() => {
    if (!apiKey) {
      setApiKeyError(
        "API key is missing. Please check your environment variables.",
      );
    } else if (apiKey === "undefined" || apiKey === "null") {
      setApiKeyError(
        `API key has invalid value: "${apiKey}". Check your .env file and webpack configuration.`,
      );
    } else {
      // Log only a portion of the key for debugging (first 4 chars)
      const keyPreview =
        apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
      // console.log(`API key loaded: ${keyPreview}`);
      setApiKeyError(null);
    }
  }, [apiKey]);

  // Cancel ongoing streaming
  const cancelStreaming = () => {
    if (controller) {
      controller.abort();
      setController(null);
      setIsStreaming(false);
    }
  };

  // Add message to conversation history
  const addMessage = (role: string, content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  // Clear conversation (all messages and results)
  const clearConversation = () => {
    setMessages([]);
    setResults("");
    setPrompt("");
  };

  // Clear only the response, keep the prompt
  const clearResponse = () => {
    setMessages([]);
    setResults("");
  };

  // Stream completion from OpenRouter
  async function streamCompletion() {
    if (!prompt.trim()) return;
    if (!apiKey) {
      setApiKeyError("Cannot send request: API key is missing");
      return;
    }

    // Create an AbortController for cancellation
    const abortController = new AbortController();
    setController(abortController);

    setIsStreaming(true);
    setResults(""); // Clear previous results

    // Start timer for response time tracking
    const startTime = Date.now();

    // Prepare conversation messages including system message if provided
    const conversationMessages = [
      ...(systemMessage ? [{ role: "system", content: systemMessage }] : []),
      // Include previous messages to maintain context
      ...messages,
      // Add the new user message
      { role: "user", content: prompt },
    ];

    // Add the user message to the conversation history
    addMessage("user", prompt);

    try {
      // console.log(`Sending request to OpenRouter with model: ${model}`, 'Prompt:', prompt);

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin, // Required by OpenRouter
          },
          body: JSON.stringify({
            model: model,
            messages: conversationMessages,
            stream: true,
            temperature: temperature,
            max_tokens: currTokens - Math.floor(promptTokens * token_adjust), // Adjust max tokens based on prompt size
          }),
          signal: abortController.signal, // For cancellation
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}. Details: ${errorText}`,
        );
      }

      const parser = createParser({
        onEvent: (event: EventSourceParserEvent) => {
          // console.log('Received event:', event);
          // More permissive check - just make sure we have data to parse
          if (event.type === "event" && "data" in event) {
            try {
              // Handle [DONE] marker if it exists
              if (event.data === "[DONE]") {
                // console.log('Stream completed with [DONE] marker');
                return;
              }

              const json = JSON.parse(event.data);
              // console.log('Parsed JSON:', json);

              // Try different possible formats
              const content =
                json.choices?.[0]?.delta?.content || // OpenAI-style format
                json.content || // Simple format
                json.text || // Alternative format
                json.completion || // Another alternative
                "";

              if (content) {
                // console.log('Content received:', content);
                setResults((prev) => prev + content);
              }
            } catch (e) {
              console.error("Error parsing streaming response:", e);
            }
          }
        },
      });

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          let buffer = "";
          let fullResponse = "";
          let capturedGenerationId: string | null = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // console.log('Stream reading complete');
              break;
            }

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            // console.log('Received chunk:', chunk);

            // Add to buffer and process
            buffer += chunk;

            // Split on double newlines which typically separate SSE events
            const parts = buffer.split("\n\n");
            buffer = parts.pop() || "";

            for (const part of parts) {
              if (part.trim()) {
                // Handle each event
                const eventData = part.replace(/^data: /, "").trim();
                if (eventData) {
                  // console.log('Processing event data:', eventData);
                  if (eventData === "[DONE]") {
                    // console.log('Stream completed with [DONE] marker');
                    continue;
                  }
                  try {
                    const json = JSON.parse(eventData);

                    // Capture generation ID from the first chunk
                    if (!capturedGenerationId && json.id) {
                      capturedGenerationId = json.id;
                      setGenerationId(json.id);
                    }

                    const content = json.choices?.[0]?.delta?.content || "";
                    if (content) {
                      fullResponse += content;
                      setResults(fullResponse);
                    }
                  } catch (e) {
                    console.error("Error parsing JSON:", e);
                  }
                }
              }
            }
          }

          // Calculate response time
          const responseTime = (Date.now() - startTime) / convert_milli;

          // Add assistant message to conversation history
          addMessage("assistant", fullResponse);

          // Fetch detailed generation data if we have a generation ID
          let generationData = null;
          if (capturedGenerationId) {
            try {
              // Wait for OpenRouter to process the generation data
              console.log("Waiting for generation data to be available...");
              await new Promise((resolve) => setTimeout(resolve, 1000));

              const genResponse = await fetch(
                `https://openrouter.ai/api/v1/generation?id=${capturedGenerationId}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                  },
                },
              );

              if (genResponse.ok) {
                generationData = await genResponse.json();
                console.log("Generation data:", generationData);
              } else {
                console.warn(
                  "Generation data not available:",
                  genResponse.status,
                );
              }
            } catch (error) {
              console.error("Error fetching generation data:", error);
              // Continue even if this fails
            }
          }

          // Save the conversation to Supabase
          console.log("Saving conversation:", {
            model,
            prompt: prompt.substring(0, 50),
            responseLength: fullResponse.length,
          });
          try {
            await saveConversation(
              model,
              prompt,
              fullResponse,
              responseTime,
              capturedGenerationId,
              generationData,
            );
            console.log("Conversation saved successfully");
          } catch (saveError) {
            console.error("Failed to save conversation:", saveError);
            showSnackbar(
              saveError instanceof Error
                ? saveError.message
                : "Failed to save conversation",
              "error",
            );
            // Don't set event ID if save failed
            setCurrentEventId(null);
            setCurrentRating(-1);
          }

          // Keep the prompt so it can be reused with different models
          // Users can manually clear it if needed with "Clear All" button
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            // console.log('Stream reading aborted by user');
          } else {
            console.error("Error reading stream:", error);
            throw error;
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Streaming error:", error);
        setResults((prev) => prev + "\n\nError: " + (error as Error).message);
      }
    } finally {
      setIsStreaming(false);
      setController(null);
    }
  }

  // Handle template selection from library
  const handleTemplateSelect = (template: Template) => {
    // Store the template for tracking
    setCurrentTemplate(template);
    // Switch to chat tab
    setTabValue(0);

    // Check if template has variables that need substitution
    if (template.variables && template.variables.length > 0) {
      // Open variable substitution dialog
      setTemplateForSubstitution(template);
      setVariableSubOpen(true);
    } else {
      // No variables, directly set the template content
      setPrompt(template.content);
    }
  };

  // Handle variable substitution completion
  const handleVariableSubstitutionApply = (substitutedContent: string) => {
    setPrompt(substitutedContent);
    setVariableSubOpen(false);
    setTemplateForSubstitution(null);
  };

  const handleVariableSubstitutionClose = () => {
    setVariableSubOpen(false);
    setTemplateForSubstitution(null);
  };

  // Template form handlers
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateFormOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setTemplateFormOpen(true);
  };

  const handleTemplateFormSubmit = async (formData: TemplateFormData) => {
    setIsSubmittingTemplate(true);
    try {
      if (editingTemplate) {
        // Update existing template
        await updateTemplateMutation.mutateAsync({
          id: editingTemplate.id,
          updates: formData,
        });
        showSnackbar("Template updated successfully", "success");
      } else {
        // Create new template
        await createTemplateMutation.mutateAsync(formData);
        showSnackbar("Template created successfully", "success");
      }
      setTemplateFormOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error("Error saving template:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save template";
      showSnackbar(errorMessage, "error");
      throw error;
    } finally {
      setIsSubmittingTemplate(false);
    }
  };

  const handleTemplateFormCancel = () => {
    setTemplateFormOpen(false);
    setEditingTemplate(null);
  };

  // Delete confirmation handlers
  const handleDeleteTemplate = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplateMutation.mutateAsync(templateToDelete.id);
      showSnackbar("Template deleted successfully", "success");
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error("Error deleting template:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete template";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setTemplateToDelete(null);
  };

  // Prompt enhancer handlers
  const handleOpenEnhancer = () => {
    setEnhancerOpen(true);
  };

  const handleCloseEnhancer = () => {
    setEnhancerOpen(false);
  };

  const handleAcceptEnhancement = (enhancedPrompt: string) => {
    setPrompt(enhancedPrompt);
    setEnhancerOpen(false);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* OpenRouter API Dashboard with Toggle */}
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1,
            color: "#fff",
            backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent",
            borderRadius: 1,
            cursor: "pointer",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
          onClick={() => setDashboardVisible(!dashboardVisible)}
        >
          <Typography variant="subtitle1" fontWeight="medium">
            API Dashboard
          </Typography>
          <IconButton size="small">
            {dashboardVisible ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </Box>
        <Collapse in={dashboardVisible}>
          <OpenRouterDashboard />
        </Collapse>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: "#fff",
          backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent",
        }}
      >
        <Tab
          label="Chat"
          sx={{
            color: "#ffffff99",
            backgroundColor: "#0000002a",
            m: 0.5,
            "&.Mui-selected": {
              backgroundColor: "#ffffff34",
              color: "#fff",
              fontWeight: 600,
            },
          }}
        />
        <Tab
          label="History"
          sx={{
            color: "#ffffff99",
            backgroundColor: "#0000002a",
            m: 0.5,
            "&.Mui-selected": {
              backgroundColor: "#ffffff34",
              color: "#fff",
              fontWeight: 600,
            },
          }}
        />
        <Tab
          label="Templates"
          sx={{
            color: "#ffffff99",
            backgroundColor: "#0000002a",
            m: 0.5,
            "&.Mui-selected": {
              backgroundColor: "#ffffff34",
              color: "#fff",
              fontWeight: 600,
            },
          }}
        />
        <Tab
          label="Activity"
          sx={{
            color: "#ffffff99",
            backgroundColor: "#0000002a",
            m: 0.5,
            "&.Mui-selected": {
              backgroundColor: "#ffffff34",
              color: "#fff",
              fontWeight: 600,
            },
          }}
        />
      </Tabs>
      {/* Chat Tab */}
      {tabValue === 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {apiKeyError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiKeyError}
            </Alert>
          )}

          {/* Display conversation if there are messages */}
          {messages.length > 0 && (
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="h6">Conversation</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DeleteOutlined />}
                    onClick={clearResponse}
                  >
                    Clear Response
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<RestartAltOutlined />}
                    onClick={clearConversation}
                  >
                    Clear All
                  </Button>
                </Box>
              </Box>

              {messages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent",
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    gutterBottom
                  >
                    {msg.role === "user" ? "You" : "Assistant"}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </Typography>
                </Box>
              ))}
            </Paper>
          )}

          {/* Advanced settings */}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <SettingsOutlined
                    fontSize="small"
                    sx={{ mr: 0.5, color: "#fff" }}
                  />
                  <Typography sx={{ color: "#fff" }} variant="body2">
                    Advanced settings
                  </Typography>
                </Box>
              }
            />
          </Box>

          {showAdvanced && (
            <Paper
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 1,
                borderColor: "#fff",
                backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent",
              }}
            >
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    multiline
                    rows={2}
                    value={systemMessage}
                    onChange={(e) => setSystemMessage(e.target.value)}
                    placeholder="Optional instructions for the AI"
                    fullWidth
                    helperText="Sets the behavior and capabilities of the assistant"
                    FormHelperTextProps={{
                      style: {
                        color: "#ffffff99",
                        fontSize: "10px",
                        fontStyle: "italic",
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: "#ffffff99", // Default label color
                      },
                    }}
                    sx={{
                      color: "#ffffff99",
                      backgroundColor: "#00000044",
                      border: "1px solid #fff",
                      "& .MuiInputBase-input::placeholder": {
                        color: "#ffffff99",
                        fontStyle: "italic",
                        opacity: 1, // Fixes low opacity in Firefox
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }} mr={1}>
                  <Typography variant="body2" gutterBottom color="#fff">
                    Temperature: {temperature}
                  </Typography>
                  <Slider
                    sx={{ color: "#fff" }}
                    value={temperature}
                    onChange={(_, value) => setTemperature(value as number)}
                    min={model_temp_min}
                    max={model_temp_max}
                    step={model_temp_step}
                    valueLabelDisplay="auto"
                    marks={[
                      {
                        value: model_temp_min,
                        label: model_temp_min.toString(),
                      },
                      {
                        value: model_temp_max / 2,
                        label: (model_temp_max / 2).toString(),
                      },
                      {
                        value: model_temp_max,
                        label: model_temp_max.toString(),
                      },
                    ]}
                  />
                  <Typography variant="caption">
                    Lower for more deterministic results, higher for more
                    creative responses
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography gutterBottom color="#fff">
                    Max Tokens: <b>{displayTokenCost(maxTokens)}</b> | Current
                    Tokens: <b>{displayTokenCost(currTokens)}</b>
                  </Typography>
                  <Slider
                    sx={{ mb: 2, color: "#fff" }}
                    value={
                      currTokens ? currTokens : Math.floor(maxTokens * 0.8)
                    }
                    onChange={(_, value) => setCurrTokens(value as number)}
                    min={maxTokens / token_step}
                    max={maxTokens}
                    step={maxTokens / token_step}
                    valueLabelDisplay="auto"
                    marks={[
                      {
                        value: maxTokens / token_step,
                        label: displayTokenCost(maxTokens / token_step),
                      },
                      {
                        value: maxTokens / 2,
                        label: displayTokenCost(maxTokens / 2),
                      },
                      { value: maxTokens, label: displayTokenCost(maxTokens) },
                    ]}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Maximum length of the context (in tokens) the model can
                    handle
                  </Typography>
                </Grid>

                {/* Token Counter */}
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Token Usage
                    </Typography>
                    <Box sx={{ display: "flex", gap: 4 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Prompt Tokens
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {promptTokens.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Available Response Tokens
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {(
                            currTokens -
                            Math.floor(promptTokens * context_adjust)
                          ).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total Context Window
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                          {currTokens.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Response tokens = Context window - (Prompt tokens ×{" "}
                      {context_adjust})
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
          <TextField
            multiline
            rows={5}
            value={prompt}
            sx={{
              color: "#fff",
              borderRadius: 1,
              border: "1px solid #fff",
              "& .MuiInputBase-input::placeholder": {
                color: "#ffffff88",
                fontStyle: "italic",
                opacity: 1, // Fixes low opacity in Firefox
              },
              backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent",
              backdropFilter: "blur(2px)",
            }}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            fullWidth
            inputRef={promptRef}
          />
          <Box
            sx={{ mt: 1, mb: 2, display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              size="small"
              startIcon={<EnhanceIcon sx={{ color: "#fff" }} />}
              onClick={handleOpenEnhancer}
              disabled={!prompt.trim()}
              sx={{
                color: "#fff",
                border: "1px solid #fff",
                backgroundColor: "#ffffff44",
                "&.Mui-disabled": {
                  WebkitTextFillColor: "#ffffff88", // Forces color in all browsers
                  color: "#ffffff88", // Fallback
                },
              }}
            >
              Enhance Prompt
            </Button>
          </Box>
          <FormControl fullWidth>
            <InputLabel id="model-select-label" sx={{ color: "#fff" }}>
              Model
            </InputLabel>
            <Select
              inputRef={selectRef}
              labelId="model-select-label"
              value={model}
              label="Model"
              sx={{ backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent", color: "#fff" }}
              renderValue={(selected) => {
                // if(selected !== model){
                // console.log('Rendering selected model:', selected);
                const selectedModel = availableModels.find(
                  (m) => m.id === selected,
                );
                return selectedModel ? selectedModel.name : selected;
                // }
              }}
              onClose={() => {
                // console.log('Model select closed');
                handleMenuClose();
              }}
              onOpen={(event) => {
                // console.log('Model select opened');
                handleMenuOpen(event);
              }}
            >
              {isLoadingModels ? (
                <MenuItem disabled>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography>Loading models...</Typography>
                  </Box>
                </MenuItem>
              ) : (
                <>
                  <ListSubheader>Free Models</ListSubheader>
                  {availableModels
                    .filter((model) => isModelFree(model))
                    .map((modelOption) => (
                      <MenuItem
                        key={modelOption.id}
                        value={modelOption.id}
                        onClick={() => {
                          // console.log('Menu - selected free model:', modelOption.id);
                          let modelSelectedModel = availableModels.find(
                            (m) => m.id === modelOption.id,
                          );
                          setMaxTokens(
                            modelSelectedModel
                              ? modelSelectedModel.context_length
                              : max_context_length,
                          );
                          setCurrTokens(
                            modelSelectedModel
                              ? Math.floor(
                                  modelSelectedModel.context_length * 0.8,
                                )
                              : max_context_length,
                          );
                          setModel(modelOption.id);
                          setModelObject(modelSelectedModel || null);
                          handleMenuClose();
                        }}
                      >
                        <Box sx={{ width: "100%" }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold">
                              {modelOption.name}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatCreationDate(modelOption.created)}
                              </Typography>
                              <Chip size="small" label="Free" color="success" />
                            </Box>
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {modelOption.description.length > 100
                              ? `${modelOption.description.substring(0, 100)}...`
                              : modelOption.description}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mt: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ color: "primary.main" }}
                            >
                              Context:{" "}
                              {modelOption.context_length.toLocaleString()}{" "}
                              tokens
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {modelOption.architecture.input_modalities.includes(
                                "image",
                              )
                                ? "Supports images"
                                : "Text only"}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}

                  <ListSubheader>Paid Models</ListSubheader>
                  {availableModels
                    .filter((model) => !isModelFree(model))
                    .map((modelOption) => (
                      <MenuItem
                        key={modelOption.id}
                        value={modelOption.id}
                        disabled
                        sx={{ opacity: 0.6 }}
                      >
                        <Box sx={{ width: "100%" }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold">
                              {modelOption.name}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Tooltip
                                title={`Prompt: ${Number(modelOption.pricing.prompt) * 100}¢ per token, Completion: ${Number(modelOption.pricing.completion) * 100}¢ per token`}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {(
                                    Number(modelOption.pricing.prompt) * 100
                                  ).toFixed(6)}
                                  ¢/
                                  {(
                                    Number(modelOption.pricing.completion) * 100
                                  ).toFixed(6)}
                                  ¢
                                </Typography>
                              </Tooltip>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatCreationDate(modelOption.created)}
                              </Typography>
                              <Chip size="small" label="Paid" />
                            </Box>
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {modelOption.description.length > 100
                              ? `${modelOption.description.substring(0, 100)}...`
                              : modelOption.description}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mt: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ color: "primary.main" }}
                            >
                              Context:{" "}
                              {modelOption.context_length.toLocaleString()}{" "}
                              tokens
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {modelOption.architecture.input_modalities.includes(
                                "image",
                              )
                                ? "Supports images"
                                : "Text only"}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                </>
              )}
            </Select>
          </FormControl>
          {/* display selected model details */}
          {modelObject && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">{modelObject.id}</Typography>
              <Typography variant="body2" gutterBottom>
                {modelObject.description}
              </Typography>
              <Typography variant="body2">
                <b>Pricing:</b> Prompt - $
                {(Number(modelObject.pricing.prompt) * 100).toFixed(6)}¢ per
                token, Completion - $
                {(Number(modelObject.pricing.completion) * 100).toFixed(6)}¢ per
                token
              </Typography>
              <Typography variant="body2">
                <b>Input Modalities:</b>{" "}
                {modelObject.architecture.input_modalities.join(", ")}
              </Typography>
              <Typography variant="body2">
                <b>Output Modalities:</b>{" "}
                {modelObject.architecture.output_modalities.join(", ")}
              </Typography>
              <Typography variant="body2">
                <b>Context Length:</b> {maxTokens.toLocaleString()} tokens
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              sx={{
                color: "#fff",
                backgroundColor: "#504d4d42",
                border: "1px solid #fff",
                "&.Mui-disabled": {
                  WebkitTextFillColor: "#ffffff88", // Forces color in all browsers
                  color: "#ffffff88", // Fallback
                },
              }}
              onClick={streamCompletion}
              disabled={isStreaming || !prompt.trim() || !!apiKeyError}
              startIcon={
                isStreaming ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isStreaming ? "Streaming..." : "Send"}
            </Button>

            {isStreaming && (
              <Button
                variant="outlined"
                color="error"
                onClick={cancelStreaming}
                startIcon={<CancelOutlined />}
              >
                Cancel
              </Button>
            )}
          </Box>

          {isStreaming || results ? (
            <>
              {/* Response actions bar */}
              {results && !isStreaming && (
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Tooltip title="Copy response to clipboard">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyOutlined />}
                      onClick={() => {
                        navigator.clipboard.writeText(results);
                        showSnackbar(
                          "Response copied to clipboard!",
                          "success",
                        );
                      }}
                    >
                      Copy Response
                    </Button>
                  </Tooltip>
                </Box>
              )}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mt: results && !isStreaming ? 1 : 2,
                  whiteSpace: "pre-wrap",
                  minHeight: "200px",
                  maxHeight: "500px",
                  overflow: "auto",
                  bgcolor: "grey.50",
                }}
              >
                {results || <CircularProgress size={24} />}
              </Paper>

              {/* Star Rating - only shown after response is complete */}
              {results && currentEventId && !isStreaming && (
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    Rate this response:
                  </Typography>
                  <Rating
                    value={currentRating === -1 ? null : currentRating}
                    onChange={(_event, newValue) => {
                      if (newValue !== null && currentEventId) {
                        submitRating(currentEventId, newValue);
                      }
                    }}
                    size="large"
                    sx={{
                      "& .MuiRating-iconFilled": {
                        color: currentRating > 0 ? "primary.main" : "inherit",
                      },
                    }}
                  />
                  {currentRating > 0 && (
                    <Chip
                      label="Saved"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>
              )}
            </>
          ) : null}
        </Box>
      )}

      {/* History Tab */}
      {tabValue === 1 && (
        <Box sx={{ width: "100%" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setHistoryTimeframe("day")}
                sx={{
                  mr: 1,
                  color: "#fff",
                  borderColor: "#fff",
                  backgroundColor:
                    historyTimeframe === "day" ? "#10a1f291" : "#ffffff44",
                  "&:hover": {
                    backgroundColor: "#ffffff66",
                    borderColor: "#fff",
                  },
                }}
              >
                Last 24 Hours
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setHistoryTimeframe("week")}
                sx={{
                  mr: 1,
                  color: "#fff",
                  borderColor: "#fff",
                  backgroundColor:
                    historyTimeframe === "week" ? "#10a1f291" : "#ffffff44",
                  "&:hover": {
                    backgroundColor: "#ffffff66",
                    borderColor: "#fff",
                  },
                }}
              >
                Last Week
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setHistoryTimeframe("all")}
                sx={{
                  color: "#fff",
                  borderColor: "#fff",
                  backgroundColor:
                    historyTimeframe === "all" ? "#10a1f291" : "#ffffff44",
                  "&:hover": {
                    backgroundColor: "#ffffff66",
                    borderColor: "#fff",
                  },
                }}
              >
                All Time
              </Button>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshRounded />}
              onClick={loadHistory}
              disabled={isLoadingHistory}
              sx={{
                color: "#fff",
                borderColor: "#fff",
                backgroundColor: "#ffffff44",
                "&:hover": {
                  backgroundColor: "#ffffff66",
                  borderColor: "#fff",
                },
                "&.Mui-disabled": {
                  color: "#ffffff88",
                  borderColor: "#ffffff44",
                },
              }}
            >
              Refresh
            </Button>
          </Box>

          {conversations.length === 0 && !isLoadingHistory && (
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent",
                borderRadius: 1,
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                No conversations found
              </Typography>
              <Typography variant="body2" sx={{ color: "#ffffff99" }}>
                {historyTimeframe === "day" &&
                  "No conversations in the last 24 hours. Try selecting a different timeframe."}
                {historyTimeframe === "week" &&
                  "No conversations in the last week. Try selecting 'All Time' to see older conversations."}
                {historyTimeframe === "all" &&
                  "No conversations yet. Start chatting to build your history!"}
              </Typography>
            </Box>
          )}

          <DataGrid
            rows={conversations}
            columns={columns}
            loading={isLoadingHistory}
            autoHeight
            getRowHeight={() => "auto"}
            sx={{
              color: "#fff",
              border: "1px solid #fff",
              fontSize: "12px",
              backgroundColor: "transparent",
              backdropFilter: "blur(2px)",
              "--DataGrid-pinnedBackground": "transparent",
              "--DataGrid-containerBackground": "#00000044",
              borderRadius: 1,
              "& .MuiDataGrid-cellContent": {
                maxHeight: "80px", // Set your desired max height
                minHeight: "40px", // Optional: set a minimum height
                whiteSpace: "normal", // Allows text to wrap
              },
              // Optional: ensure rows do not exceed max height if content is smaller
              "& .MuiDataGrid-row": {
                maxHeight: "80px !important",
                "&:hover": {
                  backgroundColor: COLORS.transparentBlackDark,
                },
              },
              "& .MuiDataGrid-cell": {
                py: 1,
                color: "#fff",
                borderColor: "#ffffff44",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#00000044",
                color: "#fff",
                borderColor: "#ffffff44",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                color: "#fff",
                fontWeight: 600,
              },
              "& .MuiDataGrid-footerContainer": {
                backgroundColor: "#ffffff44",
                color: "#fff",
                borderColor: "#ffffff44",
              },
              "& .MuiTablePagination-root": {
                color: "#fff",
              },
              "& .MuiIconButton-root": {
                color: "#fff",
              },
              "& .MuiDataGrid-overlay": {
                backgroundColor: "#ffffff34",
              },
              width: "100%",
            }}
          />
        </Box>
      )}

      {/* Templates Tab */}
      {tabValue === 2 && (
        <Box>
          <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateTemplate}
              sx={{
                color: "#fff",
                borderColor: "#fff",
                backgroundColor: "#10a1f291",
                "&:hover": {
                  backgroundColor: "#ffffff66",
                  borderColor: "#fff",
                },
              }}
            >
              Create Template
            </Button>
          </Box>
          <TemplateLibrary
            onSelectTemplate={handleTemplateSelect}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        </Box>
      )}

      {/* Activity Tab */}
      {tabValue === 3 && (
        <Box>
          <OpenRouterActivity />
        </Box>
      )}

      {/* Template Form Dialog */}
      <ThemeProvider theme={darkTheme}>
        <Dialog
          open={open}
          onClose={handleClose}
          // open={templateFormOpen}
          // onClose={handleTemplateFormCancel}
        >
          <DialogContent>
            {/*
            <TemplateForm
              template={editingTemplate}
              onSubmit={handleTemplateFormSubmit}
              onCancel={handleTemplateFormCancel}
              isSubmitting={isSubmittingTemplate}
            />
            */}
            <DialogContentText>
            To subscribe to this website, please enter your email address here. We
            will send updates occasionally.
          </DialogContentText>
          <form id="subscription-form">
            <TextField
              autoFocus
              required
              margin="dense"
              id="name"
              name="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="standard"
            />
          </form>
          </DialogContent>
        </Dialog>
      </ThemeProvider>

      {/* Prompt Enhancer Dialog */}
      <Dialog
        open={enhancerOpen}
        onClose={handleCloseEnhancer}
        maxWidth="md"
        fullWidth
        PaperProps={dialogPaperProps}
      >
        <DialogContent>
          <PromptEnhancer
            initialPrompt={prompt}
            onAcceptEnhancement={handleAcceptEnhancement}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        PaperProps={dialogPaperProps}
      >
        <DialogTitle sx={{ color: "#fff" }}>Delete Template</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#ffffff99" }}>
            Are you sure you want to delete "{templateToDelete?.name}"? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteCancel}
            sx={{
              color: "#fff",
              borderColor: "#fff",
              "&:hover": {
                backgroundColor: "#ffffff22",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleteTemplateMutation.isLoading}
            sx={{
              backgroundColor: "#d32f2f",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#b71c1c",
              },
              "&.Mui-disabled": {
                backgroundColor: "#d32f2f88",
                color: "#ffffff88",
              },
            }}
          >
            {deleteTemplateMutation.isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Variable Substitution Dialog */}
      <TemplateVariableSubstitution
        template={templateForSubstitution}
        open={variableSubOpen}
        onClose={handleVariableSubstitutionClose}
        onApply={handleVariableSubstitutionApply}
      />
    </Box>
  );
};

export default OpenRouterComponent;
