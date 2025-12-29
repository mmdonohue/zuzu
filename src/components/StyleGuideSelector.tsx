import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Chip,
  Collapse,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  FormHelperText,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Thermostat as ThermostatIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useStyleGuides } from '../hooks/useStyleGuides';
import type { StyleGuide } from '../store/slices/templatesSlice';

interface StyleGuideSelectorProps {
  value: string | null;
  onChange: (styleGuideId: string | null, styleGuide: StyleGuide | null) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  showDetails?: boolean;
  size?: 'small' | 'medium';
}

const StyleGuideSelector: React.FC<StyleGuideSelectorProps> = ({
  value,
  onChange,
  label = 'Style Guide',
  helperText,
  required = false,
  showDetails = true,
  size = 'medium',
}) => {
  const { data: styleGuides, isLoading, error } = useStyleGuides() as {
    data: StyleGuide[] | undefined;
    isLoading: boolean;
    error: Error | null;
  };
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Get the selected style guide object
  const selectedStyleGuide = styleGuides?.find((sg) => sg.id === value) || null;

  const handleChange = (styleGuideId: string) => {
    if (styleGuideId === '') {
      onChange(null, null);
    } else {
      const styleGuide = styleGuides?.find((sg) => sg.id === styleGuideId) || null;
      onChange(styleGuideId, styleGuide);
    }
  };

  return (
    <Box>
      {/* Style Guide Selector */}
      <FormControl fullWidth size={size} required={required}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value || ''}
          label={label}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isLoading}
        >
          <MenuItem value="">
            <em>None - Use Default</em>
          </MenuItem>
          {isLoading && (
            <MenuItem disabled>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Loading style guides...
            </MenuItem>
          )}
          {styleGuides?.map((styleGuide) => (
            <MenuItem key={styleGuide.id} value={styleGuide.id}>
              {styleGuide.name}
            </MenuItem>
          ))}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load style guides: {(error as Error)?.message || 'Unknown error'}
        </Alert>
      )}

      {/* Style Guide Details */}
      {showDetails && selectedStyleGuide && (
        <Paper variant="outlined" sx={{ mt: 2, overflow: 'hidden' }}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: 'grey.50',
              cursor: 'pointer',
            }}
            onClick={() => setDetailsExpanded(!detailsExpanded)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2">Style Guide Details</Typography>
            </Box>
            <IconButton
              size="small"
              sx={{
                transform: detailsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>

          {/* Collapsible Content */}
          <Collapse in={detailsExpanded}>
            <Box sx={{ p: 2 }}>
              {/* Name and Description */}
              <Typography variant="h6" gutterBottom>
                {selectedStyleGuide.name}
              </Typography>
              {selectedStyleGuide.description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedStyleGuide.description}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Temperature */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ThermostatIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2">Temperature</Typography>
                </Box>
                <Chip
                  label={`${selectedStyleGuide.temperature}`}
                  size="small"
                  color={
                    selectedStyleGuide.temperature >= 0.8
                      ? 'warning'
                      : selectedStyleGuide.temperature >= 0.5
                      ? 'primary'
                      : 'info'
                  }
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {selectedStyleGuide.temperature >= 0.8
                    ? 'Creative and varied responses'
                    : selectedStyleGuide.temperature >= 0.5
                    ? 'Balanced creativity and consistency'
                    : 'Focused and deterministic responses'}
                </Typography>
              </Box>

              {/* System Prompt Preview */}
              {selectedStyleGuide.system_prompt && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PsychologyIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2">System Prompt</Typography>
                  </Box>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: 'grey.50',
                      maxHeight: '200px',
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        m: 0,
                      }}
                    >
                      {selectedStyleGuide.system_prompt}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Metadata */}
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(selectedStyleGuide.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </Paper>
      )}
    </Box>
  );
};

export default StyleGuideSelector;
