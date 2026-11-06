import React, { useState, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Link,
  Typography,
  Paper,
  Tooltip,
} from "@mui/material";
import { fetchHello } from "../services/api";

import logo from "../assets/img/zuzu-logo.png";
// PR Lens renders, regenerated from src/assets/diagrams/zuzu-stack.graph.json
import stackDiagram from "../assets/diagrams/zuzu-stack.svg";
import chatFlowDiagram from "../assets/diagrams/zuzu-stack-chat.svg";
import { GoTrueClient } from "@supabase/supabase-js";
import { CustomBackgroundPage } from "@/components/Layout.example";
import { COLORS } from "@/styles/themes";
import { BACKGROUND_COLORS } from "@/context/BackgroundContext";

function Logo() {
  return <img src={logo} alt="Logo" className="w-32 sm:w-14 md:w-32 lg:w-32" />;
}

type appProps = {
  message: string;
};

const SMOKE_BG =
  BACKGROUND_COLORS.find((c) => c.name === "smoke")?.color || "transparent";

type StackView = "architecture" | "chat";

const STACK_DIAGRAMS: Record<
  StackView,
  { label: string; src: string; alt: string }
> = {
  architecture: {
    label: "Architecture",
    src: stackDiagram,
    alt: "ZuZu architecture: React app and microsites call an Express API on Vercel, which reaches Supabase, OpenRouter and Mailgun",
  },
  chat: {
    label: "Chat flow",
    src: chatFlowDiagram,
    alt: "A playground chat: rate-limit check in Supabase, model policy, streamed reply from OpenRouter, then the exchange saved",
  },
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
  const [stackView, setStackView] = useState<StackView>("architecture");
  const activeDiagram = STACK_DIAGRAMS[stackView];

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
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor:
            BACKGROUND_COLORS.find((c) => c.name === "smoke")?.color ||
            "transparent",
          backdropFilter: "blur(2px)",
          border: "1px solid white",
          borderRadius: "8px",
        }}
        className="rounded-lg text-white mb-8"
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
                sx={{
                  borderRadius: "4px",
                  borderTextShadow: "1px 1px 2px rgba(153, 145, 145, 0.34)",
                }}
              >
                Welcome to ZuZu
              </Typography>
              <Typography
                variant="h5"
                paragraph
                sx={{
                  backgroundColor: "transparent",
                  color: COLORS.textSecondary,
                }}
              >
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
                  variant="outlined"
                  color="inherit"
                  size="large"
                  component={RouterLink}
                  to="/dashboard"
                  className="border-white text-white hover:bg-white hover:bg-opacity-10"
                  sx={{
                    color: COLORS.textPrimary,
                    backgroundColor: COLORS.transparentBlackDark,
                  }}
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
                  variant="outlined"
                  color="inherit"
                  size="large"
                  onClick={openModal}
                  className="border-white text-white hover:bg-white hover:bg-opacity-10"
                  sx={{
                    color: COLORS.textPrimary,
                    backgroundColor: COLORS.transparentBlackDark,
                  }}
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
        sx={{
          p: 3,
          mb: 6,
          border: "1px solid white",
          borderRadius: "8px",
          backgroundColor: "#00000066",
          color: "#f8d99dde",
        }}
        className="border border-gray-200"
      >
        <>
          {/* lazy load example */}
          <Typography variant="h6">
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

      {/* Stack diagram */}
      <Box
        sx={{
          mb: 6,
          p: 2,
          backgroundColor:
            BACKGROUND_COLORS.find((c) => c.name === "smoke")?.color ||
            "transparent",
          border: "1px solid #fff",
          borderRadius: "8px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            mb: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{ pl: 1, fontWeight: 500, color: "#f8d99d" }}
          >
            How ZuZu fits together
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {(Object.keys(STACK_DIAGRAMS) as StackView[]).map((view) => {
              const active = view === stackView;
              return (
                <Button
                  key={view}
                  size="small"
                  variant="outlined"
                  onClick={() => setStackView(view)}
                  aria-pressed={active}
                  sx={{
                    color: active ? "#000" : "#f8d99d",
                    backgroundColor: active
                      ? "#f8d99d"
                      : COLORS.transparentBlackDark,
                    border: "1px solid #f8d99d",
                    "&:hover": {
                      backgroundColor: active ? "#f8d99d" : "#f8d99d22",
                      border: "1px solid #f8d99d",
                    },
                  }}
                >
                  {STACK_DIAGRAMS[view].label}
                </Button>
              );
            })}
          </Box>
        </Box>
        <Link
          href={activeDiagram.src}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ display: "block" }}
        >
          <Box
            component="img"
            src={activeDiagram.src}
            alt={activeDiagram.alt}
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              borderRadius: "8px",
            }}
          />
        </Link>
      </Box>

      {/* Technologies grid */}
      <Box>
        {[
          { title: "Frontend Technologies", items: frontendTech },
          { title: "Backend Technologies", items: backendTech },
          { title: "Development Tools", items: devTools },
        ].map((section, i) => (
          <Box key={section.title} sx={{ mt: i === 0 ? 4 : 2 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 500,
                color: "#f8d99d",
                backgroundColor: SMOKE_BG,
                border: "1px solid #fff",
                borderRadius: "8px",
                px: 2,
                py: 0.5,
                mb: 1,
              }}
            >
              {section.title}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {section.items.map((tech) => (
                <Tooltip
                  key={tech.name}
                  title={tech.description}
                  arrow
                  enterTouchDelay={0}
                >
                  <Box
                    component="span"
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      lineHeight: 1.4,
                      whiteSpace: "nowrap",
                      borderRadius: "6px",
                      color: "#f5f5f5",
                      backgroundColor: "rgba(10, 10, 14, 0.78)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      cursor: "default",
                      transition: "background-color 150ms, border-color 150ms",
                      "&:hover": {
                        backgroundColor: "rgba(10, 10, 14, 0.92)",
                        borderColor: "#f8d99d",
                      },
                    }}
                  >
                    {tech.name}
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Home;
