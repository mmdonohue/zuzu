import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { Check as CheckIcon, Cancel as CancelIcon } from "@mui/icons-material";
import type {
  Template,
  TemplateVariable,
} from "../store/slices/templatesSlice";

type TemplateVariableSubstitutionProps = {
  template: Template | null;
  open: boolean;
  onClose: () => void;
  onApply: (substitutedContent: string) => void;
};

const TemplateVariableSubstitution: React.FC<
  TemplateVariableSubstitutionProps
> = ({ template, open, onClose, onApply }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset values when template changes
  useEffect(() => {
    if (template && template.variables) {
      const initialValues: Record<string, string> = {};
      template.variables.forEach((variable: TemplateVariable) => {
        initialValues[variable.name] = (variable as any).default || "";
      });
      setValues(initialValues);
      setErrors({});
    }
  }, [template]);

  if (!template || !template.variables || template.variables.length === 0) {
    return null;
  }

  const handleValueChange = (variableName: string, value: string) => {
    setValues((prev) => ({ ...prev, [variableName]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[variableName];
      return newErrors;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    template.variables?.forEach((variable: TemplateVariable) => {
      if (variable.required && !values[variable.name]?.trim()) {
        newErrors[variable.name] = `${variable.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApply = () => {
    if (!validate()) {
      return;
    }

    // Substitute variables in template content
    let substitutedContent = template.content;
    template.variables?.forEach((variable: TemplateVariable) => {
      const value = values[variable.name] || "";
      const pattern = new RegExp(`\\{\\{${variable.name}\\}\\}`, "g");
      substitutedContent = substitutedContent.replace(pattern, value);
    });

    onApply(substitutedContent);
    onClose();
  };

  const renderField = (variable: TemplateVariable) => {
    const value = values[variable.name] || "";
    const error = errors[variable.name];

    switch (variable.type) {
      case "textarea":
        return (
          <TextField
            key={variable.name}
            fullWidth
            multiline
            rows={4}
            label={variable.label}
            value={value}
            onChange={(e) => handleValueChange(variable.name, e.target.value)}
            error={!!error}
            helperText={error}
            required={variable.required}
          />
        );

      case "select":
        return (
          <FormControl
            key={variable.name}
            fullWidth
            error={!!error}
            required={variable.required}
          >
            <InputLabel>{variable.label}</InputLabel>
            <Select
              value={value}
              label={variable.label}
              onChange={(e) =>
                handleValueChange(variable.name, e.target.value as string)
              }
            >
              {(variable as any).options?.map((option: string) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {error && (
              <Typography
                variant="caption"
                color="error"
                sx={{ ml: 2, mt: 0.5 }}
              >
                {error}
              </Typography>
            )}
          </FormControl>
        );

      case "number":
        return (
          <TextField
            key={variable.name}
            fullWidth
            type="number"
            label={variable.label}
            value={value}
            onChange={(e) => handleValueChange(variable.name, e.target.value)}
            error={!!error}
            helperText={error}
            required={variable.required}
          />
        );

      case "text":
      default:
        return (
          <TextField
            key={variable.name}
            fullWidth
            label={variable.label}
            value={value}
            onChange={(e) => handleValueChange(variable.name, e.target.value)}
            error={!!error}
            helperText={error}
            required={variable.required}
          />
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Fill Template Variables</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3, mt: 1 }}>
          Please provide values for the template variables below.
        </Alert>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {template.variables?.map((variable: TemplateVariable) =>
            renderField(variable),
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} startIcon={<CancelIcon />} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          startIcon={<CheckIcon />}
          variant="contained"
          color="primary"
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateVariableSubstitution;
