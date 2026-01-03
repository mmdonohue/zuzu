// server/utils/responses.ts
import { Response } from 'express';

export const sendSuccess = <T = unknown>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const sendError = <T = unknown>(
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: T
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
