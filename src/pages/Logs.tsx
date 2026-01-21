// src/pages/Logs.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  TextField,
  Card,
  CardContent,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  RefreshRounded,
  DeleteOutlined,
  KeyboardArrowRightOutlined,
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import { apiFetch } from "@/utils/api";
import { COLORS } from "@/styles/themes";

type LogEntry = {
  id?: number;
  timestamp: string;
  level: string;
  category: string;
  message: string;
  data?: Record<string, unknown>;
  ip?: string;
  sess_id?: string;
  remote_user?: string;
};

// Time period constants (in milliseconds)
const TIME_PERIOD_8_HOURS_MS = 28800000; // 8 hours
const TIME_PERIOD_1_DAY_MS = 86400000; // 24 hours
const TIME_PERIOD_3_DAYS_MS = 259200000; // 72 hours
const TIME_PERIOD_8_DAYS_MS = 691200000; // 192 hours

type TimePeriodOption = {
  label: string;
  value: number | null;
};

const TIME_PERIOD_OPTIONS: TimePeriodOption[] = [
  { label: "8 Hours", value: TIME_PERIOD_8_HOURS_MS },
  { label: "1 Day", value: TIME_PERIOD_1_DAY_MS },
  { label: "3 Days", value: TIME_PERIOD_3_DAYS_MS },
  { label: "8 Days", value: TIME_PERIOD_8_DAYS_MS },
  { label: "All Time", value: null },
];

const logs_mb = 1024;

type LogFile = {
  name: string;
  size: number;
  modified: string;
  created: string;
};

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(1000);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<number | null>(
    TIME_PERIOD_8_HOURS_MS,
  );
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

  // Log level colors
  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case "ERROR":
        return "error";
      case "WARN":
        return "warning";
      case "INFO":
        return "info";
      case "DEBUG":
        return "default";
      default:
        return "default";
    }
  };

  // Fetch current logs
  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("limit", limit.toString());

      if (selectedLevel !== "all") {
        params.append("level", selectedLevel);
      }

      // Add time period filter
      if (selectedTimePeriod !== null) {
        const startTime = new Date(
          Date.now() - selectedTimePeriod,
        ).toISOString();
        params.append("startTime", startTime);
      }

      const response = await apiFetch(`/api/logs/current?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data = await response.json();

      // Add IDs for DataGrid
      const logsWithIds = data.logs.map((log: LogEntry, index: number) => ({
        ...log,
        id: index,
      }));

      setLogs(logsWithIds);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError("Failed to load logs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch log files list
  const fetchLogFiles = async () => {
    try {
      const response = await apiFetch("/api/logs/files");

      if (!response.ok) {
        throw new Error("Failed to fetch log files");
      }

      const data = await response.json();
      setLogFiles(data.files || []);
    } catch (err) {
      console.error("Error fetching log files:", err);
    }
  };

  // Clear logs
  const handleClearLogs = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all logs? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await apiFetch("/api/logs/clear", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear logs");
      }

      // Refresh logs after clearing
      fetchLogs();
    } catch (err) {
      console.error("Error clearing logs:", err);
      setError("Failed to clear logs. Please try again.");
    }
  };

  // Filter logs by search term
  const filteredLogs = logs.filter((log) => {
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
      field: "expand",
      headerName: "",
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
          sx={{ p: 0.5 }}
        >
          <KeyboardArrowRightOutlined fontSize="small" />
        </IconButton>
      ),
    },
    {
      field: "timestamp",
      headerName: "Timestamp",
      width: 150,
      valueFormatter: (value) => {
        if (!value) {
          return "N/A";
        }

        try {
          // Parse the ISO string first
          const date = parseISO(value);

          if (isNaN(date.getTime())) {
            return "Invalid Date";
          }

          return format(date, "MMM d, HH:mm:ss");
        } catch (error) {
          console.error("Error formatting timestamp:", error, value);
          return String(value);
        }
      },
    },
    {
      field: "sess_id",
      headerName: "Session ID",
      width: 100,
      valueGetter: (value, row) => {
        // Extract sess_id from either top-level or data object
        const rawSessId = row.sess_id || row.data?.sess_id;
        return typeof rawSessId === "string" && rawSessId.length > 0
          ? rawSessId
          : "-";
      },
      renderCell: (params: GridRenderCellParams) => {
        const sessId = params.value as string;
        return (
          <Typography
            sx={{
              fontSize: "0.8rem",
              fontFamily: "monospace",
              color: COLORS.textPrimary,
            }}
          >
            {sessId}
          </Typography>
        );
      },
    },
    {
      field: "remote_user",
      headerName: "User",
      width: 200,
      valueGetter: (value, row) => {
        // Extract remote_user from either top-level or data object
        const rawUser = row.remote_user || row.data?.remote_user;
        return typeof rawUser === "string" && rawUser.length > 0
          ? rawUser
          : "-";
      },
      renderCell: (params: GridRenderCellParams) => {
        const user = params.value as string;
        return (
          <Typography
            sx={{
              fontSize: "0.8rem",
              color:COLORS.textPrimary,
            }}
          >
            {user}
          </Typography>
        );
      },
    },
    {
      field: "url",
      headerName: "URL",
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const urlValue = params.value || params.row.data?.url || "-";
        return (
          <Typography sx={{ fontSize: "0.8rem", fontFamily: "monospace" }}>
            {urlValue}
          </Typography>
        );
      },
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
      field: "level",
      headerName: "Level",
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          sx={{ 
            fontSize: "0.7rem", 
            color: "#fff",
            border: "1px solid #fff",
            borderRadius: "5px",
          }}
          size="small"
          label={params.value}
        />
      ),
    },
    {
      field: "category",
      headerName: "Category",
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        params.value = params.value === "default" ? "server" : params.value;
        return (
          <Typography sx={{ fontSize: "0.8rem" }}>
            {params.value === undefined || params.value === null
              ? "-"
              : params.value}
          </Typography>
        );
      },
    },
    {
      field: "message",
      headerName: "Message",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const hasData =
          params.row.data && Object.keys(params.row.data).length > 0;
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: "100%",
            }}
          >
            <Typography sx={{ fontSize: "0.8rem", flex: 1 }}>
              {params.value}
            </Typography>
            {hasData && (
              <Chip
                size="small"
                label="JSON"
                variant="outlined"
                sx={{ fontSize: "0.7rem", height: "16px" , color: "#fff", border: "1px solid #fff", borderRadius: "5px" }}
              />
            )}
          </Box>
        );
      },
    },
  ];

  // Load logs on component mount and when filters change
  useEffect(() => {
    fetchLogs();
    fetchLogFiles();
  }, [selectedLevel, limit, selectedTimePeriod]);

  const logs_refresh_interval = 90000;
  // Auto-refresh every 90 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs();
    }, logs_refresh_interval);

    return () => clearInterval(interval);
  }, [selectedLevel, limit, selectedTimePeriod]);

  // Calculate statistics
  const stats = {
    total: logs.length,
    errors: logs.filter((log) => log.level.toUpperCase() === "ERROR").length,
    warnings: logs.filter((log) => log.level.toUpperCase() === "WARN").length,
    info: logs.filter((log) => log.level.toUpperCase() === "INFO").length,
  };

  return (
    <Box mb={3}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: COLORS.textPrimary }}>
        Server Logs Dashboard
      </Typography>
      <Typography variant="subtitle1" paragraph sx={{ color: COLORS.textSecondary, backdropFilter: "blur(2px)" }}>
        Monitor and analyze server activity and errors
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            backgroundColor: COLORS.transparentWhite,
            border: `1px solid ${COLORS.borderWhite}`,
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card
            onClick={() => setSelectedLevel("all")}
            sx={{
              cursor: "pointer",
              transition: "all 0.2s",
              backgroundColor: selectedLevel === "all" ? COLORS.transparentBlackDark : COLORS.transparentBlack,
              backdropFilter: "blur(2px)",
              border: "1px solid #fff",
              "&:hover": {
                backgroundColor: COLORS.transparentBlack,
                transform: "translateY(-2px)",
              },
            }}
          >
            <CardContent sx={{ mb: 0, p: 1, ":last-child": { pb: 0 } }}>
              <Typography sx={{ color: COLORS.textSecondary }} gutterBottom>
                Total Logs
              </Typography>
              <Typography variant="h4" sx={{ color: COLORS.textPrimary }}>{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card
            onClick={() => setSelectedLevel("error")}
            sx={{
              cursor: "pointer",
              transition: "all 0.2s",
              backgroundColor: selectedLevel === "error" ? COLORS.transparentBlackDark : COLORS.transparentBlack,
              backdropFilter: "blur(2px)",
              border: "1px solid #fff",
              "&:hover": {
                backgroundColor: COLORS.transparentBlack,
                transform: "translateY(-2px)",
              },
            }}
          >
            <CardContent sx={{ mb: 0, p: 1, ":last-child": { pb: 0 } }}>
              <Typography sx={{ color: COLORS.primary }} gutterBottom>
                Errors
              </Typography>
              <Typography variant="h4" color={COLORS.primary}>
                {stats.errors}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card
            onClick={() => setSelectedLevel("warn")}
            sx={{
              cursor: "pointer",
              transition: "all 0.2s",
              border: "1px solid #fff",
              backgroundColor: selectedLevel === "warn" ? COLORS.transparentBlackDark : COLORS.transparentBlack,
              backdropFilter: "blur(2px)",
              "&:hover": {
                backgroundColor: COLORS.transparentBlack,
                transform: "translateY(-2px)",
              },
            }}
          >
            <CardContent sx={{ mb: 0, p: 1, ":last-child": { pb: 0 } }}>
              <Typography sx={{ color: COLORS.primary }} gutterBottom>
                Warnings
              </Typography>
              <Typography variant="h4" color={COLORS.primary}>
                {stats.warnings}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card
            onClick={() => setSelectedLevel("info")}
            sx={{
              cursor: "pointer",
              transition: "all 0.2s",
              backgroundColor: selectedLevel === "info" ? COLORS.transparentBlackDark : COLORS.transparentBlack,
              backdropFilter: "blur(2px)",
              border: "1px solid #fff",
              "&:hover": {
                backgroundColor: COLORS.transparentBlack,
                transform: "translateY(-2px)",
              },
            }}
          >
            <CardContent sx={{ mb: 0, p: 1, ":last-child": { pb: 0 } }}>
              <Typography sx={{ color: COLORS.primary }} gutterBottom>
                Info
              </Typography>
              <Typography variant="h4" color={COLORS.primary}>
                {stats.info}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Time Period Filter */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 2,
          backgroundColor: COLORS.transparentBlackDark,
          backdropFilter: "blur(2px)",
          border: `1px solid ${COLORS.borderWhite}`,
        }}
      >
        <Typography variant="body2" sx={{ color: COLORS.textPrimary }}>
          Time Period:
        </Typography>
        <ButtonGroup variant="outlined" size="small">
          {TIME_PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.label}
              variant="outlined"
              onClick={() => setSelectedTimePeriod(option.value)}
              sx={{
                textTransform: "none",
                fontWeight: selectedTimePeriod === option.value ? 500 : 400,
                color: selectedTimePeriod === option.value ? "#fff" : COLORS.transparentWhiteDark,
                backgroundColor: selectedTimePeriod === option.value ? COLORS.transparentBlack : "transparent",
                backdropFilter: "blur(2px)",
                border: "#000 1px solid",
              }}
            >
              {option.label}
            </Button>
          ))}
        </ButtonGroup>
      </Paper>

      {/* Filters and Controls */}
      <Paper sx={{ 
        p: 2, 
        mb: 3,
        backgroundColor: COLORS.transparentBlackDark,
        backdropFilter: "blur(2px)",
        border: `1px solid ${COLORS.borderWhite}`,
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Search logs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by message, category, or level"
              sx={{ color: COLORS.textPrimary, backgroundColor: COLORS.transparentBlack }}
              InputLabelProps={{
                sx: {
                  color: "#ffffff99", // Default label color
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: COLORS.textSecondary}}>Level Filter</InputLabel>
              <Select
                value={selectedLevel}
                label="Level Filter"
                onChange={(e) => setSelectedLevel(e.target.value)}
                sx={{ color: COLORS.textPrimary, backgroundColor: COLORS.transparentBlack }}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="warn">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="debug">Debug</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: COLORS.textSecondary }}>Limit</InputLabel>
              <Select
                value={limit}
                label="Limit"
                onChange={(e) => setLimit(Number(e.target.value))}
                sx={{ color: COLORS.textPrimary, backgroundColor: COLORS.transparentBlack}}
              >
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
                <MenuItem value={250}>250</MenuItem>
                <MenuItem value={500}>500</MenuItem>
                <MenuItem value={1000}>1000</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Refresh logs">
                <IconButton onClick={fetchLogs} disabled={isLoading} sx={{ color: COLORS.textPrimary }}>
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
      <Paper sx={{ 
        height: 600, 
        width: "100%",
        backgroundColor: COLORS.transparent,
        backdropFilter: "blur(2px)",
        border: `1px solid ${COLORS.borderWhite}`,
      }}>
        <DataGrid
          rows={filteredLogs}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          loading={isLoading}
          onRowClick={(params) => setSelectedLog(params.row)}
          getRowHeight={() => "auto"}
          sx={{
            color: "#fff",
            border: "1px solid #fff",
            fontSize: "12px",
            backgroundColor: "transparent",
            backdropFilter: "blur(2px)",
            "--DataGrid-pinnedBackground": "transparentBlack",
            "--DataGrid-containerBackground": "#00000044",
            borderRadius: 1,
            "& .MuiDataGrid-cellContent": {
              maxHeight: "80px", // Set your desired max height
              minHeight: "40px", // Optional: set a minimum height
              whiteSpace: "normal", // Allows text to wrap
            },
            // Optional: ensure rows do not exceed max height if content is smaller
            "& .MuiDataGrid-row": {
              maxHeight: "80px !important",
              "&:hover": {
                backgroundColor: "#0000003f",
              },
            },
            "& .MuiDataGrid-cell": {
              py: 1,
              color: "#fff",
              borderColor: "#ffffff44",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#00000044",
              color: "#fff",
              borderColor: "#ffffff44",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              color: "#fff",
              fontWeight: 600,
            },
            "& .MuiDataGrid-footerContainer": {
              backgroundColor: "#ffffff44",
              color: "#fff",
              borderColor: "#ffffff44",
            },
            "& .MuiTablePagination-root": {
              color: "#fff",
            },
            "& .MuiIconButton-root": {
              color: "#fff",
            },
            "& .MuiDataGrid-overlay": {
              backgroundColor: "#ffffff34",
            },
          }}
          
          getRowClassName={(params) => {
            console.log(params.row.level);
            if (params.row.level === `ERROR`) return "super-hot";
            if (params.row.level === `WARN`) return "hot";
            if (params.row.level === `INFO`) return "info";
            return "miss";
          }}
        />
      </Paper>

      {/* Log Files Section */}
      {logFiles.length > 0 && (
        <Paper sx={{ 
          p: 2, 
          mt: 3,
          backgroundColor: COLORS.transparentBlackDark,
          backdropFilter: "blur(2px)",
          border: `1px solid ${COLORS.borderWhite}`,
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: COLORS.textPrimary }}>
            Available Log Files
          </Typography>
          <Grid container spacing={2}>
            {logFiles.map((file) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={file.name}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    m: 0.5,
                    backgroundColor: COLORS.transparent,
                    backdropFilter: "blur(2px)",
                    border: `1px solid ${COLORS.borderWhite}`,
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: COLORS.textPrimary }}>
                      {file.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ color: COLORS.textSecondary }}
                    >
                      Size: {(file.size / logs_mb).toFixed(2)} KB
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ color: COLORS.textSecondary }}
                    >
                      Modified:{" "}
                      {format(new Date(file.modified), "MMM d, yyyy HH:mm")}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
      {selectedLog && (
        <Dialog
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6">Log Entry Details</Typography>
              <Chip
                size="small"
                label={selectedLog.level}
                color={getLevelColor(selectedLog.level) as any}
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedLog.timestamp}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    User
                  </Typography>
                  <Typography variant="body2">
                    {(() => {
                      const user =
                        selectedLog.remote_user ||
                        selectedLog.data?.remote_user;
                      return typeof user === "string" && user.length > 0
                        ? user
                        : "-";
                    })()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body2">
                    {selectedLog.category}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Session ID
                  </Typography>
                  <Typography
                    variant="body2"
                    fontFamily="monospace"
                    color="primary.main"
                  >
                    {(() => {
                      const sessId =
                        selectedLog.sess_id || selectedLog.data?.sess_id;
                      return typeof sessId === "string" && sessId.length > 0
                        ? sessId
                        : "-";
                    })()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedLog.ip === "::1" ? "localhost" : selectedLog.ip}
                  </Typography>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Message
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {selectedLog.message}
                </Typography>
              </Box>

              {selectedLog.data && Object.keys(selectedLog.data).length > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1, display: "block" }}
                  >
                    JSON Data
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "#1e1e1e",
                      color: "#d4d4d4",
                      overflow: "auto",
                      maxHeight: "400px",
                    }}
                  >
                    <pre
                      style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        fontFamily:
                          'Consolas, Monaco, "Courier New", monospace',
                      }}
                    >
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
