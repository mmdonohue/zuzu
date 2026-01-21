import React, { useState, useEffect } from "react";
import { Box, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Typography, CircularProgress, Alert, Paper, InputAdornment, Chip } from '@mui/material';
import { Search as SearchIcon } from "@mui/icons-material";
import { useTemplates } from "../hooks/useTemplates";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import {
  setFilterCategory,
  setFilterTag,
  setFilterSearch,
  clearFilters,
} from "../store/slices/templatesSlice";
import TemplateCard from "./TemplateCard";
import TemplateDetailView from "./TemplateDetailView";
import type { Template } from "../store/slices/templatesSlice";

const bgOptions = ["#ffffff44", "#00000044", "#ff000044", "#00ff0044", "#0000ff44"];
const bgOptionIndex = 1;

type TemplateLibraryProps = {
  onSelectTemplate?: (template: Template) => void;
  onEditTemplate?: (template: Template) => void;
  onDeleteTemplate?: (template: Template) => void;
};

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const filters = useSelector((state: RootState) => state.templates.filters);

  // Local state for search input (debounced)
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Local state for detail view
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [detailViewOpen, setDetailViewOpen] = useState(false);

  // Fetch templates with current filters
  const {
    data: templates,
    isLoading,
    error,
  } = useTemplates({
    category: filters.category || undefined,
    tag: filters.tag || undefined,
    search: filters.search || undefined,
  }) as {
    data: Template[] | undefined;
    isLoading: boolean;
    error: Error | null;
  };

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
    setSearchInput("");
  };

  return (
    <Box>
      {/* Filters Section */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: bgOptions[bgOptionIndex],
          border: "1px solid #fff",
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: "#fff" }}>
          Filter Templates
        </Typography>
        <Grid container spacing={2}>
          {/* Search */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search templates..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{
                backgroundColor: "#00000044",
                border: "1px solid #fff",
                borderRadius: 1,
                "& .MuiInputBase-input": {
                  color: "#fff",
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "#ffffff99",
                  opacity: 1,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "#fff" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Category Filter */}
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "#fff !important", "& .Mui-focused": { color: '#fff' }}} >Category</InputLabel>
              <Select
                value={filters.category || ""}
                label="Category"
                onChange={(e) => handleCategoryChange(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: bgOptions[bgOptionIndex],
                      color: '#fff',
                    },
                  },
                  sx: {
                    // Target all MenuItem components within the Menu
                    "& .MuiMenuItem-root": {
                      // Default styles for the menu items
                      backgroundColor: bgOptions[bgOptionIndex],
                      backdropFilter: "blur(4px)",
                      "&:hover": {
                        backgroundColor: "#ffffff66", // Example hover background color (light red)
                      },
                      "&.Mui-selected": {
                        backgroundColor: "transparent", // Optional: Style for the selected item
                        "&:hover": {
                          backgroundColor: "transparent", // Optional: Hover style for selected item
                        },
                      },
                    }
                  }}
                }
                sx={{
                  backgroundColor: "#ffffff44",
                  color: "#fff",
                  border: "1px solid #fff",
                  "& .MuiInputLabel-root": { color: '#fff' }, 
                  "& .MuiInputLabel-root.Mui-focused": { color: '#fff' }, 
                  "& .MuiSvgIcon-root": {
                    color: "#fff",
                  },
                  "&:hover": {
                    backgroundColor: bgOptions[bgOptionIndex],
                  },
                }}
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
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "#fff !important", "& .Mui-focused": { color: '#fff' }}}>Tag</InputLabel>
              <Select
                value={filters.tag || ""}
                label="Tag"
                onChange={(e) => dispatch(setFilterTag(e.target.value || null))}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: bgOptions[bgOptionIndex],
                      color: '#fff !important',
                    },
                  },
                  sx: {
                    // Target all MenuItem components within the Menu
                    "& .MuiMenuItem-root": {
                      // Default styles for the menu items
                      backgroundColor: bgOptions[bgOptionIndex],
                      backdropFilter: "blur(4px)",
                      "&:hover": {
                        backgroundColor: "#ffffff66", // Example hover background color (light red)
                      },
                      "&.Mui-selected": {
                        backgroundColor: "transparent", // Optional: Style for the selected item
                        "&:hover": {
                          backgroundColor: "transparent", // Optional: Hover style for selected item
                        },
                      },
                    }
                  }}
                }
                sx={{
                  backgroundColor: "#ffffff44",
                  color: "#fff",
                  border: "1px solid #fff",
                  "& .MuiSvgIcon-root": {
                    color: "#fff",
                  },
                  "&:hover": {
                    backgroundColor: "#ffffff66",
                  },
                }}
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
          <Box
            sx={{
              mt: 2,
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" sx={{ color: "#ffffff99" }}>
              Active filters:
            </Typography>
            {filters.category && (
              <Chip
                label={`Category: ${filters.category}`}
                size="small"
                onDelete={() => handleCategoryChange("")}
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
                  setSearchInput("");
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
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load templates:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </Alert>
      )}

      {!isLoading && !error && templates && templates.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            backgroundColor: "#ffffff44",
            border: "1px solid #fff",
          }}
        >
          <Typography variant="body1" sx={{ color: "#ffffff99" }}>
            No templates found. Try adjusting your filters.
          </Typography>
        </Paper>
      )}

      {!isLoading && !error && templates && templates.length > 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Showing {templates.length} template
              {templates.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={template.id}>
                <TemplateCard
                  template={template}
                  onSelect={handleSelectTemplate}
                />
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
        onEditTemplate={onEditTemplate}
        onDeleteTemplate={onDeleteTemplate}
      />
    </Box>
  );
};

export default TemplateLibrary;
