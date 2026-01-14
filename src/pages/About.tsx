import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Chip,
  Link,
} from "@mui/material";

const FRONTEND_URL = "http://localhost:3000";
const BACKEND_URL = "http://localhost:5000/api";

type FeatureItem = {
  title: string;
  description: string;
};

type TechStackItem = {
  category: string;
  items: string[];
};

const About: React.FC = () => {
  const coreFeatures: FeatureItem[] = [
    {
      title: "Authentication & Security",
      description:
        "JWT-based authentication with refresh tokens, cookie-based sessions, bcrypt password hashing, and 2FA verification support.",
    },
    {
      title: "CSRF Protection",
      description:
        "Double Submit Cookie pattern implementation protecting all state-changing routes from cross-site request forgery attacks.",
    },
    {
      title: "OpenRouter Integration",
      description:
        "Unified API access to multiple AI models with streaming support for building intelligent features.",
    },
    {
      title: "LeetMaster",
      description:
        "Interactive coding practice environment with LLM-generated problems, real-time code execution, and progress tracking.",
    },
    {
      title: "Code Review System",
      description:
        "Automated code review capabilities with security analysis, best practices checks, and suppression management.",
    },
    {
      title: "Environment Detection",
      description:
        "Smart environment utilities for conditional feature rendering and auto-login support during local development.",
    },
  ];

  const techStack: TechStackItem[] = [
    {
      category: "Frontend",
      items: [
        "React 18",
        "TypeScript",
        "Redux Toolkit",
        "TanStack Query",
        "Material UI",
        "Tailwind CSS",
        "React Router",
      ],
    },
    {
      category: "Backend",
      items: [
        "Express",
        "Node.js",
        "JWT",
        "bcrypt",
        "log4js",
        "Morgan",
        "CORS",
      ],
    },
    {
      category: "Database & Services",
      items: ["Supabase", "OpenRouter API"],
    },
    {
      category: "Development",
      items: ["Webpack", "Cypress", "ESLint", "PostCSS"],
    },
  ];

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        About ZuZu
      </Typography>
      <Typography variant="subtitle1" paragraph color="text.secondary">
        A production-ready full-stack React scaffold with authentication,
        security, and AI integration
      </Typography>
      <Divider sx={{ my: 4 }} />

      <Grid container spacing={4}>
        {/* Project Purpose */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4 }} className="border border-gray-200">
            <Typography variant="h5" gutterBottom>
              Project Purpose
            </Typography>
            <Typography variant="body1" paragraph>
              ZuZu is a comprehensive full-stack application scaffold designed
              to accelerate modern web development. It provides production-ready
              implementations of common features including authentication,
              security, AI integration, and developer tools.
            </Typography>
            <Typography variant="body1" paragraph>
              Built with best practices in mind, ZuZu serves as both a learning
              resource and a launchpad for building secure, scalable web
              applications with React and TypeScript.
            </Typography>
            <Typography variant="body1">
              The project emphasizes security with CSRF protection, JWT
              authentication, password hashing, and configurable CORS policies.
              It integrates modern AI capabilities through OpenRouter and
              includes developer-friendly features like environment detection
              and auto-login for local development.
            </Typography>
          </Paper>
        </Grid>

        {/* Architecture */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4 }} className="border border-gray-200">
            <Typography variant="h5" gutterBottom>
              Architecture
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Frontend:</strong> React 18 with TypeScript for type
              safety, Redux Toolkit for global state, and TanStack Query for
              server state management. UI built with Material UI components and
              Tailwind CSS utilities.
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Backend:</strong> Express server with JWT authentication,
              cookie-based sessions, CSRF protection, and comprehensive logging
              via log4js. API routes handle authentication, AI integration, code
              review, and more.
            </Typography>
            <Typography variant="body1">
              <strong>Security:</strong> Double Submit Cookie CSRF protection,
              bcrypt password hashing, JWT access and refresh tokens, secure
              cookie configuration, and configurable CORS policies.
            </Typography>
          </Paper>
        </Grid>

        {/* Core Features */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 4 }} className="border border-gray-200">
            <Typography variant="h5" gutterBottom>
              Core Features
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {coreFeatures.map((feature) => (
                <Grid item xs={12} sm={6} md={4} key={feature.title}>
                  <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontSize: "1rem", fontWeight: 600 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Tech Stack */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 4 }} className="border border-gray-200">
            <Typography variant="h5" gutterBottom>
              Technology Stack
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {techStack.map((category) => (
                <Grid item xs={12} sm={6} md={3} key={category.category}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontSize: "0.95rem", fontWeight: 600 }}
                  >
                    {category.category}
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
                  >
                    {category.items.map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        size="small"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    ))}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Getting Started */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 4 }} className="border border-gray-200">
            <Typography variant="h5" gutterBottom>
              Getting Started
            </Typography>
            <Typography variant="body1" paragraph>
              Clone the repository and follow these steps:
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: "#1e1e1e",
                color: "#d4d4d4",
                borderRadius: 1,
                overflow: "auto",
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}
            >
              {`# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
cp server/.env.example server/.env

# Run frontend and backend concurrently
npm run dev

# Run tests
npm test`}
            </Box>
            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              Frontend: <code>{FRONTEND_URL}</code> | API:{" "}
              <code>{BACKEND_URL}</code>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              For detailed setup instructions, security configuration, and
              deployment guides, see the project's{" "}
              <Link
                href="https://github.com/mmdonohue/zuzu"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub repository
              </Link>
              .
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default About;
