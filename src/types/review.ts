/**
 * Code Review Data Types
 *
 * Type definitions for the codebase review system that monitors
 * code quality, architecture, security, dependencies, and documentation.
 */

export interface ReviewMetrics {
  critical: number;
  warnings: number;
  info: number;
  total: number;
}

export type ReviewStatus = 'critical' | 'warning' | 'pass' | 'unknown';

export interface ReviewCategory {
  category: string;
  displayName: string;
  lastUpdated: string;
  status: ReviewStatus;
  statusDisplay: string;
  healthScore: number;
  metrics: ReviewMetrics;
  findings?: ReviewFinding[];  // Nested findings for this category
}

export interface ReviewFinding {
  category: string;
  categoryDisplay: string;
  severity: 'critical' | 'warning' | 'info';
  issue: string;
  file: string;
  line: number | null;
  description: string;
  recommendation: string;
}

export interface CodeReviewSummary {
  lastUpdated: string;
  overallStatus: ReviewStatus;
  overallStatusDisplay: string;
  overallHealthScore: number;
  overallMetrics: ReviewMetrics;
  reviews: ReviewCategory[];
  findings: ReviewFinding[];
}

/**
 * Helper function to get status color for UI components
 */
export function getStatusColor(status: ReviewStatus): string {
  switch (status) {
    case 'critical':
      return '#f44336'; // Red
    case 'warning':
      return '#ff9800'; // Orange
    case 'pass':
      return '#4caf50'; // Green
    default:
      return '#9e9e9e'; // Grey
  }
}

/**
 * Helper function to get health score color
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return '#4caf50'; // Green
  if (score >= 60) return '#ff9800'; // Orange
  if (score >= 40) return '#ff5722'; // Deep Orange
  return '#f44336'; // Red
}
