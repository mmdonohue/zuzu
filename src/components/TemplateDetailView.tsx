import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Code as CodeIcon,
  Article as ArticleIcon,
  Psychology as PsychologyIcon,
  Lightbulb as LightbulbIcon,
  Extension as ExtensionIcon,
  Public as PublicIcon,
  VerifiedUser as VerifiedUserIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  ContentCopy as ContentCopyIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { Template } from '../store/slices/templatesSlice';

interface TemplateDetailViewProps {
  template: Template | null;
  open: boolean;
  onClose: () => void;
  onUseTemplate: (template: Template) => void;
}

// Category icon mapping
const categoryIcons: Record<string, React.ReactElement> = {
  code: <CodeIcon />,
  content: <ArticleIcon />,
  analysis: <PsychologyIcon />,
  creative: <LightbulbIcon />,
  custom: <ExtensionIcon />,
};

// Category color mapping
const categoryColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
  code: 'primary',
  content: 'info',
  analysis: 'secondary',
  creative: 'warning',
  custom: 'success',
};

const TemplateDetailView: React.FC<TemplateDetailViewProps> = ({
  template,
  open,
  onClose,
  onUseTemplate,
}) => {
  if (!template) return null;

  const categoryIcon = categoryIcons[template.category] || <ExtensionIcon />;
  const categoryColor = categoryColors[template.category] || 'default';

  const handleCopyContent = () => {
    navigator.clipboard.writeText(template.content);
  };

  const handleUseTemplate = () => {
    onUseTemplate(template);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Chip
                icon={categoryIcon}
                label={template.category}
                size="small"
                color={categoryColor}
                sx={{ textTransform: 'capitalize' }}
              />
              {template.is_system && (
                <Tooltip title="System Template">
                  <Chip
                    icon={<VerifiedUserIcon />}
                    label="System"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Tooltip>
              )}
              {template.is_public && (
                <Tooltip title="Public Template">
                  <Chip
                    icon={<PublicIcon />}
                    label="Public"
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
              )}
            </Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              {template.name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Description */}
        {template.description && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              {template.description}
            </Typography>
          </Box>
        )}

        {/* Metadata Grid */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <TrendingUpIcon color="action" sx={{ mb: 1 }} />
              <Typography variant="h6" color="primary">
                {template.usage_count}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Times Used
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <ExtensionIcon color="action" sx={{ mb: 1 }} />
              <Typography variant="h6" color="primary">
                {template.variables?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Variables
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <CalendarIcon color="action" sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {format(new Date(template.created_at), 'MMM d, yyyy')}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <CalendarIcon color="action" sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Updated
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {format(new Date(template.updated_at), 'MMM d, yyyy')}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {template.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Variables */}
        {template.variables && template.variables.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Template Variables
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {template.variables.map((variable, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 1,
                    borderBottom: index < template.variables.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {`{{${variable.name}}}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {variable.label}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={variable.type}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                    {variable.required && (
                      <Chip
                        label="Required"
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              ))}
            </Paper>
            <Alert severity="info" sx={{ mt: 2 }}>
              Variables are placeholders that will be replaced with your input when using the template.
            </Alert>
          </Box>
        )}

        {/* Style Guide */}
        {template.style_guides && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Style Guide
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {template.style_guides.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {template.style_guides.description}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={`Temperature: ${template.style_guides.temperature}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Paper>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Template Content */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">
              Template Content
            </Typography>
            <Tooltip title="Copy to clipboard">
              <IconButton size="small" onClick={handleCopyContent}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              maxHeight: '300px',
              overflow: 'auto',
            }}
          >
            <Typography
              variant="body2"
              component="pre"
              sx={{
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                m: 0,
              }}
            >
              {template.content}
            </Typography>
          </Paper>
        </Box>

        {/* Owner Info */}
        {!template.is_system && template.user_id && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon fontSize="small" />
              Created by user {template.user_id.substring(0, 8)}...
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={handleUseTemplate}
          color="primary"
        >
          Use Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateDetailView;
