// src/pages/OpenRouter.tsx
import { useEffect, useState } from 'react';
import { createParser, EventSourceParserEvent } from 'eventsource-parser';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
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
import { format } from 'date-fns';

// Define types
interface Conversation {
  id: string;
  created: string;
  model: string;
  prompt: string;
  response: string;
  response_time: number;
  active: boolean;
}

const OpenRouterComponent = () => {
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State for OpenRouter API
  const apiKey = process.env.ZUZU_OPENROUTER_KEY;
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState("");
  const [model, setModel] = useState("openrouter/quasar-alpha");
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [controller, setController] = useState<AbortController | null>(null);
  
  // State for advanced parameters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [systemMessage, setSystemMessage] = useState("");
  
  // State for conversation history
  const [historyTimeframe, setHistoryTimeframe] = useState<'day' | 'week'>('day');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Define columns for DataGrid
  const columns: GridColDef[] = [
    { 
      field: 'created', 
      headerName: 'Date', 
      width: 180,
      valueFormatter: (params: any) => {
        return format(new Date(params.value), 'MMM d, yyyy h:mm a');
      }
    },
    { 
      field: 'model', 
      headerName: 'Model', 
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const modelName = params.value.split('/').pop();
        return <Chip size="small" label={modelName} />;
      }
    },
    { 
      field: 'prompt', 
      headerName: 'Prompt', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const text = params.value as string;
        return <Typography>{text.length > 60 ? text.substring(0, 60) + '...' : text}</Typography>;
      }
    },
    { 
      field: 'response_time', 
      headerName: 'Time (s)', 
      width: 100,
      valueFormatter: (params: any) => {
        return params.value ? params.value.toFixed(2) : 'N/A';
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
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
      const response = await fetch(`/api/openrouter/history?timeframe=${historyTimeframe}`);
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
      await fetch('/api/openrouter/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, response, response_time: responseTime }),
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
      await fetch(`/api/openrouter/status/${id}`, {
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
    setPrompt(conversation.prompt);
    setModel(conversation.model);
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
      console.log(`API key loaded: ${keyPreview}`);
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
      console.log(`Sending request to OpenRouter with model: ${model}`, 'Prompt:', prompt);
      
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
          max_tokens: maxTokens
        }),
        signal: abortController.signal // For cancellation
      });
    
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. Details: ${errorText}`);
      }
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        try {
          let buffer = '';
          let fullResponse = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream reading complete');
              break;
            }
            
            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            
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
                  if (eventData === '[DONE]') {
                    console.log('Stream completed with [DONE] marker');
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
          const responseTime = (Date.now() - startTime) / 1000;
          
          // Add assistant message to conversation history
          addMessage('assistant', fullResponse);
          
          // Save the conversation to Supabase
          await saveConversation(model, prompt, fullResponse, responseTime);
          
          // Clear the prompt for the next message
          setPrompt("");
          
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            console.log('Stream reading aborted by user');
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
                    min={0}
                    max={1}
                    step={0.1}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: 0, label: '0' },
                      { value: 0.5, label: '0.5' },
                      { value: 1, label: '1' }
                    ]}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Lower for more deterministic results, higher for more creative responses
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" gutterBottom>Max Tokens: {maxTokens}</Typography>
                  <Slider
                    value={maxTokens}
                    onChange={(_, value) => setMaxTokens(value as number)}
                    min={100}
                    max={4000}
                    step={100}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: 100, label: '100' },
                      { value: 2000, label: '2000' },
                      { value: 4000, label: '4000' }
                    ]}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Maximum length of the generated response
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
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            fullWidth
          />
          
          <FormControl fullWidth>
            <InputLabel id="model-select-label">Model</InputLabel>
            <Select
              labelId="model-select-label"
              value={model}
              label="Model"
              onChange={(e) => setModel(e.target.value)}
            >
              <MenuItem value="openrouter/quasar-alpha">Quasar Alpha (Free)</MenuItem>
              <MenuItem value="google/gemma-7b-it">Google Gemma 7B (Free)</MenuItem>
              <MenuItem value="meta-llama/llama-2-13b-chat">Meta Llama 2 13B (Free)</MenuItem>
              <MenuItem value="mistralai/mistral-7b-instruct">Mistral 7B Instruct (Free)</MenuItem>
              <MenuItem value="nousresearch/nous-hermes-2-mixtral-8x7b-dpo">Nous Hermes Mixtral (Free)</MenuItem>
              <MenuItem value="anthropic/claude-3-opus-20240229">Claude 3 Opus (Paid)</MenuItem>
              <MenuItem value="anthropic/claude-3-sonnet-20240229">Claude 3 Sonnet (Paid)</MenuItem>
              <MenuItem value="anthropic/claude-3-haiku-20240307">Claude 3 Haiku (Paid)</MenuItem>
            </Select>
          </FormControl>
          
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
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default OpenRouterComponent;