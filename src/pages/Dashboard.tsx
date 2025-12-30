import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ExtensionIcon from '@mui/icons-material/Extension';
import PreviewIcon from '@mui/icons-material/Preview';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { fetchCodeReviewSummary, fetchWithCsrf } from '../services/api';
import { CodeReviewSummary, ReviewFinding, getStatusColor, getHealthScoreColor } from '../types/review';
import zuzuLogo from '../assets/img/zuzu-logo.png';
import { isLocalEnvironment } from '../utils/environment';

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
    'Dependencies': 'Deps',
  };
  return shortNames[displayName] || displayName;
};

const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof ReviewFinding>('severity');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [showExample, setShowExample] = useState(false);
  const [isRunningReview, setIsRunningReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const MAX_DESCRIPTION_LENGTH = 150;
  const RESET_INTERVAL_MS = 30000;
  // Fetch code review data
  const { data, isLoading, error, refetch } = useQuery<CodeReviewSummary>({
    queryKey: ['codeReview', showExample],
    queryFn: () => fetchCodeReviewSummary(showExample),
    refetchInterval: RESET_INTERVAL_MS, // Refetch every 30 seconds
  });

  // Filter and sort findings
  const filteredFindings = useMemo(() => {
    if (!data?.findings) return [];

    let filtered = data.findings.filter((finding) => {
      // Apply category filter first
      const matchesCategory = !selectedCategory || finding.category === selectedCategory;

      // Apply search filter
      const matchesSearch = !searchTerm || (
        finding.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return matchesCategory && matchesSearch;
    });

    // Sort findings
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    filtered.sort((a, b) => {
      const aVal = orderBy === 'severity' ? severityOrder[a.severity] : a[orderBy];
      const bVal = orderBy === 'severity' ? severityOrder[b.severity] : b[orderBy];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (order === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [data?.findings, searchTerm, selectedCategory, orderBy, order]);

  const handleRequestSort = (property: keyof ReviewFinding) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await fetchWithCsrf('/api/review/trigger', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // If CSRF validation failed, retry once with a fresh token
        if (response.status === 403 && errorData?.code === 'CSRF_VALIDATION_FAILED') {
          console.log('CSRF token failed, retrying with fresh token...');

          // Wait a moment for the token to be refreshed
          await new Promise(resolve => setTimeout(resolve, CSRF_RETRY_DELAY_MS));

          // Retry the request
          const retryResponse = await fetchWithCsrf('/api/review/trigger', {
            method: 'POST',
          });

          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json().catch(() => null);
            throw new Error(retryErrorData?.message || 'Failed to run code review after retry');
          }

          const retryResult = await retryResponse.json();

          // Refetch the review data to show updated results
          await refetch();

          console.log('Code review completed after retry:', retryResult);
          return; // Success on retry
        }

        throw new Error(errorData?.message || 'Failed to run code review');
      }

      const result = await response.json();

      // Refetch the review data to show updated results
      await refetch();

      console.log('Code review completed:', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setReviewError(errorMessage);
      console.error('Error running code review:', err);
    } finally {
      setIsRunningReview(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading code review data. Make sure the review has been run and the backend is running.
        </Alert>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">
          No code review data available. Run the code review to generate metrics.
        </Alert>
      </Container>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Code Health Dashboard
            {showExample && (
              <Chip
                label="EXAMPLE DATA"
                color="warning"
                size="small"
                sx={{ ml: 2, fontWeight: 'bold' }}
              />
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {data.lastUpdated}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isLocalEnvironment() && (
            <Tooltip title="Run full code review">
              <Button
                variant="contained"
                startIcon={isRunningReview ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                onClick={handleRunReview}
                disabled={isRunningReview}
                size="medium"
                sx={{
                  backgroundColor: 'black',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#333',
                  },
                  '&:disabled': {
                    backgroundColor: '#666',
                    color: '#999',
                  },
                }}
              >
                {isRunningReview ? 'Running...' : 'Run Code Review'}
              </Button>
            </Tooltip>
          )}
          <Tooltip title={showExample ? "Switch to production data" : "View example data with findings"}>
            <Button
              variant={showExample ? "contained" : "outlined"}
              color={showExample ? "warning" : "primary"}
              startIcon={showExample ? <DashboardIcon /> : <PreviewIcon />}
              onClick={() => setShowExample(!showExample)}
              size="medium"
            >
              {showExample ? "Production" : "Example"}
            </Button>
          </Tooltip>
          <Tooltip title="Refresh data">
            <IconButton aria-label="refresh" color="primary" onClick={() => {
              try{
              refetch()} catch (error) {
                console.error('Error refreshing data:', error);
              }
            }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Review Error Alert */}
      {reviewError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setReviewError(null)}>
          {reviewError}
        </Alert>
      )}

      {/* Overall Health Score Card */}
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #becffd 0%, #6e86bf 100%)', color: 'white' }}>
        <CardContent sx={{ pt: 2, pb: 0, '&:last-child': { pb: 0 } }}>
          <Grid container spacing={3} alignItems="flex-start">
            {/* ZuZu Logo */}
            <Grid item xs={12} md={1}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <img
                  src={zuzuLogo}
                  alt="ZuZu Logo"
                  style={{
                    width: '60px',
                    height: 'auto',
                    filter: 'brightness(0) invert(1)', // Make the logo white
                    opacity: 0.9
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1
              }}>
                <Typography variant="overline" sx={{ fontSize: '0.7rem', letterSpacing: 1.5, opacity: 0.9 }}>
                  HEALTH SCORE
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography
                    variant="h3"
                    component="div"
                    sx={{
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      fontSize: '3rem',
                      lineHeight: 1
                    }}
                  >
                    {data.overallHealthScore}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'monospace',
                      opacity: 0.7,
                      fontWeight: 300
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
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.65rem',
                    height: '20px'
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="overline" sx={{ fontSize: '0.7rem', letterSpacing: 1.5, opacity: 0.9, mb: 1, display: 'block' }}>
                METRICS
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                <Box sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  p: 1,
                  flex: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {data.overallMetrics.critical}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Critical</Typography>
                </Box>
                <Box sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  p: 1,
                  flex: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {data.overallMetrics.warnings}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Warnings</Typography>
                </Box>
                <Box sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  p: 1,
                  flex: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {data.overallMetrics.info}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Info</Typography>
                </Box>
                <Box sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  p: 1,
                  flex: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {data.overallMetrics.total}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Total</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Typography variant="overline" sx={{ fontSize: '0.7rem', letterSpacing: 1.5, opacity: 0.9, mb: 1, display: 'block' }}>
                CATEGORY BREAKDOWN
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {/* Donut Chart */}
                <svg width="120" height="120" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                  <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="4"></circle>
                  {(() => {
                    let offset = 0;
                    const total = data.reviews.reduce((sum, review) => sum + review.metrics.total, 0);
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {data.reviews.filter(r => r.metrics.total > 0).map((review) => (
                    <Box key={review.category} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(review.status),
                        flexShrink: 0
                      }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
                        {getShortDisplayName(review.displayName)}: {review.metrics.total}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Review Categories */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Review Categories
      </Typography>

      <Grid container spacing={3}>
        {data.reviews.map((review) => (
          <Grid item xs={12} sm={6} md={3} key={review.category}>
            <Card
              onClick={() => handleCategoryClick(review.category)}
              sx={{
                height: '100%',
                borderLeft: `4px solid ${getStatusColor(review.status)}`,
                transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s',
                cursor: 'pointer',
                backgroundColor: selectedCategory === review.category ? 'rgba(110, 134, 191, 0.1)' : 'inherit',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  backgroundColor: selectedCategory === review.category ? 'rgba(110, 134, 191, 0.15)' : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: getStatusColor(review.status) }}>
                      {categoryIcons[review.category] || <CodeIcon />}
                    </Box>
                    <Typography variant="h6" component="div">
                      {getShortDisplayName(review.displayName)}
                    </Typography>
                  </Box>
                  <Chip
                    label={review.statusDisplay}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(review.status),
                      color: 'white',
                      fontSize: '0.7rem',
                    }}
                  />
                </Box>

                {/* Health Score */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Health Score
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {review.healthScore}/100
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={review.healthScore}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getHealthScoreColor(review.healthScore),
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>

                {/* Metrics */}
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Critical
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="error">
                      {review.metrics.critical}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Warnings
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="warning.main">
                      {review.metrics.warnings}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Info
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="info.main">
                      {review.metrics.info}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {review.metrics.total}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Last Updated */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  Updated: {review.lastUpdated}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Findings Data Grid */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
          {selectedCategory
            ? `${getShortDisplayName(data.reviews.find(r => r.category === selectedCategory)?.displayName || selectedCategory)} Findings`
            : 'All Findings'}
          {filteredFindings.length > 0 && (
            <Chip
              label={filteredFindings.length}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search findings by issue, file, category, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            {selectedCategory && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Filtered by:
                </Typography>
                <Chip
                  label={getShortDisplayName(data.reviews.find(r => r.category === selectedCategory)?.displayName || selectedCategory)}
                  onDelete={() => setSelectedCategory(null)}
                  color="primary"
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
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'severity'}
                      direction={orderBy === 'severity' ? order : 'asc'}
                      onClick={() => handleRequestSort('severity')}
                    >
                      Severity
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'category'}
                      direction={orderBy === 'category' ? order : 'asc'}
                      onClick={() => handleRequestSort('category')}
                    >
                      Category
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'issue'}
                      direction={orderBy === 'issue' ? order : 'asc'}
                      onClick={() => handleRequestSort('issue')}
                    >
                      Issue
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'file'}
                      direction={orderBy === 'file' ? order : 'asc'}
                      onClick={() => handleRequestSort('file')}
                    >
                      File
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Line</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFindings.length > 0 ? (
                  filteredFindings
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((finding, index) => (
                      <TableRow key={`${finding.category}-${finding.file}-${finding.line}-${index}`} hover>
                        <TableCell>
                          <Chip
                            label={finding.severity.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(finding.severity as any),
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.65rem',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ color: getStatusColor(finding.severity as any), display: 'flex' }}>
                              {categoryIcons[finding.category] || <CodeIcon fontSize="small" />}
                            </Box>
                            <Typography variant="body2">{finding.categoryDisplay}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {finding.issue}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {finding.file}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {finding.line || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                            {finding.description.substring(0, MAX_DESCRIPTION_LENGTH)}
                            {finding.description.length > MAX_DESCRIPTION_LENGTH && '...'}
                          </Typography>
                          {finding.recommendation && (
                            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                              💡 {finding.recommendation.substring(0, MAX_DESCRIPTION_LENGTH)}
                              {finding.recommendation.length > MAX_DESCRIPTION_LENGTH && '...'}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        {searchTerm ? 'No findings match your search' : 'No findings available'}
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
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
