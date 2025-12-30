// server/middleware/validation.middleware.ts
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors.js';

// Handle validation errors
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Signup validation rules
export const validateSignup = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain special character'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  handleValidationErrors
];

// Login validation rules
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Verify code validation
export const validateVerifyCode = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('code')
    .isInt({ min: 100000, max: 999999 })
    .withMessage('Valid 6-digit code is required'),
  handleValidationErrors
];

// Resend code validation
export const validateResendCode = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  handleValidationErrors
];

// Password reset request validation
export const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidationErrors
];

// Password reset confirm validation
export const validatePasswordResetConfirm = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain special character'),
  handleValidationErrors
];

// Template creation validation
export const validateTemplateCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Template name is required')
    .isLength({ max: 255 })
    .withMessage('Template name must be 255 characters or less'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['code', 'content', 'analysis', 'creative', 'custom'])
    .withMessage('Category must be one of: code, content, analysis, creative, custom'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Template content is required'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('style_guide_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('style_guide_id must be a valid UUID'),
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
  body('variables')
    .optional()
    .isArray()
    .withMessage('Variables must be an array'),
  body('variables.*.name')
    .if(body('variables').exists())
    .notEmpty()
    .withMessage('Variable name is required'),
  body('variables.*.label')
    .if(body('variables').exists())
    .notEmpty()
    .withMessage('Variable label is required'),
  body('variables.*.type')
    .if(body('variables').exists())
    .isIn(['text', 'textarea', 'select', 'number'])
    .withMessage('Variable type must be one of: text, textarea, select, number'),
  body('variables.*.required')
    .if(body('variables').exists())
    .optional()
    .isBoolean()
    .withMessage('Variable required field must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .if(body('tags').exists())
    .isString()
    .withMessage('All tags must be strings'),
  handleValidationErrors
];

// Template update validation
export const validateTemplateUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Template name must not be empty')
    .isLength({ max: 255 })
    .withMessage('Template name must be 255 characters or less'),
  body('category')
    .optional()
    .isIn(['code', 'content', 'analysis', 'creative', 'custom'])
    .withMessage('Category must be one of: code, content, analysis, creative, custom'),
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Template content must not be empty'),
  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be a string'),
  body('style_guide_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('style_guide_id must be a valid UUID'),
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('active must be a boolean'),
  body('variables')
    .optional()
    .isArray()
    .withMessage('Variables must be an array'),
  body('variables.*.name')
    .if(body('variables').exists())
    .notEmpty()
    .withMessage('Variable name is required'),
  body('variables.*.label')
    .if(body('variables').exists())
    .notEmpty()
    .withMessage('Variable label is required'),
  body('variables.*.type')
    .if(body('variables').exists())
    .isIn(['text', 'textarea', 'select', 'number'])
    .withMessage('Variable type must be one of: text, textarea, select, number'),
  body('variables.*.required')
    .if(body('variables').exists())
    .optional()
    .isBoolean()
    .withMessage('Variable required field must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .if(body('tags').exists())
    .isString()
    .withMessage('All tags must be strings'),
  handleValidationErrors
];

// Prompt enhancement validation
export const validatePromptEnhancement = [
  body('prompt')
    .trim()
    .notEmpty()
    .withMessage('Prompt is required')
    .isLength({ max: 10000 })
    .withMessage('Prompt must be 10000 characters or less'),
  body('style_guide_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('style_guide_id must be a valid UUID'),
  body('context')
    .optional()
    .isString()
    .withMessage('Context must be a string'),
  handleValidationErrors
];

// Template usage tracking validation
export const validateTemplateUsage = [
  body('template_id')
    .notEmpty()
    .withMessage('template_id is required')
    .isUUID()
    .withMessage('template_id must be a valid UUID'),
  body('model_used')
    .optional()
    .isString()
    .withMessage('model_used must be a string'),
  handleValidationErrors
];
