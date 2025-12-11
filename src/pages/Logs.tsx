// src/pages/Logs.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  RefreshRounded,
  DeleteOutlined,
  FilterListOutlined,
  DownloadOutlined,
  ExpandMoreOutlined,
  KeyboardArrowDownOutlined,
  KeyboardArrowRightOutlined
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

interface LogEntry {
  id?: number;
  timestamp: string;
  level: string;
  category: string;
  message: string;
  data?: any;
  ip?: string;
}

interface LogFile {
  name: string;
  size: number;
  modified: string;
  created: string;
}

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [paginationModel, setPaginationModel] = useState({
            pageSize: 25,
            page: 0,
        });
  
  // Log level colors
  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'error';
      case 'WARN':
        return 'warning';
      case 'INFO':
        return 'info';
      case 'DEBUG':
        return 'default';
      default:
        return 'default';
    }
  };
  
  // Fetch current logs
  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const levelParam = selectedLevel !== 'all' ? `&level=${selectedLevel}` : '';
      const response = await fetch(`/api/logs/current?limit=${limit}${levelParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      
      // Add IDs for DataGrid
      const logsWithIds = data.logs.map((log: LogEntry, index: number) => ({
        ...log,
        id: index
      }));
      
      setLogs(logsWithIds);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load logs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch log files list
  const fetchLogFiles = async () => {
    try {
      const response = await fetch('/api/logs/files');
      
      if (!response.ok) {
        throw new Error('Failed to fetch log files');
      }
      
      const data = await response.json();
      setLogFiles(data.files || []);
    } catch (err) {
      console.error('Error fetching log files:', err);
    }
  };
  
  // Clear logs
  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/logs/clear', {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear logs');
      }
      
      // Refresh logs after clearing
      fetchLogs();
    } catch (err) {
      console.error('Error clearing logs:', err);
      setError('Failed to clear logs. Please try again.');
    }
  };
  
  // Filter logs by search term
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.message.toLowerCase().includes(searchLower) ||
      log.category.toLowerCase().includes(searchLower) ||
      log.level.toLowerCase().includes(searchLower)
    );
  });
  
  // Define columns for DataGrid
  const columns: GridColDef[] = [
    {
      field: 'expand',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(params.row);
          }}
          disabled={!params.row.data}
        >
          <KeyboardArrowRightOutlined fontSize="small" />
        </IconButton>
      )
    },
    {
        field: 'timestamp',
        headerName: 'Timestamp',
        width: 180,
        valueFormatter: (value) => {
        if (!value) {
            return 'N/A';
        }

        try {
            // Parse the ISO string first
            const date = parseISO(value);

            if (isNaN(date.getTime())) {
            return 'Invalid Date';
            }

            return format(date, 'MMM d, HH:mm:ss');
        } catch (error) {
            console.error('Error formatting timestamp:', error, value);
            return String(value);
        }
        }
    },
    {
        field: 'url',
        headerName: 'URL',
        width: 200,
        renderCell: (params: GridRenderCellParams) => {
            const urlValue = params.value || params.row.data?.url || '-';
            return (
                <Typography sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                    {urlValue}
                </Typography>
            );
        }
    },
    /*
    {
        field: 'ip',
        headerName: 'IP Address',
        width: 130,
        renderCell: (params: GridRenderCellParams) => {
        const ipValue = params.value || params.row.data?.ip || '-';
        // Convert ::1 (IPv6 localhost) to a more readable format
        const displayIp = ipValue === '::1' ? 'localhost' : ipValue;
        
        return (
            <Typography sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
            {displayIp}
            </Typography>
        );
        }
    },
    */
    {
      field: 'level',
      headerName: 'Level',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          size="small" 
          label={params.value} 
          color={getLevelColor(params.value) as any}
        />
      )
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        params.value  = params.value === 'default' ? 'server' : params.value;
        return (  
          <Typography sx={{ fontSize: '0.875rem' }}>
            {params.value === undefined || params.value === null ? '-' : params.value}
          </Typography>
        );
      }
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const hasData = params.row.data && Object.keys(params.row.data).length > 0;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Typography sx={{ fontSize: '0.875rem', flex: 1 }}>
              {params.value}
            </Typography>
            {hasData && (
              <Chip
                size="small"
                label="JSON"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: '20px' }}
              />
            )}
          </Box>
        );
      }
    }
  ];
  
  // Load logs on component mount and when filters change
  useEffect(() => {
    fetchLogs();
    fetchLogFiles();
  }, [selectedLevel, limit]);
  
  // Auto-refresh every 90 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs();
    }, 90000);
    
    return () => clearInterval(interval);
  }, [selectedLevel, limit]);
  
  // Calculate statistics
  const stats = {
    total: logs.length,
    errors: logs.filter(log => log.level.toUpperCase() === 'ERROR').length,
    warnings: logs.filter(log => log.level.toUpperCase() === 'WARN').length,
    info: logs.filter(log => log.level.toUpperCase() === 'INFO').length
  };

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Server Logs Dashboard
      </Typography>
      <Typography variant="subtitle1" paragraph color="text.secondary">
        Monitor and analyze server activity and errors
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Logs
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Errors
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.errors}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Warnings
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.warnings}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Info
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.info}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Filters and Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Search logs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by message, category, or level"
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Level Filter</InputLabel>
              <Select
                value={selectedLevel}
                label="Level Filter"
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="warn">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="debug">Debug</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Limit</InputLabel>
              <Select
                value={limit}
                label="Limit"
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
                <MenuItem value={250}>250</MenuItem>
                <MenuItem value={500}>500</MenuItem>
                <MenuItem value={1000}>1000</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh logs">
                <IconButton onClick={fetchLogs} disabled={isLoading}>
                  <RefreshRounded />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear all logs">
                <IconButton onClick={handleClearLogs} color="error">
                  <DeleteOutlined />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Logs DataGrid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
            rows={filteredLogs}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            loading={isLoading}
            onRowClick={(params) => setSelectedLog(params.row)}
            getRowHeight={() => 'auto'}
            sx={{
            '& .MuiDataGrid-cell': {
                py: 1
            }
            }}
        />
      </Paper>
      
      {/* Log Files Section */}
      {logFiles.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Available Log Files
          </Typography>
          <Grid container spacing={2}>
            {logFiles.map((file) => (
              <Grid item xs={12} sm={6} md={4} key={file.name}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Size: {(file.size / 1024).toFixed(2)} KB
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Modified: {format(new Date(file.modified), 'MMM d, yyyy HH:mm')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
      {selectedLog && (
        <Dialog open={!!selectedLog} onClose={() => setSelectedLog(null)} maxWidth="lg" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">Log Entry Details</Typography>
              <Chip
                size="small"
                label={selectedLog.level}
                color={getLevelColor(selectedLog.level) as any}
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedLog.timestamp}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">IP Address</Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedLog.ip === '::1' ? 'localhost' : selectedLog.ip}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Typography variant="body2">{selectedLog.category}</Typography>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="caption" color="text.secondary">Message</Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {selectedLog.message}
                </Typography>
              </Box>

              {selectedLog.data && Object.keys(selectedLog.data).length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    JSON Data
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: '#1e1e1e',
                      color: '#d4d4d4',
                      overflow: 'auto',
                      maxHeight: '400px'
                    }}
                  >
                    <pre style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                    }}>
                      {JSON.stringify(selectedLog.data, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedLog(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Logs;