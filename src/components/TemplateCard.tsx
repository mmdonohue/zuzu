import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Code as CodeIcon,
  Article as ArticleIcon,
  Psychology as PsychologyIcon,
  Lightbulb as LightbulbIcon,
  Extension as ExtensionIcon,
  Public as PublicIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import type { Template } from '../store/slices/templatesSlice';

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
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

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  const categoryIcon = categoryIcons[template.category] || <ExtensionIcon />;
  const categoryColor = categoryColors[template.category] || 'default';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={() => onSelect(template)}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header with category and badges */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Chip
            icon={categoryIcon}
            label={template.category}
            size="small"
            color={categoryColor}
            sx={{ textTransform: 'capitalize' }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {template.is_system && (
              <Tooltip title="System Template">
                <VerifiedUserIcon fontSize="small" color="primary" />
              </Tooltip>
            )}
            {template.is_public && (
              <Tooltip title="Public Template">
                <PublicIcon fontSize="small" color="action" />
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Template name */}
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontWeight: 600,
            fontSize: '1.1rem',
            lineHeight: 1.3,
            mb: 1,
          }}
        >
          {template.name}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '40px',
          }}
        >
          {template.description || 'No description provided'}
        </Typography>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {template.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: '20px' }}
              />
            ))}
            {template.tags.length > 3 && (
              <Chip
                label={`+${template.tags.length - 3}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: '20px' }}
              />
            )}
          </Box>
        )}

        {/* Metadata */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            {template.variables?.length || 0} variable{template.variables?.length !== 1 ? 's' : ''}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Used {template.usage_count} time{template.usage_count !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        <Tooltip title="View template details">
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(template);
            }}
            sx={{ ml: 'auto' }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default TemplateCard;
