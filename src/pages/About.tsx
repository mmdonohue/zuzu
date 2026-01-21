import React from "react";
import { Box, Typography, Paper, Grid, Divider, Chip, Link } from '@mui/material';
import { BACKGROUND_COLORS } from "@/context/BackgroundContext";
import { COLORS } from "@/styles/themes";

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
      {/* Hero Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4,
          mb: 4,
          backgroundColor: COLORS.transparentBlack,
          backdropFilter: "blur(2px)",
          border: `1px solid ${COLORS.borderWhite}`,
        }}
      >
        <Grid container spacing={4} alignItems="center">
          {/* Text Content - Left Side */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                color: COLORS.textPrimary,
                mb: 2,
              }}
            >
              About ZuZu
            </Typography>
            <Typography 
              variant="h6" 
              paragraph 
              sx={{ 
                color: COLORS.textSecondary,
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              A production-ready full-stack React scaffold with authentication,
              security, and AI integration
            </Typography>
          </Grid>

          {/* Image - Right Side */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                background: "radial-gradient(circle, rgba(247, 210, 90, 0.7) 0%, transparent 70%)",
              }}
            >
              <img 
                src="/images/overview_yatai.png" 
                alt="ZuZu About Image" 
                style={{ 
                  width: "100%",
                  maxWidth: "500px",
                  height: "auto",
                  borderRadius: "8px",
                  border: `1px solid ${COLORS.borderWhite}`,
                  opacity: 0.7,
                }} 
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 4, borderColor: COLORS.transparentWhite }} />

      <Grid container spacing={4}>
        {/* Project Purpose */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4,
              backgroundColor: COLORS.transparentBlack,
              backdropFilter: "blur(2px)",
              border: `1px solid ${COLORS.borderWhite}`,
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ color: COLORS.textPrimary }}>
              Project Purpose
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: COLORS.textPrimary }}>
              ZuZu is a comprehensive full-stack application scaffold designed
              to accelerate modern web development. It provides production-ready
              implementations of common features including authentication,
              security, AI integration, and developer tools.
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: COLORS.textPrimary }}>
              Built with best practices in mind, ZuZu serves as both a learning
              resource and a launchpad for building secure, scalable web
              applications with React and TypeScript.
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.textPrimary }}>
              The project emphasizes security with CSRF protection, JWT
              authentication, password hashing, and configurable CORS policies.
              It integrates modern AI capabilities through OpenRouter and
              includes developer-friendly features like environment detection
              and auto-login for local development.
            </Typography>
          </Paper>
        </Grid>

        {/* Architecture */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4,
              backgroundColor: COLORS.transparentBlack,
              backdropFilter: "blur(2px)",
              border: `1px solid ${COLORS.borderWhite}`,
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ color: COLORS.textPrimary }}>
              Architecture
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: COLORS.textPrimary }}>
              <strong>Frontend:</strong> React 18 with TypeScript for type
              safety, Redux Toolkit for global state, and TanStack Query for
              server state management. UI built with Material UI components and
              Tailwind CSS utilities.
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: COLORS.textPrimary }}>
              <strong>Backend:</strong> Express server with JWT authentication,
              cookie-based sessions, CSRF protection, and comprehensive logging
              via log4js. API routes handle authentication, AI integration, code
              review, and more.
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.textPrimary }}>
              <strong>Security:</strong> Double Submit Cookie CSRF protection,
              bcrypt password hashing, JWT access and refresh tokens, secure
              cookie configuration, and configurable CORS policies.
            </Typography>
          </Paper>
        </Grid>

        {/* Core Features */}
        <Grid size={{ xs: 12 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4,
              backgroundColor: COLORS.transparentBlack,
              backdropFilter: "blur(2px)",
              border: `1px solid ${COLORS.borderWhite}`,
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ color: COLORS.textPrimary }}>
              Core Features
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {coreFeatures.map((feature) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.title}>
                  <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontSize: "1rem", fontWeight: 600, color: COLORS.textPrimary }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Tech Stack */}
        <Grid size={{ xs: 12 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4,
              backgroundColor: COLORS.transparentBlack,
              backdropFilter: "blur(2px)",
              border: `1px solid ${COLORS.borderWhite}`,
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ color: COLORS.textPrimary }}>
              Technology Stack
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {techStack.map((category) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={category.category}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontSize: "0.95rem", fontWeight: 600, color: COLORS.textPrimary }}
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
                        sx={{ 
                          fontSize: "0.75rem", 
                          fontWeight: 600, 
                          color: COLORS.textPrimary,
                          backgroundColor: COLORS.transparentBlack,
                          border: `1px solid ${COLORS.borderWhite}`,
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Getting Started */}
        <Grid size={{ xs: 12 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4,
              backgroundColor: COLORS.transparentBlack,
              backdropFilter: "blur(2px)",
              border: `1px solid ${COLORS.borderWhite}`,
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ color: COLORS.textPrimary }}>
              Getting Started
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: COLORS.textPrimary }}>
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
                border: `1px solid ${COLORS.borderWhite}`,
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
            <Typography variant="body1" paragraph sx={{ mt: 2, color: COLORS.textPrimary }}>
              Frontend: <code>{FRONTEND_URL}</code> | API:{" "}
              <code>{BACKEND_URL}</code>
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
              For detailed setup instructions, security configuration, and
              deployment guides, see the project's{" "}
              <Link
                href="https://github.com/mmdonohue/zuzu"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  color: COLORS.textPrimary,
                  textDecoration: "underline",
                  "&:hover": {
                    color: COLORS.accentBlue,
                  }
                }}
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
