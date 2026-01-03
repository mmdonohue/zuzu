import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import {
  AutoFixHigh as EnhanceIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Lightbulb as SuggestionIcon,
  TrendingUp as ImprovementIcon,
  ExpandMore as ExpandMoreIcon,
  Check as AcceptIcon,
} from "@mui/icons-material";
import StyleGuideSelector from "./StyleGuideSelector";
import { enhancePrompt } from "../services/api";
import type { StyleGuide } from "../store/slices/templatesSlice";

type PromptEnhancerProps = {
  initialPrompt?: string;
  onAcceptEnhancement?: (enhancedPrompt: string) => void;
};

type EnhancementResult = {
  enhanced_prompt: string;
  improvements: string[];
  suggestions: string[];
  style_guide?: {
    id: string;
    name: string;
  };
};

const PromptEnhancer: React.FC<PromptEnhancerProps> = ({
  initialPrompt = "",
  onAcceptEnhancement,
}) => {
  // Form state
  const [prompt, setPrompt] = useState(initialPrompt);
  const [context, setContext] = useState("");
  const [styleGuideId, setStyleGuideId] = useState<string | null>(null);

  // Enhancement state
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementResult, setEnhancementResult] =
    useState<EnhancementResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showImprovements, setShowImprovements] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [copied, setCopied] = useState(false);

  // Handle enhance button click
  const handleEnhance = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to enhance");
      return;
    }

    setIsEnhancing(true);
    setError(null);
    setEnhancementResult(null);

    try {
      const response = await enhancePrompt({
        prompt: prompt.trim(),
        style_guide_id: styleGuideId || undefined,
        context: context.trim() || undefined,
      });

      if (response.success && response.data) {
        setEnhancementResult(response.data);
      } else {
        throw new Error(response.message || "Failed to enhance prompt");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error enhancing prompt:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (enhancementResult?.enhanced_prompt) {
      try {
        await navigator.clipboard.writeText(enhancementResult.enhanced_prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  // Handle accept enhancement
  const handleAccept = () => {
    if (enhancementResult?.enhanced_prompt && onAcceptEnhancement) {
      onAcceptEnhancement(enhancementResult.enhanced_prompt);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <EnhanceIcon color="primary" />
          Prompt Enhancer
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Get AI-powered suggestions to improve your prompt's clarity,
          specificity, and effectiveness.
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* Original Prompt */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              multiline
              rows={6}
              label="Original Prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the prompt you want to enhance..."
              disabled={isEnhancing}
              helperText="The prompt you want to improve"
            />
          </Grid>

          {/* Context (Optional) */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Context (Optional)"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Provide any additional context that might help improve the prompt..."
              disabled={isEnhancing}
              helperText="Extra information about your use case or requirements"
            />
          </Grid>

          {/* Style Guide */}
          <Grid item xs={12}>
            <StyleGuideSelector
              value={styleGuideId}
              onChange={(id) => setStyleGuideId(id)}
              helperText="Optional: Apply a specific style guide to the enhancement"
              showDetails={false}
            />
          </Grid>

          {/* Enhance Button */}
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={
                isEnhancing ? <CircularProgress size={20} /> : <EnhanceIcon />
              }
              onClick={handleEnhance}
              disabled={isEnhancing || !prompt.trim()}
            >
              {isEnhancing ? "Enhancing Prompt..." : "Enhance Prompt"}
            </Button>
          </Grid>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {/* Enhancement Results */}
        {enhancementResult && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />

            {/* Enhanced Prompt */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <CheckIcon color="success" />
                  Enhanced Prompt
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {onAcceptEnhancement && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<AcceptIcon />}
                      onClick={handleAccept}
                    >
                      Use This Version
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    onClick={handleCopy}
                    color={copied ? "success" : "default"}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </IconButton>
                </Box>
              </Box>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "success.50",
                  borderColor: "success.main",
                  borderWidth: 2,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {enhancementResult.enhanced_prompt}
                </Typography>
              </Paper>
            </Box>

            {/* Improvements */}
            {enhancementResult.improvements &&
              enhancementResult.improvements.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                      cursor: "pointer",
                    }}
                    onClick={() => setShowImprovements(!showImprovements)}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <ImprovementIcon color="primary" />
                      Improvements Made ({enhancementResult.improvements.length}
                      )
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{
                        transform: showImprovements
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.3s",
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </Box>
                  <Collapse in={showImprovements}>
                    <List dense>
                      {enhancementResult.improvements.map(
                        (improvement, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={improvement} />
                          </ListItem>
                        ),
                      )}
                    </List>
                  </Collapse>
                </Box>
              )}

            {/* Additional Suggestions */}
            {enhancementResult.suggestions &&
              enhancementResult.suggestions.length > 0 && (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                      cursor: "pointer",
                    }}
                    onClick={() => setShowSuggestions(!showSuggestions)}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <SuggestionIcon color="warning" />
                      Additional Suggestions (
                      {enhancementResult.suggestions.length})
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{
                        transform: showSuggestions
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.3s",
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </Box>
                  <Collapse in={showSuggestions}>
                    <List dense>
                      {enhancementResult.suggestions.map(
                        (suggestion, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <SuggestionIcon
                                color="warning"
                                fontSize="small"
                              />
                            </ListItemIcon>
                            <ListItemText primary={suggestion} />
                          </ListItem>
                        ),
                      )}
                    </List>
                  </Collapse>
                </Box>
              )}

            {/* Style Guide Used */}
            {enhancementResult.style_guide && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary">
                  Enhanced using style guide:{" "}
                  <Chip
                    label={enhancementResult.style_guide.name}
                    size="small"
                    variant="outlined"
                  />
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PromptEnhancer;
