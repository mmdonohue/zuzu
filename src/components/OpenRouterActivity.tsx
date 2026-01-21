import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { format } from "date-fns";
import { COLORS } from "@/styles/themes";

type ActivityRequest = {
  date: string; // Format: "2026-01-16 00:00:00"
  model_permaslug: string;
  model: string;
  provider_name: string;
  endpoint_id: string;
  usage: number; // Cost in credits
  byok_usage_inference: number;
  requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  reasoning_tokens: number;
  byok_requests: number;
};

type ActivitySummary = {
  avg_daily_spend: number;
  past_month_spend: number;
  avg_daily_tokens: number;
  past_month_tokens: number;
  avg_daily_requests: number;
  past_month_requests: number;
};

type ActivityData = {
  data: ActivityRequest[];
};

// Helper function to derive provider name from model when provider_name is unknown
const deriveProviderName = (activity: ActivityRequest): string => {
  if (activity.provider_name && activity.provider_name.toLowerCase() !== "unknown") {
    return activity.provider_name;
  }
  
  // Try to extract provider from model field (format: "provider/model-name")
  if (activity.model && activity.model.includes("/")) {
    return activity.model.split("/")[0];
  }
  
  return "unknown";
};

const OpenRouterActivity: React.FC = () => {
  const [activityData, setActivityData] = useState<ActivityRequest[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        const provisionKey =
          process.env.REACT_APP_ZUZU_OPENROUTER_PROVISION_KEY;

        if (!provisionKey) {
          throw new Error("OpenRouter provision key not configured");
        }

        const response = await fetch("https://openrouter.ai/api/v1/activity", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${provisionKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const data: ActivityData = await response.json();
        setActivityData(data.data || []);

        // Calculate summary statistics
        if (data.data && data.data.length > 0) {
          const now = new Date();
          const oneMonthAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000,
          );

          const monthlyRequests = data.data.filter((r) => {
            const date = new Date(r.date.replace(" ", "T"));
            return !isNaN(date.getTime()) && date >= oneMonthAgo;
          });

          // Calculate totals for the past month from aggregated daily data
          const monthSpend = monthlyRequests.reduce(
            (sum, r) => sum + (r.usage || 0),
            0,
          );
          const monthTokens = monthlyRequests.reduce(
            (sum, r) =>
              sum + (r.prompt_tokens || 0) + (r.completion_tokens || 0),
            0,
          );
          const monthCount = monthlyRequests.reduce(
            (sum, r) => sum + (r.requests || 0),
            0,
          );

          // Calculate daily averages (divide monthly total by 30)
          const DAYS_IN_MONTH = 30;
          const avgDailySpend = monthSpend / DAYS_IN_MONTH;
          const avgDailyTokens = monthTokens / DAYS_IN_MONTH;
          const avgDailyRequests = monthCount / DAYS_IN_MONTH;

          setSummary({
            avg_daily_spend: avgDailySpend,
            past_month_spend: monthSpend,
            avg_daily_tokens: avgDailyTokens,
            past_month_tokens: monthTokens,
            avg_daily_requests: avgDailyRequests,
            past_month_requests: monthCount,
          });
        }
      } catch (err) {
        console.error("Error fetching OpenRouter activity:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch activity data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  if (loading) {
    return (
      <Paper
        sx={{
          p: 3,
          backgroundColor: COLORS.transparentWhite,
          border: `1px solid ${COLORS.borderWhite}`,
          color: COLORS.textPrimary,
        }}
      >
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress sx={{ color: COLORS.textPrimary }} />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper
        sx={{
          p: 3,
          backgroundColor: COLORS.transparentWhite,
          border: `1px solid ${COLORS.borderWhite}`,
          color: COLORS.textPrimary,
        }}
      >
        <Alert
          severity="error"
          sx={{ backgroundColor: COLORS.transparentWhite }}
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: COLORS.textPrimary }}>
        Your Activity
      </Typography>
      <Typography
        variant="body2"
        gutterBottom
        sx={{ mb: 3, color: COLORS.textSecondary, backdropFilter: 'blur(2px)' }}
      >
        Usage across models on OpenRouter
      </Typography>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {/* Spend Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              variant="outlined"
              sx={{
                backgroundColor: COLORS.transparentBlackDark,
                border: `1px solid ${COLORS.borderWhite}`,
                color: COLORS.textPrimary,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: COLORS.textPrimary }}
                >
                  Spend
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: COLORS.textSecondary }}
                    >
                      Avg Day
                    </Typography>
                    <Typography variant="h5" sx={{ color: COLORS.textPrimary }}>
                      ${(summary.avg_daily_spend || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: COLORS.textSecondary }}
                    >
                      Past Month
                    </Typography>
                    <Typography variant="h5" sx={{ color: COLORS.textPrimary }}>
                      ${(summary.past_month_spend || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Tokens Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              variant="outlined"
              sx={{
                backgroundColor: COLORS.transparentBlackDark,
                border: `1px solid ${COLORS.borderWhite}`,
                color: COLORS.textPrimary,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: COLORS.textPrimary }}
                >
                  Tokens
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: COLORS.textSecondary }}
                    >
                      Avg Day
                    </Typography>
                    <Typography variant="h5" sx={{ color: COLORS.textPrimary }}>
                      {(summary.avg_daily_tokens || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: COLORS.textSecondary }}
                    >
                      Past Month
                    </Typography>
                    <Typography variant="h5" sx={{ color: COLORS.textPrimary }}>
                      {((summary.past_month_tokens || 0) / 1000).toFixed(1)}K
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Requests Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              variant="outlined"
              sx={{
                backgroundColor: COLORS.transparentBlackDark,
                border: `1px solid ${COLORS.borderWhite}`,
                color: COLORS.textPrimary,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: COLORS.textPrimary }}
                >
                  Requests
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: COLORS.textSecondary }}
                    >
                      Avg Day
                    </Typography>
                    <Typography variant="h5" sx={{ color: COLORS.textPrimary }}>
                      {(summary.avg_daily_requests || 0).toFixed(1)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: COLORS.textSecondary }}
                    >
                      Past Month
                    </Typography>
                    <Typography variant="h5" sx={{ color: COLORS.textPrimary }}>
                      {summary.past_month_requests || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Activity Table */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          backgroundColor: COLORS.transparent,
          border: `1px solid ${COLORS.borderWhite}`,
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: COLORS.transparentBlackDark }}>
              <TableCell
                sx={{
                  color: COLORS.textPrimary,
                  borderColor: COLORS.transparentWhite,
                }}
              >
                Date
              </TableCell>
              <TableCell
                sx={{
                  color: COLORS.textPrimary,
                  borderColor: COLORS.transparentWhite,
                }}
              >
                Provider / Model
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: COLORS.textPrimary,
                  borderColor: COLORS.transparentWhite,
                }}
              >
                Requests
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: COLORS.textPrimary,
                  borderColor: COLORS.transparentWhite,
                }}
              >
                Tokens
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: COLORS.textPrimary,
                  borderColor: COLORS.transparentWhite,
                }}
              >
                Cost
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activityData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={5} 
                  align="center"
                  sx={{
                    borderColor: COLORS.transparentWhite,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ py: 3, color: COLORS.textSecondary }}
                  >
                    No activity data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              activityData.slice(0, 50).map((activity, index) => {
                const activityDate = new Date(activity.date.replace(" ", "T"));
                const isValidDate = !isNaN(activityDate.getTime());

                // Format date with error handling
                const formattedDate = isValidDate
                  ? format(activityDate, "MMM d, yyyy")
                  : activity.date || "N/A";

                const totalTokens =
                  (activity.prompt_tokens || 0) +
                  (activity.completion_tokens || 0);

                return (
                  <TableRow
                    key={`${activity.endpoint_id}-${activity.date}-${index}`}
                    hover
                    sx={{
                      "&.MuiTableRow-root:hover": {
                        backgroundColor: COLORS.transparentBlackDark,
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        color: COLORS.textPrimary,
                        borderColor: COLORS.transparentWhite,
                      }}
                    >
                      <Typography variant="body2">{formattedDate}</Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: COLORS.textPrimary,
                        borderColor: COLORS.transparentWhite,
                      }}
                    >
                      <Box>
                        <Chip
                          label={activity.model.split("/").pop()}
                          size="small"
                          sx={{
                            color: COLORS.textPrimary,
                            border: `1px solid ${COLORS.borderWhite}`,
                            backgroundColor: COLORS.accentBlue,
                            fontWeight: 600,
                          }}
                        />
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 0.5, color: COLORS.textSecondary, fontWeight: 600 }}
                        >
                          {deriveProviderName(activity)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: COLORS.textPrimary,
                        borderColor: COLORS.transparentWhite,
                      }}
                    >
                      <Typography variant="body2">
                        {activity.requests || 0}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: COLORS.textPrimary,
                        borderColor: COLORS.transparentWhite,
                      }}
                    >
                      <Typography variant="body2">
                        {activity.prompt_tokens?.toLocaleString() || 0} →{" "}
                        {activity.completion_tokens?.toLocaleString() || 0}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: COLORS.textSecondary }}
                      >
                        {totalTokens.toLocaleString()} total
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: COLORS.textPrimary,
                        borderColor: COLORS.transparentWhite,
                      }}
                    >
                      <Typography variant="body2">
                        ${(activity.usage || 0).toFixed(4)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {activityData.length > 50 && (
        <Typography
          variant="caption"
          sx={{ mt: 2, display: "block", color: COLORS.textSecondary }}
        >
          Showing 50 most recent activities
        </Typography>
      )}
    </Box>
  );
};

export default OpenRouterActivity;
