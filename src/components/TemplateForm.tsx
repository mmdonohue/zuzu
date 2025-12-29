import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Chip,
  Grid,
  Switch,
  FormControlLabel,
  IconButton,
  Divider,
  Alert,
  Autocomplete,
  FormLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import StyleGuideSelector from './StyleGuideSelector';
import type { Template, TemplateVariable, StyleGuide } from '../store/slices/templatesSlice';

interface TemplateFormProps {
  template?: Template | null;
  onSubmit: (templateData: TemplateFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface TemplateFormData {
  name: string;
  description?: string;
  category: 'code' | 'content' | 'analysis' | 'creative' | 'custom';
  content: string;
  variables?: TemplateVariable[];
  style_guide_id?: string;
  is_public?: boolean;
  tags?: string[];
}

const defaultVariable: TemplateVariable = {
  name: '',
  label: '',
  type: 'text',
  required: false,
};

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  // Form state
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState<TemplateFormData['category']>(
    template?.category || 'custom'
  );
  const [content, setContent] = useState(template?.content || '');
  const [variables, setVariables] = useState<TemplateVariable[]>(
    template?.variables || []
  );
  const [styleGuideId, setStyleGuideId] = useState<string | null>(
    template?.style_guide_id || null
  );
  const [isPublic, setIsPublic] = useState(template?.is_public || false);
  const [tags, setTags] = useState<string[]>(template?.tags || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when template prop changes
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setCategory(template.category);
      setContent(template.content);
      setVariables(template.variables || []);
      setStyleGuideId(template.style_guide_id);
      setIsPublic(template.is_public);
      setTags(template.tags || []);
    }
  }, [template]);

  // Add a new variable
  const handleAddVariable = () => {
    setVariables([...variables, { ...defaultVariable }]);
  };

  // Remove a variable
  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  // Update a variable field
  const handleVariableChange = (
    index: number,
    field: keyof TemplateVariable,
    value: any
  ) => {
    const newVariables = [...variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    setVariables(newVariables);
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!content.trim()) {
      newErrors.content = 'Template content is required';
    }

    // Validate variables
    variables.forEach((variable, index) => {
      if (!variable.name.trim()) {
        newErrors[`variable_${index}_name`] = 'Variable name is required';
      }
      if (!variable.label.trim()) {
        newErrors[`variable_${index}_label`] = 'Variable label is required';
      }
      // Check for duplicate variable names
      const duplicateIndex = variables.findIndex(
        (v, i) => i !== index && v.name === variable.name
      );
      if (duplicateIndex !== -1) {
        newErrors[`variable_${index}_name`] = 'Variable name must be unique';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const formData: TemplateFormData = {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      content: content.trim(),
      variables: variables.length > 0 ? variables : undefined,
      style_guide_id: styleGuideId || undefined,
      is_public: isPublic,
      tags: tags.length > 0 ? tags : undefined,
    };

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting template:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {template ? 'Edit Template' : 'Create New Template'}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* Name */}
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              required
              label="Template Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              disabled={isSubmitting}
            />
          </Grid>

          {/* Category */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value as TemplateFormData['category'])}
                disabled={isSubmitting}
              >
                <MenuItem value="code">Code</MenuItem>
                <MenuItem value="content">Content</MenuItem>
                <MenuItem value="analysis">Analysis</MenuItem>
                <MenuItem value="creative">Creative</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              helperText="Brief description of what this template does"
              disabled={isSubmitting}
            />
          </Grid>

          {/* Content - Monaco Editor */}
          <Grid item xs={12}>
            <Box>
              <FormLabel required error={!!errors.content}>
                Template Content
              </FormLabel>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
                Use {`{{variableName}}`} syntax for variables that will be replaced
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  height: '400px',
                  overflow: 'hidden',
                  border: errors.content ? 2 : 1,
                  borderColor: errors.content ? 'error.main' : 'divider',
                }}
              >
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  value={content}
                  onChange={(value) => setContent(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    readOnly: isSubmitting,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                  }}
                  theme="vs"
                />
              </Paper>
              {errors.content && (
                <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5, display: 'block' }}>
                  {errors.content}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Variables */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1">Variables</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddVariable}
                disabled={isSubmitting}
                size="small"
              >
                Add Variable
              </Button>
            </Box>

            {variables.length === 0 ? (
              <Alert severity="info">
                No variables defined. Add variables to make your template dynamic.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {variables.map((variable, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Variable Name"
                          value={variable.name}
                          onChange={(e) =>
                            handleVariableChange(index, 'name', e.target.value)
                          }
                          error={!!errors[`variable_${index}_name`]}
                          helperText={errors[`variable_${index}_name`]}
                          disabled={isSubmitting}
                          placeholder="e.g., topic"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Label"
                          value={variable.label}
                          onChange={(e) =>
                            handleVariableChange(index, 'label', e.target.value)
                          }
                          error={!!errors[`variable_${index}_label`]}
                          helperText={errors[`variable_${index}_label`]}
                          disabled={isSubmitting}
                          placeholder="e.g., Topic"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={variable.type}
                            label="Type"
                            onChange={(e) =>
                              handleVariableChange(
                                index,
                                'type',
                                e.target.value as TemplateVariable['type']
                              )
                            }
                            disabled={isSubmitting}
                          >
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="textarea">Textarea</MenuItem>
                            <MenuItem value="select">Select</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={variable.required}
                              onChange={(e) =>
                                handleVariableChange(index, 'required', e.target.checked)
                              }
                              disabled={isSubmitting}
                            />
                          }
                          label="Required"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveVariable(index)}
                          disabled={isSubmitting}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            )}
          </Grid>

          {/* Style Guide */}
          <Grid item xs={12}>
            <StyleGuideSelector
              value={styleGuideId}
              onChange={(id, styleGuide) => setStyleGuideId(id)}
              helperText="Optional: Select a style guide to apply to this template"
              showDetails={true}
            />
          </Grid>

          {/* Tags */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={tags}
              onChange={(e, newValue) => setTags(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    size="small"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  helperText="Press Enter to add tags"
                />
              )}
              disabled={isSubmitting}
            />
          </Grid>

          {/* Public Toggle */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={isSubmitting}
                />
              }
              label="Make this template public (visible to all users)"
            />
          </Grid>
        </Grid>

        {/* Form Actions */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default TemplateForm;
