/**
 * Layout Component - Usage Examples
 *
 * This file demonstrates different ways to use the Layout component
 * across your application.
 */

import React from "react";
import Layout from "./Layout";
import { Box } from "@mui/material";

// ============================================
// Example 1: Standard Layout (Default)
// ============================================
export const StandardPage: React.FC = () => {
  return (
    <Layout>
      <h1>Standard Page</h1>
      <p>This uses the default 'lg' container width with gutters.</p>
    </Layout>
  );
};

// ============================================
// Example 2: Full Width Layout
// ============================================
export const FullWidthPage: React.FC = () => {
  return (
    <Layout fullWidth>
      <Box sx={{ width: "100%", p: 2 }}>
        <h1>Full Width Page</h1>
        <p>This page spans the full viewport width (no container).</p>
        <p>Useful for dashboards, maps, or custom grid layouts.</p>
      </Box>
    </Layout>
  );
};

// ============================================
// Example 3: Custom Max Width
// ============================================
export const NarrowPage: React.FC = () => {
  return (
    <Layout maxWidth="sm">
      <h1>Narrow Layout</h1>
      <p>This page uses a smaller 'sm' container width.</p>
      <p>Perfect for forms, login pages, or focused content.</p>
    </Layout>
  );
};

// ============================================
// Example 4: Extra Wide Layout
// ============================================
export const WidePage: React.FC = () => {
  return (
    <Layout maxWidth="xl">
      <h1>Extra Wide Layout</h1>
      <p>This page uses the 'xl' container width.</p>
      <p>Great for data tables, galleries, or rich content.</p>
    </Layout>
  );
};

// ============================================
// Example 5: Page with Custom Background
// ============================================
export const CustomBackgroundPage: React.FC = () => {
  return (
    <Layout>
      <Box
        sx={{
          position: "relative",
          minHeight: "400px",
          // Page-specific background overlay
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/custom-page-bg.jpg)",
            backgroundSize: "cover",
            opacity: 0.1,
            zIndex: -1,
            borderRadius: 2,
          },
        }}
      >
        <h1>Custom Background</h1>
        <p>
          This page has its own background image in addition to the site-wide
          one.
        </p>
      </Box>
    </Layout>
  );
};

// ============================================
// How to Configure Site-Wide Background
// ============================================
/**
 * To change the site-wide background image:
 *
 * 1. Add your image to the public folder:
 *    - public/images/background.jpg
 *
 * 2. Update Layout.tsx line 34:
 *    backgroundImage: 'url(/images/background.jpg)',
 *
 * 3. Adjust opacity (line 39) to control visibility:
 *    opacity: 0.05,  // Very subtle (default)
 *    opacity: 0.15,  // More visible
 *    opacity: 0.3,   // Prominent
 *
 * 4. Alternative: Use gradient overlays:
 *    backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/images/bg.jpg)',
 *
 * 5. For different backgrounds per page:
 *    - Create a backgroundImage prop in Layout.tsx
 *    - Pass different images from each page
 *    - Or use the CustomBackgroundPage pattern above
 */

// ============================================
// CSS Alternatives (if preferred)
// ============================================
/**
 * You can also define backgrounds in global CSS:
 *
 * In src/styles/globals.css:
 *
 * body {
 *   background-image: url('/images/background.jpg');
 *   background-size: cover;
 *   background-attachment: fixed;
 *   background-position: center;
 * }
 *
 * This approach is simpler but less flexible.
 */

export default {
  StandardPage,
  FullWidthPage,
  NarrowPage,
  WidePage,
  CustomBackgroundPage,
};
