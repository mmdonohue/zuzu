// server/routes/logs.ts
import express from 'express';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger.js';

const router = express.Router();


// Use process.cwd() to get the project root
const getLogsDir = () => path.join(process.cwd(), 'logs');
const getLogFile = () => path.join(getLogsDir(), 'app.log');

interface LogEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  ip?: string;
  data?: any;
}


const parseLogLine = (line: string): LogEntry | null => {
  if (!line.trim()) return null;
  
  try {
    // Morgan format: IP - - [timestamp] "METHOD URL HTTP/version" status size "referer" "user-agent" - response-time ms
    const morganRegex = /^(\S+)\s+-\s+-\s+\[([^\]]+)\]\s+"(\w+)\s+([^\s]+)\s+HTTP\/[\d.]+"\s+(\d+)\s+(\S+)\s+"([^"]*)"\s+"([^"]*)"\s+-\s+([\d.]+)\s+ms$/;
    const match = line.match(morganRegex);
    
    if (match) {
      const ip = match[1];
      const timestamp = match[2]; // e.g., "03/Dec/2025:03:55:24 +0000"
      const method = match[3];
      const url = match[4];
      const status = match[5];
      const size = match[6];
      const referer = match[7];
      const userAgent = match[8];
      const responseTime = match[9];
      
      // Convert the timestamp to ISO format
      // Format: "03/Dec/2025:03:55:24 +0000"
      const [datePart, timePart] = timestamp.split(':');
      const [day, month, year] = datePart.split('/');
      const monthMap: { [key: string]: string } = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      const monthNum = monthMap[month] || '01';
      
      // Reconstruct as ISO timestamp
      const isoTimestamp = `${year}-${monthNum}-${day}T${timePart}`;
      
      // Determine level based on status code
      let level = 'INFO';
      const statusNum = parseInt(status);
      if (statusNum >= 500) level = 'ERROR';
      else if (statusNum >= 400) level = 'WARN';
      else if (statusNum >= 300) level = 'INFO';
      
      return {
        timestamp: isoTimestamp,
        level,
        category: 'http',
        message: `${method} ${url} - ${status} (${responseTime}ms)`,
        ip, // Add IP at the top level for easier access
        data: {
          ip,
          method,
          url,
          status: statusNum,
          size,
          referer,
          userAgent,
          responseTime: parseFloat(responseTime)
        }
      };
    }
    
    // Fallback: Log4js format for non-HTTP logs
    const log4jsRegex = /^\[([^\]]+)\]\s*\[([^\]]+)\]\s*([^\s]+)\s*-\s*(.+)$/;

    const log4jsMatch = line.match(log4jsRegex);
    
    if (log4jsMatch) {
      return {
        timestamp: log4jsMatch[1].trim(),
        level: log4jsMatch[2].trim(),
        category: log4jsMatch[3].trim(),
        message: log4jsMatch[4].trim(),
        ip: '-' // No IP for non-HTTP logs
      };
    }
    
    // If all parsing fails, return a basic entry
    return {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'default',
      message: line,
      ip: '-'
    };
  } catch (error) {
    console.error('Error parsing log line:', error, 'Line:', line);
    return {
      timestamp: new Date().toISOString(),
      level: 'UNKNOWN',
      category: 'default',
      message: line,
      ip: '-'
    };
  }
};

// GET current log file
router.get('/current', async (req: Request, res: Response) => {
  const { limit = 100, level } = req.query;
  
  try {
    const logFile = getLogFile();
    console.log('Reading log file from:', logFile);
    
    // Check if log file exists
    if (!fs.existsSync(logFile)) {
      console.log('Log file does not exist yet');
      return res.json({ logs: [], message: 'No logs available yet' });
    }
    
    // Read the log file
    const fileContent = fs.readFileSync(logFile, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Parse each line
    let logs = lines
      .map(parseLogLine)
      .filter((log): log is LogEntry => log !== null)
      .reverse(); // Most recent first
    
    // Filter by level if specified
    if (level && typeof level === 'string') {
      logs = logs.filter(log => log.level.toLowerCase() === level.toLowerCase());
    }
    
    // Limit results
    const limitNum = parseInt(limit as string, 10);
    if (!isNaN(limitNum)) {
      logs = logs.slice(0, limitNum);
    }
    
    logger.info(`Retrieved ${logs.length} log entries`);
    res.json({ logs, total: logs.length });
    
  } catch (error) {
    logger.error('Error reading log file:', error);
    res.status(500).json({ error: 'Failed to read log file' });
  }
});

// GET log files list
router.get('/files', async (req: Request, res: Response) => {
  try {
    const logsDir = getLogsDir();

    if (!fs.existsSync(logsDir)) {
      return res.json({ files: [] });
    }
    
    const files = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.log'))
      .map(file => {
        const stats = fs.statSync(path.join(logsDir, file));
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());
    
    res.json({ files });
    
  } catch (error) {
    logger.error('Error reading log directory:', error);
    res.status(500).json({ error: 'Failed to read log directory' });
  }
});

// Clear logs
router.delete('/clear', async (req: Request, res: Response) => {
  try {
    const logFile = getLogFile();

    if (fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, '');
      logger.info('Log file cleared');
    }
    
    res.json({ message: 'Logs cleared successfully' });
    
  } catch (error) {
    logger.error('Error clearing log file:', error);
    res.status(500).json({ error: 'Failed to clear log file' });
  }
});

export default router;