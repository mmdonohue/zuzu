import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  InputAdornment,
  Chip,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useTemplates } from '../hooks/useTemplates';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  setFilterCategory,
  setFilterTag,
  setFilterSearch,
  clearFilters,
} from '../store/slices/templatesSlice';
import TemplateCard from './TemplateCard';
import TemplateDetailView from './TemplateDetailView';
import type { Template } from '../store/slices/templatesSlice';

interface TemplateLibraryProps {
  onSelectTemplate?: (template: Template) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onSelectTemplate }) => {
  const dispatch = useDispatch<AppDispatch>();
  const filters = useSelector((state: RootState) => state.templates.filters);

  // Local state for search input (debounced)
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Local state for detail view
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);

  // Fetch templates with current filters
  const { data: templates, isLoading, error } = useTemplates({
    category: filters.category || undefined,
    tag: filters.tag || undefined,
    search: filters.search || undefined,
  }) as { data: Template[] | undefined; isLoading: boolean; error: Error | null };

  // Handle category filter change
  const handleCategoryChange = (category: string) => {
    dispatch(setFilterCategory(category || null));
  };

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(setFilterSearch(searchInput || null));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput, dispatch]);

  // Get unique tags from all templates for filter
  const allTags = React.useMemo(() => {
    if (!templates) return [];
    const tagSet = new Set<string>();
    templates.forEach((template) => {
      template.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [templates]);

  // Handle template card click - open detail view
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setDetailViewOpen(true);
  };

  // Handle closing detail view
  const handleCloseDetailView = () => {
    setDetailViewOpen(false);
    // Clear selection after animation completes
    setTimeout(() => setSelectedTemplate(null), 200);
  };

  // Handle using template from detail view
  const handleUseTemplate = (template: Template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchInput('');
  };

  return (
    <Box>
      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter Templates
        </Typography>
        <Grid container spacing={2}>
          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search templates..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Category Filter */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category || ''}
                label="Category"
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="code">Code</MenuItem>
                <MenuItem value="content">Content</MenuItem>
                <MenuItem value="analysis">Analysis</MenuItem>
                <MenuItem value="creative">Creative</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Tag Filter */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Tag</InputLabel>
              <Select
                value={filters.tag || ''}
                label="Tag"
                onChange={(e) => dispatch(setFilterTag(e.target.value || null))}
              >
                <MenuItem value="">All Tags</MenuItem>
                {allTags.map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Active Filters Display */}
        {(filters.category || filters.tag || filters.search) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Active filters:
            </Typography>
            {filters.category && (
              <Chip
                label={`Category: ${filters.category}`}
                size="small"
                onDelete={() => handleCategoryChange('')}
              />
            )}
            {filters.tag && (
              <Chip
                label={`Tag: ${filters.tag}`}
                size="small"
                onDelete={() => dispatch(setFilterTag(null))}
              />
            )}
            {filters.search && (
              <Chip
                label={`Search: ${filters.search}`}
                size="small"
                onDelete={() => {
                  dispatch(setFilterSearch(null));
                  setSearchInput('');
                }}
              />
            )}
            <Chip
              label="Clear all"
              size="small"
              variant="outlined"
              onClick={handleClearFilters}
            />
          </Box>
        )}
      </Paper>

      {/* Templates Grid */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load templates: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      )}

      {!isLoading && !error && templates && templates.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No templates found. Try adjusting your filters.
          </Typography>
        </Paper>
      )}

      {!isLoading && !error && templates && templates.length > 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {templates.length} template{templates.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <TemplateCard template={template} onSelect={handleSelectTemplate} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Template Detail View Modal */}
      <TemplateDetailView
        template={selectedTemplate}
        open={detailViewOpen}
        onClose={handleCloseDetailView}
        onUseTemplate={handleUseTemplate}
      />
    </Box>
  );
};

export default TemplateLibrary;
