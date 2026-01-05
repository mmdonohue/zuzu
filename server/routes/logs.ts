// server/routes/logs.ts
import express from 'express';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger.js';

const router = express.Router();

// Cache for log data
interface LogCache {
  size: number;
  mtime: number;
  logs: LogEntry[];
}

let logCache: LogCache | null = null;

// Use process.cwd() to get the project root
const getLogsDir = () => path.join(process.cwd(), 'logs');
const getLogFile = () => path.join(getLogsDir(), 'app.log');

interface LogEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  ip?: string;
  url?: string;
  data?: Record<string, unknown>;
}


// Split log content into individual entries (timestamp to timestamp)
const splitLogEntries = (content: string): string[] => {
  // Match log4js timestamp format: [2025-12-10T17:35:11.323]
  const timestampRegex = /\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})\]/g;

  const entries: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = timestampRegex.exec(content)) !== null) {
    if (lastIndex > 0) {
      // Extract entry from lastIndex to current match
      entries.push(content.substring(lastIndex, match.index).trim());
    }
    lastIndex = match.index;
  }

  // Add the last entry
  if (lastIndex > 0) {
    entries.push(content.substring(lastIndex).trim());
  }
  // console.log(`Split log content into ${entries.length} entries`);
  return entries.filter(entry => entry.length > 0);
};

// Extract JSON data from markers [[[ ... ]]]
const extractJsonData = (text: string): Record<string, unknown>[] => {
  const jsonObjects: Record<string, unknown>[] = [];
  const jsonRegex = /\[\[\[([\s\S]*?)\]\]\]/g;
  let match;

  while ((match = jsonRegex.exec(text)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const parsed = JSON.parse(jsonStr);
      jsonObjects.push(parsed);
    } catch (error) {
      // console.error('Error parsing JSON from markers:', error);
    }
  }

  return jsonObjects;
};

const parseLogEntry = (entry: string): LogEntry | null => {
  if (!entry.trim()) return null;

  try {
    // Extract timestamp [2025-12-10T17:35:11.323]
    const timestampMatch = entry.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})\]/);
    const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();

    // Extract level [INFO], [ERROR], etc.
    const levelMatch = entry.match(/\]\s*\[(INFO|ERROR|WARN|DEBUG|TRACE)\]/);
    const level = levelMatch ? levelMatch[1] : 'INFO';

    // Extract category
    const categoryMatch = entry.match(/\]\s*\[(?:INFO|ERROR|WARN|DEBUG|TRACE)\]\s*(\S+)/);
    const category = categoryMatch ? categoryMatch[1] : 'default';

    // Extract JSON data from markers
    const jsonData = extractJsonData(entry);
    // replace any password fields in jsonData with ****
    jsonData.forEach((obj, index) => {
      if ('password' in obj) {
        // SECURITY-IGNORE: Password sanitization for logging, not a hardcoded credential
        jsonData[index] = { ...obj, password: '****' };
        // console.log('Redacted log entry data:', jsonData[index]);
      }
    });

    // Remove JSON markers from message to get clean text
    let message = entry
      .replace(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})\]/, '')
      .replace(/\[(?:INFO|ERROR|WARN|DEBUG|TRACE)\]/, '')
      .replace(/^\s*\S+\s*-\s*/, '') // Remove category
      .replace(/\[\[\[[\s\S]*?\]\]\]/g, '[JSON]') // Replace JSON blocks with placeholder
      .trim();

    // find and replace any occurrence of password: "somevalue" in the message with password: "****"
    message = message.replace(/(password:\s*')[^']*(')/gi, '$1****$2');

    // Extract IP from data if available
    let ip = '-';
    let combinedData: Record<string, unknown> = {};
    let url = '-';

    if (jsonData.length > 0) {
      // Merge all JSON objects
      jsonData.forEach(obj => {
        combinedData = { ...combinedData, ...obj };
      });
      ip = (typeof combinedData.ip === 'string' ? combinedData.ip : '') || 
           (typeof combinedData.clientIp === 'string' ? combinedData.clientIp : '') || 
           '-';
      url = (typeof combinedData.url === 'string' ? combinedData.url : '') || '-';
      // combinedData.body = combinedData.body ? JSON.parse(combinedData.body) : '-';
    }

    return {
      timestamp,
      level,
      category,
      message,
      ip,
      url,
      data: Object.keys(combinedData).length > 0 ? combinedData : undefined
    };
  } catch (error) {
    console.error('Error parsing log entry:', error);
    return {
      timestamp: new Date().toISOString(),
      level: 'UNKNOWN',
      category: 'default',
      message: entry,
      ip: '-'
    };
  }
};

// GET current log file
router.get('/current', async (req: Request, res: Response) => {
  const { limit = 100, level, startTime } = req.query;

  try {
    const logFile = getLogFile();

    // Check if log file exists
    if (!fs.existsSync(logFile)) {
      return res.json({ logs: [], message: 'No logs available yet', cached: false });
    }

    // Get file stats
    const stats = fs.statSync(logFile);
    const currentSize = stats.size;
    const currentMtime = stats.mtimeMs;

    // Check if cache is valid
    if (logCache &&
        logCache.size === currentSize &&
        logCache.mtime === currentMtime) {
      // File hasn't changed, return cached data
      let logs = [...logCache.logs];

      // Apply filters to cached data
      if (level && typeof level === 'string') {
        logs = logs.filter(log => log.level.toLowerCase() === level.toLowerCase());
      }

      // Apply time period filter
      if (startTime && typeof startTime === 'string') {
        const startTimeMs = new Date(startTime).getTime();
        logs = logs.filter(log => {
          const logTimeMs = new Date(log.timestamp).getTime();
          return logTimeMs >= startTimeMs;
        });
      }

      const limitNum = parseInt(limit as string, 10);
      if (!isNaN(limitNum)) {
        logs = logs.slice(0, limitNum);
      }

      return res.json({ logs, total: logs.length, cached: true });
    }

    // File has changed or no cache, read and parse
    const fileContent = fs.readFileSync(logFile, 'utf-8');
    const entries = splitLogEntries(fileContent);

    // Parse all entries
    let allLogs = entries
      .map(parseLogEntry)
      .filter((log): log is LogEntry => log !== null)
      .reverse(); // Most recent first

    // Update cache with all parsed logs
    logCache = {
      size: currentSize,
      mtime: currentMtime,
      logs: allLogs
    };

    // Apply filters for response
    let logs = [...allLogs];

    if (level && typeof level === 'string') {
      logs = logs.filter(log => log.level.toLowerCase() === level.toLowerCase());
    }

    // Apply time period filter
    if (startTime && typeof startTime === 'string') {
      const startTimeMs = new Date(startTime).getTime();
      logs = logs.filter(log => {
        const logTimeMs = new Date(log.timestamp).getTime();
        return logTimeMs >= startTimeMs;
      });
    }

    const limitNum = parseInt(limit as string, 10);
    if (!isNaN(limitNum)) {
      logs = logs.slice(0, limitNum);
    }

    res.json({ logs, total: logs.length, cached: false });

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

    // Invalidate cache
    logCache = null;

    res.json({ message: 'Logs cleared successfully' });

  } catch (error) {
    logger.error('Error clearing log file:', error);
    res.status(500).json({ error: 'Failed to clear log file' });
  }
});

export default router;