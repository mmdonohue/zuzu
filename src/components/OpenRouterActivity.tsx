import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { format } from 'date-fns';

interface ActivityRequest {
  id: string;
  created_at: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  native_tokens_prompt: number;
  native_tokens_completion: number;
  num_media_generations?: number;
  app_id?: number;
  total_cost: number;
  finish_reason: string;
  generation_time?: number;
  tokens_per_second?: number;
}

interface ActivitySummary {
  avg_daily_spend: number;
  past_month_spend: number;
  avg_daily_tokens: number;
  past_month_tokens: number;
  avg_daily_requests: number;
  past_month_requests: number;
}

interface ActivityData {
  data: ActivityRequest[];
}

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

        const provisionKey = process.env.REACT_APP_ZUZU_OPENROUTER_PROVISION_KEY;

        if (!provisionKey) {
          throw new Error('OpenRouter provision key not configured');
        }

        const response = await fetch('https://openrouter.ai/api/v1/activity', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${provisionKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const data: ActivityData = await response.json();
        console.log('Activity API response:', data);
        setActivityData(data.data || []);

        // Calculate summary statistics
        if (data.data && data.data.length > 0) {
          const now = new Date();
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          const dailyRequests = data.data.filter(r => {
            const date = new Date(r.created_at);
            return !isNaN(date.getTime()) && date >= oneDayAgo;
          });
          const monthlyRequests = data.data.filter(r => {
            const date = new Date(r.created_at);
            return !isNaN(date.getTime()) && date >= oneMonthAgo;
          });

          setSummary({
            avg_daily_spend: dailyRequests.reduce((sum, r) => sum + (r.total_cost || 0), 0),
            past_month_spend: monthlyRequests.reduce((sum, r) => sum + (r.total_cost || 0), 0),
            avg_daily_tokens: dailyRequests.reduce((sum, r) => sum + (r.total_tokens || 0), 0),
            past_month_tokens: monthlyRequests.reduce((sum, r) => sum + (r.total_tokens || 0), 0),
            avg_daily_requests: dailyRequests.length,
            past_month_requests: monthlyRequests.length,
          });
        }
      } catch (err) {
        console.error('Error fetching OpenRouter activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Your Activity
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Usage across models on OpenRouter
      </Typography>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {/* Spend Card */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Spend
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Avg Day
                    </Typography>
                    <Typography variant="h5">
                      ${(summary.avg_daily_spend || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Past Month
                    </Typography>
                    <Typography variant="h5">
                      ${(summary.past_month_spend || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Tokens Card */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tokens
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Avg Day
                    </Typography>
                    <Typography variant="h5">
                      {(summary.avg_daily_tokens || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Past Month
                    </Typography>
                    <Typography variant="h5">
                      {((summary.past_month_tokens || 0) / 1000).toFixed(1)}K
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Requests Card */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Requests
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Avg Day
                    </Typography>
                    <Typography variant="h5">
                      {(summary.avg_daily_requests || 0).toFixed(3)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Past Month
                    </Typography>
                    <Typography variant="h5">
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
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Provider / Model</TableCell>
              <TableCell align="right">Tokens</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell align="right">Speed</TableCell>
              <TableCell>Finish</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activityData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No activity data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              activityData.slice(0, 50).map((activity) => {
                const createdDate = new Date(activity.created_at);
                const isValidDate = !isNaN(createdDate.getTime());

                return (
                <TableRow key={activity.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {isValidDate
                        ? format(createdDate, 'MMM d, h:mm a')
                        : activity.created_at || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={activity.model.split('/').pop()}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {activity.prompt_tokens || 0} → {activity.completion_tokens || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      ${(activity.total_cost || 0).toFixed(4)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {activity.generation_time && activity.completion_tokens
                        ? `${((activity.completion_tokens || 0) / (activity.generation_time || 1)).toFixed(1)} tps`
                        : activity.tokens_per_second
                        ? `${activity.tokens_per_second.toFixed(1)} tps`
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={activity.finish_reason || 'stop'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {activityData.length > 50 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Showing 50 most recent activities
        </Typography>
      )}
    </Box>
  );
};

export default OpenRouterActivity;
