import React, { useState, useEffect } from "react";
import {
  Paper,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

type KeyInfo = {
  data?: {
    label?: string;
    usage?: number; // Number of credits used (all time)
    usage_daily?: number; // Number of credits used (current UTC day)
    usage_weekly?: number; // Number of credits used (current UTC week, starting Monday)
    usage_monthly?: number; // Number of credits used (current UTC month)
    limit?: number | null;
    is_free_tier?: boolean;
    rate_limit?: {
      requests?: number;
      interval?: string;
    };
  };
  error?: string;
};

const OpenRouterDashboard: React.FC = () => {
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeyInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get API key from environment
        const apiKey = process.env.REACT_APP_ZUZU_OPENROUTER_KEY;

        if (!apiKey) {
          throw new Error("OpenRouter API key not configured");
        }

        // Use OpenRouter REST API directly for key info
        const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const info = await response.json();
        setKeyInfo(info as KeyInfo);
      } catch (err) {
        console.error("Error fetching OpenRouter key info:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch API key information",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchKeyInfo();
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="120px"
        >
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Alert severity="warning" icon={<InfoIcon />}>
          {error}
        </Alert>
      </Paper>
    );
  }

  const data = keyInfo?.data;
  const usagePercentage = data?.limit
    ? ((data.usage || 0) / data.limit) * 100
    : 0;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          OpenRouter API Dashboard
        </Typography>
        <Divider />
      </Box>

      <Grid container spacing={2}>
        {/* API Key Label */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <InfoIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  API Key
                </Typography>
              </Box>
              <Typography variant="h6">
                {data?.label || "Default Key"}
              </Typography>
              {data?.is_free_tier && (
                <Chip
                  label="Free Tier"
                  size="small"
                  color="info"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Usage */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Usage
                </Typography>
              </Box>
              <Typography variant="h6">
                ${((data?.usage || 0) / 100).toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total spent
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Credit Limit */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Credit Limit
                </Typography>
              </Box>
              <Typography variant="h6">
                {data?.limit
                  ? `$${(data.limit / 100).toFixed(2)}`
                  : "Unlimited"}
              </Typography>
              {data?.limit && (
                <Typography variant="caption" color="text.secondary">
                  {usagePercentage.toFixed(1)}% used
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Rate Limit */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Rate Limit
                </Typography>
              </Box>
              <Typography variant="h6">
                {data?.rate_limit?.requests || "N/A"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                per {data?.rate_limit?.interval || "interval"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Usage Warning */}
      {data?.limit && usagePercentage > 80 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          You've used {usagePercentage.toFixed(1)}% of your credit limit
        </Alert>
      )}

      {/* Time-based Usage Metrics */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Usage by Time Period
        </Typography>
        <Grid container spacing={2}>
          {/* Daily Usage */}
          <Grid item xs={12} sm={4}>
            <Card variant="outlined" sx={{ bgcolor: "background.default" }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Today
                </Typography>
                <Typography variant="h6" sx={{ mt: 0.5 }}>
                  ${((data?.usage_daily || 0) / 100).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Weekly Usage */}
          <Grid item xs={12} sm={4}>
            <Card variant="outlined" sx={{ bgcolor: "background.default" }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  This Week
                </Typography>
                <Typography variant="h6" sx={{ mt: 0.5 }}>
                  ${((data?.usage_weekly || 0) / 100).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Usage */}
          <Grid item xs={12} sm={4}>
            <Card variant="outlined" sx={{ bgcolor: "background.default" }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  This Month
                </Typography>
                <Typography variant="h6" sx={{ mt: 0.5 }}>
                  ${((data?.usage_monthly || 0) / 100).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default OpenRouterDashboard;
