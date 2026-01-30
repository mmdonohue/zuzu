import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Button,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import CodeIcon from "@mui/icons-material/Code";
import DescriptionIcon from "@mui/icons-material/Description";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ExtensionIcon from "@mui/icons-material/Extension";
import PreviewIcon from "@mui/icons-material/Preview";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import { fetchCodeReviewSummary, fetchWithCsrf } from "../services/api";
import {
  CodeReviewSummary,
  ReviewFinding,
  getStatusColor,
  getHealthScoreColor,
} from "../types/review";
import zuzuLogo from "../assets/img/zuzu-logo.png";
import { isLocalEnvironment } from "../utils/environment";

import { BACKGROUND_COLORS } from "@/context/BackgroundContext";
import { COLORS } from "@/styles/themes";

// Icon mapping for categories
const categoryIcons: Record<string, React.ReactElement> = {
  security: <SecurityIcon />,
  quality: <CodeIcon />,
  docs: <DescriptionIcon />,
  documentation: <DescriptionIcon />,
  architecture: <AccountTreeIcon />,
  dependencies: <ExtensionIcon />,
};

// Helper function to get shortened display names
const getShortDisplayName = (displayName: string): string => {
  const shortNames: Record<string, string> = {
    Dependencies: "Deps",
    Architecture: "Arch",
  };
  return shortNames[displayName] || displayName;
};

const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof ReviewFinding>("severity");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [showExample, setShowExample] = useState(false);
  const [isRunningReview, setIsRunningReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const MAX_DESCRIPTION_LENGTH = 150;
  const RESET_INTERVAL_MS = 30000;
  // Fetch code review data
  const { data, isLoading, error, refetch } = useQuery<CodeReviewSummary>({
    queryKey: ["codeReview", showExample],
    queryFn: () => fetchCodeReviewSummary(showExample),
    refetchInterval: RESET_INTERVAL_MS, // Refetch every 30 seconds
  });

  // Filter and sort findings
  const filteredFindings = useMemo(() => {
    if (!data?.findings) return [];

    let filtered = data.findings.filter((finding) => {
      // Apply category filter first
      const matchesCategory =
        !selectedCategory || finding.category === selectedCategory;

      // Apply search filter
      const matchesSearch =
        !searchTerm ||
        finding.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    // Sort findings
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    filtered.sort((a, b) => {
      const aVal =
        orderBy === "severity" ? severityOrder[a.severity] : a[orderBy];
      const bVal =
        orderBy === "severity" ? severityOrder[b.severity] : b[orderBy];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (order === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [data?.findings, searchTerm, selectedCategory, orderBy, order]);

  const handleRequestSort = (property: keyof ReviewFinding) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCategoryClick = (category: string) => {
    // Toggle category filter: if clicking the same category, clear filter
    setSelectedCategory(selectedCategory === category ? null : category);
    setPage(0); // Reset to first page when filter changes
  };

  const handleRunReview = async () => {
    setIsRunningReview(true);
    setReviewError(null);

    const CSRF_RETRY_DELAY_MS = 100;

    try {
      const response = await fetchWithCsrf("/api/review/trigger", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // If CSRF validation failed, retry once with a fresh token
        if (
          response.status === 403 &&
          errorData?.code === "CSRF_VALIDATION_FAILED"
        ) {
          console.log("CSRF token failed, retrying with fresh token...");

          // Wait a moment for the token to be refreshed
          await new Promise((resolve) =>
            setTimeout(resolve, CSRF_RETRY_DELAY_MS),
          );

          // Retry the request
          const retryResponse = await fetchWithCsrf("/api/review/trigger", {
            method: "POST",
          });

          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json().catch(() => null);
            throw new Error(
              retryErrorData?.message ||
                "Failed to run code review after retry",
            );
          }

          const retryResult = await retryResponse.json();

          // Refetch the review data to show updated results
          await refetch();

          console.log("Code review completed after retry:", retryResult);
          return; // Success on retry
        }

        throw new Error(errorData?.message || "Failed to run code review");
      }

      const result = await response.json();

      // Refetch the review data to show updated results
      await refetch();

      console.log("Code review completed:", result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setReviewError(errorMessage);
      console.error("Error running code review:", err);
    } finally {
      setIsRunningReview(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading code review data. Make sure the review has been run and
          the backend is running.
        </Alert>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">
          No code review data available. Run the code review to generate
          metrics.
        </Alert>
      </Container>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
          p: 2,
          maxHeight: "130px",
          backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent", 
          backdropFilter: "blur(2px)",
          border: "1px solid #fff",
          borderRadius: "8px"
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ p: 2, color: "#fff", display: "flex", alignItems: "center",      
            border: "1px solid #fff",
            borderRadius: "8px"}}
          >
            <img width="50" src="/images/ying_yang.png" alt="ZuZu Logo" />
            Code Health Dashboard
            {showExample && (
              <Chip
                label="EXAMPLE DATA"
                color="warning"
                size="small"
                sx={{
                  ml: 2,
                  fontWeight: "bold",
                  color: "#b1c6f5",
                  backgroundColor: "#ffffff36",
                }}
              />
            )}
          </Typography>
          <Typography variant="body2" sx={{ color: "#fff" }}>
            Last updated: {data.lastUpdated}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {isLocalEnvironment() && (
            <Tooltip title="Run full code review">
              <Button
                variant="contained"
                startIcon={
                  isRunningReview ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <PlayArrowIcon />
                  )
                }
                onClick={handleRunReview}
                disabled={isRunningReview}
                size="medium"
                sx={{
                  backgroundColor: "black",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#333",
                  },
                  "&:disabled": {
                    backgroundColor: "#666",
                    color: "#999",
                  },
                }}
              >
                {isRunningReview ? "Running..." : "Run Code Review"}
              </Button>
            </Tooltip>
          )}
          <Tooltip
            title={
              showExample
                ? "Switch to production data"
                : "View example data with findings"
            }
          >
            <Button
              variant={showExample ? "contained" : "outlined"}
              sx={{ color: "#b2c8fb", backgroundColor: "#ffffff36" }}
              startIcon={showExample ? <DashboardIcon /> : <PreviewIcon />}
              onClick={() => setShowExample(!showExample)}
              size="medium"
            >
              {showExample ? "Production" : "Example"}
            </Button>
          </Tooltip>
          <Tooltip title="Refresh data">
            <IconButton
              aria-label="refresh"
              sx={{ color: "#b1c6f5" }}
              onClick={() => {
                try {
                  refetch();
                } catch (error) {
                  console.error("Error refreshing data:", error);
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Review Error Alert */}
      {reviewError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setReviewError(null)}
        >
          {reviewError}
        </Alert>
      )}

      {/* Overall Health Score Card */}
      <Card sx={{ mb: 1, backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent", backdropFilter: "blur(2px)", border: "1px solid #fff", borderRadius: "8px" }}>
        <CardContent sx={{ pt: 2, pb: 0, "&:last-child": { pb: 0 } }}>
          <Grid container spacing={3} alignItems="flex-start">
            {/* ZuZu Logo */}
            <Grid size={{ xs: 12, md: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <img
                  src={zuzuLogo}
                  alt="ZuZu Logo"
                  style={{
                    width: "60px",
                    height: "auto",
                  }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    lineHeight: 1.8,
                    mb: 1,
                    borderRadius: 2,
                    pl: 2,
                    backgroundColor: "#ffffff36",
                    fontWeight: 800,
                    color: "#fff",
                    fontSize: "0.7rem",
                    letterSpacing: 1.5,
                  }}
                >
                  HEALTH SCORE
                </Typography>
                <Box
                  sx={{
                    borderRadius: 2,
                    backgroundColor: "#fff",
                    padding: 1,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="h3"
                    component="div"
                    sx={{
                      fontWeight: 600,
                      fontFamily: "monospace",
                      fontSize: "3rem",
                      lineHeight: 1,
                    }}
                  >
                    {data.overallHealthScore}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "monospace",
                      opacity: 0.7,
                      fontWeight: 300,
                    }}
                  >
                    /100
                  </Typography>
                </Box>
                <Chip
                  label={data.overallStatusDisplay}
                  size="small"
                  sx={{
                    backgroundColor: getStatusColor(data.overallStatus),
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.65rem",
                    height: "20px",
                  }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                variant="overline"
                sx={{
                  lineHeight: 1.8,
                  mb: 1,
                  borderRadius: 2,
                  pl: 2,
                  backgroundColor: "#ffffff36",
                  fontWeight: 800,
                  color: "#fff",
                  fontSize: "0.7rem",
                  letterSpacing: 1.5,
                  display: "block",
                }}
              >
                METRICS
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: "space-between",
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "#fff",
                    borderRadius: 2,
                    p: 1,
                    flex: 1,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontFamily: "monospace", fontWeight: 600 }}
                  >
                    {data.overallMetrics.critical}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.65rem" }}>
                    Critical
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: "#fff",
                    borderRadius: 2,
                    p: 1,
                    flex: 1,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontFamily: "monospace", fontWeight: 600 }}
                  >
                    {data.overallMetrics.warnings}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.65rem" }}>
                    Warnings
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: "#fff",
                    borderRadius: 2,
                    p: 1,
                    flex: 1,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontFamily: "monospace", fontWeight: 600 }}
                  >
                    {data.overallMetrics.info}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.65rem" }}>
                    Info
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: "#fff",
                    borderRadius: 2,
                    p: 1,
                    flex: 1,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontFamily: "monospace", fontWeight: 600 }}
                  >
                    {data.overallMetrics.total}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.65rem" }}>
                    Total
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography
                variant="overline"
                sx={{
                  lineHeight: 1.8,
                  mb: 1,
                  borderRadius: 2,
                  pl: 2,
                  backgroundColor: "#ffffff36",
                  fontWeight: 800,
                  color: "#fff",
                  fontSize: "0.7rem",
                  letterSpacing: 1.5,
                  display: "block",
                }}
              >
                CATEGORY BREAKDOWN
              </Typography>
              <Box
                sx={{
                  mb: 2,
                  padding: 1,
                  backgroundColor: "#fff",
                  borderRadius: 2,
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                {/* Donut Chart */}
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 42 42"
                  style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
                >
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                  ></circle>
                  {(() => {
                    let offset = 0;
                    const total = data.reviews.reduce(
                      (sum, review) => sum + review.metrics.total,
                      0,
                    );
                    return data.reviews.map((review) => {
                      if (review.metrics.total === 0) return null;
                      const percentage = (review.metrics.total / total) * 100;
                      const strokeDasharray = `${percentage} ${100 - percentage}`;
                      const strokeDashoffset = -offset;
                      offset += percentage;
                      return (
                        <circle
                          key={review.category}
                          cx="21"
                          cy="21"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke={getStatusColor(review.status)}
                          strokeWidth="4"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          opacity="0.9"
                        ></circle>
                      );
                    });
                  })()}
                </svg>
                {/* Legend - Vertically centered with chart */}
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                >
                  {data.reviews
                    .filter((r) => r.metrics.total > 0)
                    .map((review) => (
                      <Box
                        key={review.category}
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: getStatusColor(review.status),
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.65rem", lineHeight: 1.2 }}
                        >
                          {getShortDisplayName(review.displayName)}:{" "}
                          {review.metrics.total}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Review Categories
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Review Categories
      </Typography>
       */}
      <Grid container spacing={0} sx={{ gap: "0px", border: "1px solid #fff",
            borderRadius: "8px" }}>
        {data.reviews.map((review) => (
          <Grid
            size={{ xs: 12, sm: 6, md: 2, lg: 2, xl: 2 }}
            key={review.category}
          >
            <Card
              onClick={() => handleCategoryClick(review.category)}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(0,0,0,0.06)",
                maxWidth: "calc(100% - 2px)",
                paddingBottom: "10px",
                color: "#fff",
                borderLeft: `4px solid ${getStatusColor(review.status)}`,
                borderRadius: 1,
                transition:
                  "transform 0.16s, box-shadow 0.16s, background-color 0.16s",
                cursor: "pointer",
                backgroundColor:
                  selectedCategory === review.category
                    ? "rgba(110, 134, 191, 0.04)"
                    : BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent",
                backdropFilter: "blur(2px)",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 2,
                  backdropFilter: "blur(2px)",
                  backgroundColor: selectedCategory === review.category
                      ? BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent"
                      : "transparent",
                },
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flexGrow: 1,
                  pt: 1,
                  pb: 0,
                  "&:last-child": { pb: 0 },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      borderRadius: 2,
                      width: "100%",
                      backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        color: getStatusColor(review.status),
                        display: "flex",
                        flexShrink: 0,
                        p: 1,
                      fontSize: "1.5rem",
                      }}
                    >
                      {categoryIcons[review.category] || <CodeIcon />}
                    </Box>
                    <Typography
                      variant="h6"
                      component="div"
                      noWrap
                      sx={{ color: "#fff", fontSize: "0.95rem" }}
                    >
                      {getShortDisplayName(review.displayName)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 0.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                    <Chip
                      label={review.statusDisplay}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(review.status),
                        color: "white",
                        fontSize: "0.7rem",
                        mr: 1,
                      }}
                    />
                  </Box>

                  <Box sx={{ mt: 0.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: "#fff" }}>
                        Health Score
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{ color: "#fff" }}
                      >
                        {review.healthScore}/100
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={review.healthScore}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "rgba(0,0,0,0.06)",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: getHealthScoreColor(
                            review.healthScore,
                          ),
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                </Box>

                <Grid
                  container
                  spacing={1}
                  sx={{ p: 2, borderRadius: 2, mt: 1, backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent" }}
                >
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption">Critical</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {review.metrics.critical}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption">Warnings</Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="warning.main"
                    >
                      {review.metrics.warnings}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption">Info</Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="info.main"
                    >
                      {review.metrics.info}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption">Total</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {review.metrics.total}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    fontSize: "0.65rem",
                    color: "#fff",
                  }}
                >
                  {review.lastUpdated
                    ? new Date(review.lastUpdated).toLocaleString()
                    : ""}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Findings Data Grid */}
      <Box sx={{ mt: 6 }}>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{
            mb: 3,
            color: "#fff",
            fontWeight: 600,
            backgroundColor: "#ffffff55",
            borderRadius: 2,
            p: 1,
            border: "1px solid #fff",
          }}
        >
          {selectedCategory
            ? `${getShortDisplayName(data.reviews.find((r) => r.category === selectedCategory)?.displayName || selectedCategory)} Findings`
            : "All Findings"}
          {filteredFindings.length > 0 && (
            <Chip
              label={filteredFindings.length}
              size="small"
              sx={{ ml: 2, fontSize: "1.5rem", color: "#fff" }}
            />
          )}
        </Typography>

        <Paper sx={{ p: 3, color: "#fff", border: "1px solid #fff", borderRadius: 2, backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent" }}>
          <Box
            sx={{ mb: 3, border: "1px solid #fff", borderRadius: 2, p: "2px" }}
          >
            <TextField
              fullWidth
              sx={{
                input: {
                  pl: 2,
                  fontWeight: 600,
                  color: "#fff",
                  backgroundColor: "#00000038",
                },
              }}
              placeholder="Search findings by issue, file, category, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#fff" }} />
                  </InputAdornment>
                ),
              }}
            />
            {selectedCategory && (
              <Box
                sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <Typography variant="body2">Filtered by:</Typography>
                <Chip
                  label={getShortDisplayName(
                    data.reviews.find((r) => r.category === selectedCategory)
                      ?.displayName || selectedCategory,
                  )}
                  onDelete={() => setSelectedCategory(null)}
                  sx={{ color: "#fff" }}
                  size="small"
                  icon={categoryIcons[selectedCategory]}
                />
              </Box>
            )}
          </Box>

          <TableContainer>
            <Table aria-label="findings table">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ color: "#fff", border: "1px solid #fff", borderRadius: "8px", backgroundColor: BACKGROUND_COLORS.find(c => c.name === "smoke")?.color || "transparent" }}
                  >
                    <TableSortLabel
                      active={orderBy === "severity"}
                      direction={orderBy === "severity" ? order : "asc"}
                      onClick={() => handleRequestSort("severity")}
                      sx={{
                        color: "#fff",
                        border: "1px solid transparent",
                        pl: 2,
                        "&.Mui-active": {
                          // Styles when the sort label is active
                          color: "#fff",
                          backgroundColor: "transparent",
                          border: "1px solid #fff",
                        },
                        "&:hover": {
                          // Styles on hover
                          color: "#fff",
                          backgroundColor: "#00000027",
                          border: "1px solid #fff",
                        },
                        "& .MuiTableSortLabel-icon": {
                          // Targets the sort icon
                          color: "#fff !important", // Use !important for higher specificity
                          "&.Mui-active": {
                            color: "#fff !important",
                          },
                        },
                      }}
                    >
                      Severity
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sx={{ color: "#fff", backgroundColor: "#ffffff36" }}
                  >
                    <TableSortLabel
                      active={orderBy === "category"}
                      direction={orderBy === "category" ? order : "asc"}
                      onClick={() => handleRequestSort("category")}
                      sx={{
                        color: "#fff",
                        border: "1px solid transparent",
                        pl: 2,
                        "&.Mui-active": {
                          // Styles when the sort label is active
                          color: "#fff",
                          backgroundColor: "transparent",
                          border: "1px solid #fff",
                        },
                        "&:hover": {
                          // Styles on hover
                          color: "#fff",
                          backgroundColor: "#00000027",
                          border: "1px solid #fff",
                        },
                        "& .MuiTableSortLabel-icon": {
                          // Targets the sort icon
                          color: "#fff !important", // Use !important for higher specificity
                          "&.Mui-active": {
                            color: "#fff !important",
                          },
                        },
                      }}
                    >
                      Category
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sx={{ color: "#fff", backgroundColor: "#ffffff36" }}
                  >
                    <TableSortLabel
                      active={orderBy === "issue"}
                      direction={orderBy === "issue" ? order : "asc"}
                      onClick={() => handleRequestSort("issue")}
                      sx={{
                        color: "#fff",
                        border: "1px solid transparent",
                        pl: 2,
                        "&.Mui-active": {
                          // Styles when the sort label is active
                          color: "#fff",
                          backgroundColor: "transparent",
                          border: "1px solid #fff",
                        },
                        "&:hover": {
                          // Styles on hover
                          color: "#fff",
                          backgroundColor: "#00000027",
                          border: "1px solid #fff",
                        },
                        "& .MuiTableSortLabel-icon": {
                          // Targets the sort icon
                          color: "#fff !important", // Use !important for higher specificity
                          "&.Mui-active": {
                            color: "#fff !important",
                          },
                        },
                      }}
                    >
                      Issue
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sx={{ color: "#fff", backgroundColor: "#ffffff36" }}
                  >
                    <TableSortLabel
                      active={orderBy === "file"}
                      direction={orderBy === "file" ? order : "asc"}
                      onClick={() => handleRequestSort("file")}
                      sx={{
                        color: "#fff",
                        border: "1px solid transparent",
                        pl: 2,
                        "&.Mui-active": {
                          // Styles when the sort label is active
                          color: "#fff",
                          backgroundColor: "transparent",
                          border: "1px solid #fff",
                        },
                        "&:hover": {
                          // Styles on hover
                          color: "#fff",
                          backgroundColor: "#00000027",
                          border: "1px solid #fff",
                        },
                        "& .MuiTableSortLabel-icon": {
                          // Targets the sort icon
                          color: "#fff !important", // Use !important for higher specificity
                          "&.Mui-active": {
                            color: "#fff !important",
                          },
                        },
                      }}
                    >
                      File
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sx={{ color: "#fff", backgroundColor: "#ffffff36" }}
                  >
                    Line
                  </TableCell>
                  <TableCell
                    sx={{ color: "#fff", backgroundColor: "#ffffff36" }}
                  >
                    Description
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFindings.length > 0 ? (
                  filteredFindings
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((finding, index) => (
                      <TableRow
                        key={`${finding.category}-${finding.file}-${finding.line}-${index}`}
                        hover={true}
                        sx={{"&.MuiTableRow-hover:hover": { backgroundColor: COLORS.transparentBlackDark}}}
                      >
                        <TableCell>
                          <Chip
                            label={finding.severity.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(
                                finding.severity as any,
                              ),
                              color: "white",
                              fontWeight: "bold",
                              fontSize: "0.65rem",
                              opacity: 0.9,
                              border: "1px solid #fff",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              borderRadius: 2,
                              border: "1px solid #fff",
                              backgroundColor: "#ffffff55",
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                color: getStatusColor(finding.severity as any),
                                display: "flex",
                              }}
                            >
                              {categoryIcons[finding.category] || (
                                <CodeIcon fontSize="small" />
                              )}
                            </Box>
                            <Typography color="#fff" variant="body2">
                              {finding.categoryDisplay}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            color="#fff"
                            variant="body2"
                            fontWeight="medium"
                          >
                            {finding.issue}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            color="#fff"
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.85rem",
                            }}
                          >
                            {finding.file}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            color="#fff"
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {finding.line || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            color="#fff"
                            variant="body2"
                            sx={{ maxWidth: 400, p: 1, backgroundColor: "#ffffff44", borderRadius: 2 }}
                          >
                            {finding.description.substring(
                              0,
                              MAX_DESCRIPTION_LENGTH,
                            )}
                            {finding.description.length >
                              MAX_DESCRIPTION_LENGTH && "..."}
                          </Typography>
                          {finding.recommendation && (
                            <Typography
                              variant="caption"
                              color="#fff"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              💡{" "}
                              {finding.recommendation.substring(
                                0,
                                MAX_DESCRIPTION_LENGTH,
                              )}
                              {finding.recommendation.length >
                                MAX_DESCRIPTION_LENGTH && "..."}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" sx={{ py: 3 }}>
                        {searchTerm
                          ? "No findings match your search"
                          : "No findings available"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredFindings.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              color: "#fff",
              backgroundColor: "#ffffff36",
              "& .MuiTablePagination-actions": {
                color: "#fff", // Example color
              },
              // Targets the dropdown arrow icon
              "& .MuiTablePagination-selectIcon": {
                color: "#fff", // Example color
              },
              "& .MuiTablePagination-actions button:first-of-type": {
                // styles for back button
                p: "2px",
                mr: 1,
                color: "#fff",
                border: "1px solid #fff",
                borderRadius: 2,
              },
              "& .MuiTablePagination-actions button:last-child": {
                // styles for next button
                p: "2px",
                mr: 1,
                color: "#fff",
                border: "1px solid #fff",
                borderRadius: 2,
              },
            }}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
