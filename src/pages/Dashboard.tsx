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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ExtensionIcon from '@mui/icons-material/Extension';

import { fetchCodeReviewSummary } from '../services/api';
import { CodeReviewSummary, ReviewFinding, getStatusColor, getHealthScoreColor } from '../types/review';

// Icon mapping for categories
const categoryIcons: Record<string, React.ReactElement> = {
  security: <SecurityIcon />,
  quality: <CodeIcon />,
  docs: <DescriptionIcon />,
  documentation: <DescriptionIcon />,
  architecture: <AccountTreeIcon />,
  dependencies: <ExtensionIcon />,
};

const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof ReviewFinding>('severity');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const max_descrfiption_length = 150;

  const reset_interval = 30000;
  // Fetch code review data
  const { data, isLoading, error, refetch } = useQuery<CodeReviewSummary>({
    queryKey: ['codeReview'],
    queryFn: fetchCodeReviewSummary,
    refetchInterval: reset_interval, // Refetch every 30 seconds
  });

  // Filter and sort findings
  const filteredFindings = useMemo(() => {
    if (!data?.findings) return [];

    let filtered = data.findings.filter((finding) =>
      finding.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
  }, [data?.findings, searchTerm, orderBy, order]);

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
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {data.lastUpdated}
          </Typography>
        </Box>
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

      {/* Overall Health Score Card */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #6e86bf 0%, #4a5f99 100%)', color: 'white' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Overall Health Score
              </Typography>
              <Typography variant="h2" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {data.overallHealthScore}/100
              </Typography>
              <Chip
                label={data.overallStatusDisplay}
                sx={{
                  backgroundColor: getStatusColor(data.overallStatus),
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                Overall Metrics
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h4">{data.overallMetrics.critical}</Typography>
                  <Typography variant="caption">Critical</Typography>
                </Box>
                <Box>
                  <Typography variant="h4">{data.overallMetrics.warnings}</Typography>
                  <Typography variant="caption">Warnings</Typography>
                </Box>
                <Box>
                  <Typography variant="h4">{data.overallMetrics.info}</Typography>
                  <Typography variant="caption">Info</Typography>
                </Box>
                <Box>
                  <Typography variant="h4">{data.overallMetrics.total}</Typography>
                  <Typography variant="caption">Total</Typography>
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
          <Grid item xs={12} sm={6} md={4} key={review.category}>
            <Card
              sx={{
                height: '100%',
                borderLeft: `4px solid ${getStatusColor(review.status)}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
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
                      {review.displayName}
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
          All Findings
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
                            {finding.description.substring(0, max_descrfiption_length)}
                            {finding.description.length > max_descrfiption_length && '...'}
                          </Typography>
                          {finding.recommendation && (
                            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                              💡 {finding.recommendation.substring(0, max_descrfiption_length)}
                              {finding.recommendation.length > max_descrfiption_length && '...'}
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
