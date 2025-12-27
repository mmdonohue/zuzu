// src/pages/OpenRouter.tsx
import { useRef, useEffect, useState, SyntheticEvent } from 'react';
import { createParser, EventSourceParserEvent } from 'eventsource-parser';
import { get_encoding, encoding_for_model, Tiktoken, TiktokenModel } from "tiktoken";
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
    Tooltip
  } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { 
  RefreshRounded, 
  DeleteOutlined, 
  RestartAltOutlined,
  CancelOutlined,
  ContentCopyOutlined,
  SettingsOutlined
} from '@mui/icons-material';
import { format, max, set } from 'date-fns';
import { on } from 'events';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';

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
}

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
  }

  type ModelArchitecture = {
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
  }

  type ModelProvider = {
    is_moderated: boolean;
  }

  type ModelLimits = {
    [key: string]: string;
  }

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
  }

  const model_temp_min = 0.0;
  const model_temp_max = 1.0;
  const model_temp_step = 0.1;
  const model_step_marks = 0.5
  const model_encoding_default = 'cl100k_base';
  const max_context_length = 2000000;
  const min_context_length = 1000;
  const context_adjust = 1.2;
  const token_adjust = 1.2;
  const max_token_display = 1000000;
  const min_token_display = 1000;
  const token_step = 10000;

  function displayTokenCost(tokens: number): string {
    if(tokens < max_token_display) {
      return `${(tokens / min_token_display).toFixed(0)}K`;
    } else {
      return `${(tokens / max_token_display).toFixed(1)}M`;
    }
  }

const OpenRouterComponent = () => {
  // Get current user from auth context
  const { user } = useAuth();

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
        return parseFloat(model.pricing.prompt) === 0 && parseFloat(model.pricing.completion) === 0;
    };

    const convert_milli = 1000
    // Format creation date from timestamp
    const formatCreationDate = (timestamp: number): string => {
        const date = new Date(timestamp * convert_milli); // Convert seconds to milliseconds
        return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
        });
    };

    // Fetch models from OpenRouter API
    const fetchModels = async () => {
        setIsLoadingModels(true);
        try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
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
        
        setAvailableModels(sortedModels);
        } catch (error) {
        console.error('Error fetching models:', error);
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
  const [model, setModel] = useState("");
  const [modelObject, setModelObject] = useState<OpenRouterModel | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [controller, setController] = useState<AbortController | null>(null);
  const [promptTokens, setPromptTokens] = useState<number>(0);
  
  // State for advanced parameters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000000);
  const [currTokens, setCurrTokens] = useState(1600000);
  const [systemMessage, setSystemMessage] = useState("");
  
  // State for conversation history
  const [historyTimeframe, setHistoryTimeframe] = useState<'day' | 'week'>('day');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
  // update tokens
  // const tokens = encoding.encode(prompt);

  // Define columns for DataGrid
  const columns: GridColDef[] = [
    {
      field: 'created',
      headerName: 'Date',
      width: 170,
      valueFormatter: (value: string | Date | number | undefined) => {
        if (!value) return 'N/A';
        try {
          return format(new Date(value), 'MMM d, yyyy h:mm a');
        } catch (error) {
          console.error('Error formatting date:', error, value);
          return String(value);
        }
      }
    },
    {
      field: 'user_id',
      headerName: 'User',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const firstName = params.row.first_name;
        const lastName = params.row.last_name;
        const userId = params.value;

        // Display full name if available, otherwise show user_id
        const displayText = (firstName && lastName)
          ? `${firstName} ${lastName}`
          : userId || 'N/A';

        return (
          <Typography sx={{ fontSize: '0.875rem' }}>
            {displayText}
          </Typography>
        );
      }
    },
    {
      field: 'model',
      headerName: 'Model',
      width: 180,
      renderCell: (params: GridRenderCellParams) => {
        const modelName = params.value.split('/').pop();
        return <Chip size="small" label={modelName} onClick={() => {
          setModel(modelName);
          setTabValue(0);
        }} />;
      }
    },
    {
      field: 'prompt',
      headerName: 'Prompt',
      width: 230,
      renderCell: (params: GridRenderCellParams) => {
        const text = params.value as string;
        return (
          <Tooltip title={text} placement="top">
            <Typography>{text.length > 60 ? text.substring(0, 60) + '...' : text}</Typography>
          </Tooltip>
        );
      }
    },
    {
      field: 'response',
      headerName: 'Response',
      width: 320,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const text = params.value as string;
        return (
          <Tooltip title={text} placement="top">
            <Typography>{text.length > 100 ? text.substring(0, 100) + '...' : text}</Typography>
          </Tooltip>
        );
      }
    },
    {
      field: 'response_time',
      headerName: 'Time',
      width: 60,
      valueFormatter: (value: number | undefined) => {
        return value ? value.toFixed(2) : 'N/A';
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
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
            <IconButton 
              size="small" 
              onClick={() => copyResponse(params.row)}
            >
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
      )
    }
  ];
  
  // Load conversation history
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await apiFetch(`/api/openrouter/history?timeframe=${historyTimeframe}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Save conversation to Supabase
  const saveConversation = async (model: string, prompt: string, response: string, responseTime: number) => {
    try {
      await apiFetch('/api/openrouter/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          response,
          response_time: responseTime,
          user_id: user?.id || null
        }),
      });
      // Reload history if we're on the history tab
      if (tabValue === 1) {
        loadHistory();
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };
  
  // Deactivate a conversation
  const deactivateConversation = async (id: string) => {
    try {
      await apiFetch(`/api/openrouter/status/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      });
      // Update the local state to reflect the change
      setConversations(prev => prev.filter(conv => conv.id !== id));
    } catch (error) {
      console.error('Error deactivating conversation:', error);
    }
  };
  
  // Reload a prompt from history
  const reloadPrompt = (conversation: Conversation) => {
    setTabValue(0); // Switch to the chat tab
    setPrompt(prompt ? prompt + '\n' + conversation.prompt : conversation.prompt);
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
      setApiKeyError("API key is missing. Please check your environment variables.");
    } else if (apiKey === "undefined" || apiKey === "null") {
      setApiKeyError(`API key has invalid value: "${apiKey}". Check your .env file and webpack configuration.`);
    } else {
      // Log only a portion of the key for debugging (first 4 chars)
      const keyPreview = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
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
    setMessages(prev => [...prev, { role, content }]);
  };
  
  // Clear conversation
  const clearConversation = () => {
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
      ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
      // Include previous messages to maintain context
      ...messages,
      // Add the new user message
      { role: 'user', content: prompt }
    ];
    
    // Add the user message to the conversation history
    addMessage('user', prompt);
    
    try {
      // console.log(`Sending request to OpenRouter with model: ${model}`, 'Prompt:', prompt);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin, // Required by OpenRouter
        },
        body: JSON.stringify({
          model: model,
          messages: conversationMessages,
          stream: true,
          temperature: temperature,
          max_tokens: currTokens - Math.floor(promptTokens * token_adjust), // Adjust max tokens based on prompt size
        }),
        signal: abortController.signal // For cancellation
      });
    
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. Details: ${errorText}`);
      }
    
      const parser = createParser({
        onEvent: (event: EventSourceParserEvent) => {
            // console.log('Received event:', event);
            // More permissive check - just make sure we have data to parse
            if(event.type === 'event' && 'data' in event){
              try {
                // Handle [DONE] marker if it exists
                if (event.data === '[DONE]') {
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
                  '';
                  
                if (content) {
                  // console.log('Content received:', content);
                  setResults(prev => prev + content);
                }
              } catch (e) {
                console.error('Error parsing streaming response:', e);
              }
            }
          }
      });
    
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        try {
          let buffer = '';
          let fullResponse = '';
          
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
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';
            
            for (const part of parts) {
              if (part.trim()) {
                // Handle each event
                const eventData = part.replace(/^data: /, '').trim();
                if (eventData) {
                  // console.log('Processing event data:', eventData);
                  if (eventData === '[DONE]') {
                    // console.log('Stream completed with [DONE] marker');
                    continue;
                  }
                  try {
                    const json = JSON.parse(eventData);
                    const content = json.choices?.[0]?.delta?.content || '';
                    if (content) {
                      fullResponse += content;
                      setResults(fullResponse);
                    }
                  } catch (e) {
                    console.error('Error parsing JSON:', e);
                  }
                }
              }
            }
          }
          
          // Calculate response time
          const responseTime = (Date.now() - startTime) / convert_milli;
          
          // Add assistant message to conversation history
          addMessage('assistant', fullResponse);
          
          // Save the conversation to Supabase
          await saveConversation(model, prompt, fullResponse, responseTime);
          
          // Clear the prompt for the next message
          setPrompt("");
          
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            // console.log('Stream reading aborted by user');
          } else {
          console.error('Error reading stream:', error);
            throw error;
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
      console.error('Streaming error:', error);
      setResults(prev => prev + "\n\nError: " + (error as Error).message);
      }
    } finally {
      setIsStreaming(false);
      setController(null);
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs 
        value={tabValue} 
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Chat" />
        <Tab label="History" />
      </Tabs>
      
      {/* Chat Tab */}
      {tabValue === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {apiKeyError && (
            <Alert severity="error" sx={{ mb: 2 }}>
            {apiKeyError}
            </Alert>
        )}
      
          {/* Display conversation if there are messages */}
          {messages.length > 0 && (
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Conversation</Typography>
                <Button 
                  size="small" 
                  startIcon={<RefreshRounded />}
                  onClick={clearConversation}
                >
                  Clear
                </Button>
              </Box>
              
              {messages.map((msg, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    mb: 2,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: msg.role === 'user' ? 'primary.50' : 'background.paper',
                    border: 1,
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </Typography>
                </Box>
              ))}
            </Paper>
          )}
          
          {/* Advanced settings */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SettingsOutlined fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">Advanced settings</Typography>
                </Box>
              }
            />
          </Box>
          
          {showAdvanced && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="System Message"
                    multiline
                    rows={2}
                    value={systemMessage}
                    onChange={(e) => setSystemMessage(e.target.value)}
                    placeholder="Optional instructions for the AI"
                    fullWidth
                    helperText="Sets the behavior and capabilities of the assistant"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" gutterBottom>Temperature: {temperature}</Typography>
                  <Slider
                    value={temperature}
                    onChange={(_, value) => setTemperature(value as number)}
                    min={model_temp_min}
                    max={model_temp_max}
                    step={model_temp_step}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: model_temp_min, label: model_temp_min.toString() },
                      { value: model_temp_max / 2, label: (model_temp_max / 2).toString() },
                      { value: model_temp_max, label: model_temp_max.toString() }
                    ]}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Lower for more deterministic results, higher for more creative responses
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" gutterBottom>Max Tokens: <b>{displayTokenCost(maxTokens)}</b> | Current Tokens: <b>{displayTokenCost(currTokens)}</b></Typography>
                  <Slider
                    sx={{ mb: 2 }}
                    value={currTokens ? currTokens : Math.floor(maxTokens * 0.8)}
                    onChange={(_, value) => setCurrTokens(value as number)}
                    min={maxTokens / token_step}
                    max={maxTokens}
                    step={maxTokens / token_step}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: maxTokens/token_step, label: displayTokenCost(maxTokens/token_step) },
                      { value: maxTokens/2, label: displayTokenCost(maxTokens/2) },
                      { value: maxTokens, label: displayTokenCost(maxTokens) }
                    ]}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Maximum length of the context (in tokens) the model can handle
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
    <TextField
        label="Enter your prompt"
        multiline
        rows={5}
        value={prompt}
        onChange={(e) => {
          const encoding = get_encoding(model_encoding_default);
          setPrompt(e.target.value);
          setPromptTokens(encoding.encode(e.target.value).length);
          encoding.free();
        }}
        placeholder="Enter your prompt here..."
        fullWidth
        inputRef={promptRef}
    />
    <div>Prompt Tokens: <b>{promptTokens.toString()}</b></div>
    <div>API Tokens: <b>{(currTokens - Math.floor(promptTokens * context_adjust)).toString()}</b></div>
    <FormControl fullWidth>
      <InputLabel id="model-select-label">Model</InputLabel>
      <Select
        inputRef={selectRef}
        labelId="model-select-label"
        value={model}
        label="Model"
        renderValue={(selected) => {
         // if(selected !== model){
           // console.log('Rendering selected model:', selected);
            const selectedModel = availableModels.find(m => m.id === selected);
            return selectedModel ? selectedModel.name : selected;
          // }
        }}
        onClose={() => { 
          // console.log('Model select closed'); 
            handleMenuClose(); }}
        onOpen={(event) => { 
           // console.log('Model select opened'); 
            handleMenuOpen(event);
        }}
      >
        {isLoadingModels ? (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography>Loading models...</Typography>
            </Box>
          </MenuItem>
        ) : (
          <>
            <ListSubheader>Free Models</ListSubheader>
            {availableModels
              .filter(model => isModelFree(model))
              .map((modelOption) => (
                <MenuItem 
                  key={modelOption.id}
                  value={modelOption.id}
                  onClick={(event) => {
                   // console.log('Menu - selected free model:', modelOption.id);
                    let modelSelectedModel = availableModels.find(m => m.id === modelOption.id);
                    setMaxTokens(modelSelectedModel ? modelSelectedModel.context_length : max_context_length);
                    setCurrTokens(modelSelectedModel ? Math.floor(modelSelectedModel.context_length * .8) : max_context_length);
                    setModel(modelOption.id);
                    setModelObject(modelSelectedModel || null);
                    handleMenuClose();
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {modelOption.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatCreationDate(modelOption.created)}
                        </Typography>
                        <Chip size="small" label="Free" color="success" />
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {modelOption.description.length > 100 
                        ? `${modelOption.description.substring(0, 100)}...` 
                        : modelOption.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'primary.main' }}>
                        Context: {modelOption.context_length.toLocaleString()} tokens
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {modelOption.architecture.input_modalities.includes('image') ? 'Supports images' : 'Text only'}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
              
            <ListSubheader>Paid Models</ListSubheader>
            {availableModels
              .filter(model => !isModelFree(model))
              .map((modelOption) => (
                <MenuItem 
                  key={modelOption.id} 
                  value={modelOption.id}
                  disabled
                  sx={{ opacity: 0.6 }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {modelOption.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={`Prompt: ${Number(modelOption.pricing.prompt) * 100}¢ per token, Completion: ${Number(modelOption.pricing.completion) * 100}¢ per token`}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {(Number(modelOption.pricing.prompt) * 100).toFixed(6)}¢/{(Number(modelOption.pricing.completion) * 100).toFixed(6)}¢
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary">
                          {formatCreationDate(modelOption.created)}
                        </Typography>
                        <Chip size="small" label="Paid" />
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {modelOption.description.length > 100 
                        ? `${modelOption.description.substring(0, 100)}...` 
                        : modelOption.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'primary.main' }}>
                        Context: {modelOption.context_length.toLocaleString()} tokens
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {modelOption.architecture.input_modalities.includes('image') ? 'Supports images' : 'Text only'}
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
        <Typography variant="body2" gutterBottom>{modelObject.description}</Typography>
        <Typography variant="body2">
          <b>Pricing:</b> Prompt - ${(Number(modelObject.pricing.prompt) * 100).toFixed(6)}¢ per token, Completion - ${(Number(modelObject.pricing.completion) * 100).toFixed(6)}¢ per token
        </Typography>
        <Typography variant="body2">
          <b>Input Modalities:</b> {modelObject.architecture.input_modalities.join(', ')}
        </Typography>
        <Typography variant="body2">
          <b>Output Modalities:</b> {modelObject.architecture.output_modalities.join(', ')}
        </Typography>
        <Typography variant="body2">
          <b>Context Length:</b> {maxTokens.toLocaleString()} tokens
        </Typography>
      </Box>
    )}

    <Box sx={{ display: 'flex', gap: 2 }}>
        <Button 
            variant="contained" 
            color="primary"
            onClick={streamCompletion} 
            disabled={isStreaming || !prompt.trim() || !!apiKeyError}
            startIcon={isStreaming ? <CircularProgress size={20} color="inherit" /> : null}
        >
            {isStreaming ? 'Streaming...' : 'Send'}
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
            <Paper 
                elevation={1} 
                sx={{ 
                p: 2, 
                mt: 2, 
                whiteSpace: 'pre-wrap', 
                minHeight: '200px',
                maxHeight: '500px',
                overflow: 'auto',
                bgcolor: 'grey.50'
                }}
            >
                {results || <CircularProgress size={24} />}
            </Paper>
          ) : null}
        </Box>
      )}
      
      {/* History Tab */}
      {tabValue === 1 && (
        <Box sx={{ height: 600, width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setHistoryTimeframe('day')}
                color={historyTimeframe === 'day' ? 'primary' : 'inherit'}
                sx={{ mr: 1 }}
              >
                Last 24 Hours
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setHistoryTimeframe('week')}
                color={historyTimeframe === 'week' ? 'primary' : 'inherit'}
              >
                Last Week
              </Button>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshRounded />}
              onClick={loadHistory}
              disabled={isLoadingHistory}
            >
              Refresh
            </Button>
          </Box>
          
          <DataGrid
            rows={conversations}
            columns={columns}
            loading={isLoadingHistory}
            getRowHeight={() => 'auto'}
            sx={{
              '& .MuiDataGrid-cell': {
                py: 1
              },
              height: '100%', // Make DataGrid fill available space
              width: '100%'
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default OpenRouterComponent;