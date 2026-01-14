import React, { useState, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Link,
  Typography,
  Paper,
} from "@mui/material";
import { fetchHello } from "../services/api";

import logo from "../assets/img/zuzu-logo.png";
import { GoTrueClient } from "@supabase/supabase-js";

function Logo() {
  return <img src={logo} alt="Logo" className="w-32 sm:w-14 md:w-32 lg:w-32" />;
}

type appProps = {
  message: string;
};

const Modal = lazy(() => delayForDemo(import("../components/Modal")));

const demo_delay = 2000;
function delayForDemo<T>(promise: Promise<T>): Promise<T> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, demo_delay);
  }).then(() => promise);
}

type AsciiAnimatorProps = {
  text: string;
  speed?: number; // ms per character
  loop?: boolean;
};

const AsciiAnimator: React.FC<AsciiAnimatorProps> = ({
  text,
  speed = 30,
  loop = false,
}) => {
  const [pos, setPos] = useState(0);
  const [visible, setVisible] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  const isAsciiArt = React.useMemo(() => {
    if (!text) return false;
    const lines = text.split("\n");
    return lines.length > 1 && lines.some((l) => l.trim().length > 10);
  }, [text]);

  // typing effect for normal text OR line-by-line for ASCII art
  useEffect(() => {
    setPos(0);
    setVisible("");
    setVisibleLines([]);
    if (!text) return;

    if (isAsciiArt) {
      const lines = text.split("\n");
      let idx = 0;
      const lineDelay = Math.max(40, speed * 4);
      const id = window.setInterval(() => {
        setVisibleLines((v) => [...v, lines[idx]]);
        idx += 1;
        if (idx >= lines.length) {
          window.clearInterval(id);
          if (loop) {
            setTimeout(() => setVisibleLines([]), 800);
          }
        }
      }, lineDelay);

      return () => window.clearInterval(id);
    }

    // fallback: character typing
    let t: number | null = null;
    t = window.setInterval(() => {
      setPos((p) => {
        const np = Math.min(text.length, p + 1);
        setVisible(text.slice(0, np));
        if (np === text.length && t) {
          window.clearInterval(t);
          if (loop) {
            setTimeout(() => {
              setPos(0);
              setVisible("");
            }, 800);
          }
        }
        return np;
      });
    }, speed);

    return () => {
      if (t) window.clearInterval(t);
    };
  }, [text, speed, loop, isAsciiArt]);

  // blinking cursor
  useEffect(() => {
    const id = window.setInterval(() => setShowCursor((s) => !s), 500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Box
      component="pre"
      sx={{
        fontFamily: "monospace",
        whiteSpace: "pre",
        fontSize: "0.95rem",
        m: 0,
      }}
    >
      {isAsciiArt ? visibleLines.join("\n") : visible}
      {showCursor && <Box component="span">█</Box>}
    </Box>
  );
};

const Home: React.FC<appProps> = ({ message }) => {
  // Example of using TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["hello"],
    queryFn: fetchHello,
  });

  const [showModal, setShowModal] = useState(false);

  const openModal = () => {
    setShowModal(true);
    // console.log('opening modal');
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const frontendTech = [
    {
      name: "React",
      description: "A JavaScript library for building user interfaces",
    },
    {
      name: "MUI",
      description: "React components for faster and easier web development",
    },
    {
      name: "TypeScript",
      description:
        "A typed superset of JavaScript that compiles to plain JavaScript",
    },
    {
      name: "Redux",
      description: "A predictable state container for JavaScript apps",
    },
    { name: "Tailwind CSS", description: "A utility-first CSS framework" },
    {
      name: "TanStack Query",
      description: "Powerful asynchronous state management for React",
    },
    {
      name: "React Router",
      description: "Declarative routing for React applications",
    },
    {
      name: "Axios",
      description: "Promise-based HTTP client for the browser and Node.js",
    },
  ];

  const backendTech = [
    {
      name: "Express",
      description: "Fast, unopinionated, minimalist web framework for Node.js",
    },
    {
      name: "log4js",
      description: "Logging framework for Node.js applications",
    },
    {
      name: "Morgan",
      description: "HTTP request logger middleware for Node.js",
    },
    { name: "Supabase", description: "The open source Firebase alternative" },
    {
      name: "OpenRouter",
      description:
        "Unified API for accessing multiple AI models with streaming support",
    },
    {
      name: "bcrypt",
      description: "Library for hashing and salting passwords",
    },
    { name: "JWT", description: "JSON Web Tokens for secure authentication" },
  ];

  const devTools = [
    {
      name: "Webpack",
      description: "A static module bundler for modern JavaScript applications",
    },
    { name: "Cypress", description: "JavaScript End to End Testing Framework" },
    {
      name: "TypeScript",
      description:
        "A typed superset of JavaScript that compiles to plain JavaScript",
    },
  ];

  return (
    <Box>
      {/* Hero section */}
      <Box
        sx={{
          py: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
        className="bg-gradient-to-r from-zuzu-primary to-zuzu-secondary rounded-lg text-white mb-8"
      >
        <Container maxWidth="md">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "center", md: "flex-start" },
              flexDirection: { xs: "column", md: "row" },
              gap: 4,
            }}
          >
            {/* Logo box on the left */}
            <Box
              sx={{
                border: "2px solid white",
                borderRadius: "8px",
                p: 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: { xs: "120px", sm: "150px", md: "180px" },
                height: { xs: "120px", sm: "150px", md: "180px" },
              }}
            >
              {Logo()}
            </Box>

            {/* Text content on the right */}
            <Box
              sx={{ textAlign: { xs: "center", md: "center" }, flexGrow: 1 }}
            >
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                fontWeight="bold"
              >
                Welcome to ZuZu
              </Typography>
              <Typography variant="h5" paragraph>
                A React scaffold application for integrating multiple tech
                stacks
              </Typography>
              <Box
                sx={{
                  mt: 4,
                  display: "flex",
                  justifyContent: { xs: "center", md: "center" },
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={RouterLink}
                  to="/dashboard"
                  className="btn-secondary"
                >
                  Dashboard
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  component={RouterLink}
                  to="/about"
                  className="border-white text-white hover:bg-white hover:bg-opacity-10"
                >
                  Learn More
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={openModal}
                  className="btn-secondary"
                >
                  Messages
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  component={Link}
                  href="https://github.com/mmdonohue/zuzu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-white text-white hover:bg-white hover:bg-opacity-10"
                >
                  GitHub
                </Button>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
      {/* API response example */}
      <Paper
        elevation={0}
        sx={{ p: 3, mb: 6 }}
        className="border border-gray-200 bg-gray-50"
      >
        <>
          {/* lazy load example */}
          <Typography variant="h6" color="text.primary">
            <Suspense fallback={"loading messages..."}>
              {showModal && <Modal onClose={closeModal} message={message} />}
            </Suspense>
          </Typography>
        </>
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">Error connecting to API</Typography>
        ) : (
          <AsciiAnimator
            text={data?.message || "No message received"}
            speed={25}
          />
        )}
      </Paper>

      {/* Technologies grid */}
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Frontend Technologies
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {frontendTech.map((tech) => (
            <Grid item xs={12} sm={6} md={4} key={tech.name}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {tech.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tech.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h5" gutterBottom>
          Backend Technologies
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {backendTech.map((tech) => (
            <Grid item xs={12} sm={6} md={4} key={tech.name}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {tech.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tech.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h5" gutterBottom>
          Development Tools
        </Typography>
        <Grid container spacing={3}>
          {devTools.map((tech) => (
            <Grid item xs={12} sm={6} md={4} key={tech.name}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {tech.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tech.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Home;
