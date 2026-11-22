/**
 * Network Log Controller
 * Handles log analysis, retrieval, filtering, and database persistence.
 * Academic Project: Network Event Log Analyzer
 */

const mongoose = require('mongoose');
const NetworkLog = require('../models/NetworkLog');
const SecurityAlert = require('../models/SecurityAlert');
const { parseLogs } = require('../utils/parser');
const { memoryStore } = require('../utils/memoryStore');

/**
 * Helper to check whether MongoDB connection is active.
 * @returns {boolean}
 */
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * POST /api/logs/analyze
 * Accepts uploaded file or raw text input, runs Regex & FSM, and persists to DB.
 */
async function analyzeLogs(req, res, next) {
  try {
    let rawContent = '';

    if (req.file) {
      rawContent = req.file.buffer.toString('utf8');
    } else if (req.body && (req.body.logsText || req.body.logs)) {
      rawContent = (req.body.logsText || req.body.logs).toString();
    }

    if (!rawContent || !rawContent.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Empty log input. Please upload a non-empty .txt/.log file or paste sample logs in the textarea.'
      });
    }

    // Determine initial IP states if MongoDB is connected to continue tracking previous sequences
    let initialIpStates = {};
    if (isDbConnected()) {
      try {
        // Find distinct IPs and their most recent log entry
        const recentLogs = await NetworkLog.aggregate([
          { $sort: { timestamp: -1 } },
          {
            $group: {
              _id: '$ipAddress',
              lastState: { $first: '$fsmState' },
              lastStatus: { $first: '$status' },
              lastTimestamp: { $first: '$timestamp' }
            }
          }
        ]);

        for (const item of recentLogs) {
          const consecutive = item.lastState === 'S1' ? 1 : item.lastState === 'S2' ? 2 : item.lastState === 'S3' ? 3 : 0;
          initialIpStates[item._id] = {
            currentState: item.lastState,
            consecutiveFailures: consecutive,
            activeAlertRaised: item.lastState === 'S3'
          };
        }
      } catch (e) {
        console.warn('[MongoDB aggregate warning]', e.message);
      }
    } else {
      initialIpStates = memoryStore.getIpStates();
    }

    // Execute regex parsing and FSM state transitions
    const analysis = parseLogs(rawContent, initialIpStates);

    const dbConnected = isDbConnected();
    let savedLogsCount = 0;
    let savedAlertsCount = 0;

    if (dbConnected) {
      if (analysis.validLogs.length > 0) {
        // Map to Mongoose schema documents
        const docs = analysis.validLogs.map(log => ({
          timestamp: log.timestamp,
          ipAddress: log.ipAddress,
          username: log.username,
          status: log.status,
          fsmState: log.fsmState,
          previousState: log.previousState,
          input: log.input,
          analysisResult: log.analysisResult,
          rawLog: log.rawLog,
          lineNumber: log.lineNumber
        }));

        const inserted = await NetworkLog.insertMany(docs);
        savedLogsCount = inserted.length;
      }

      if (analysis.alerts.length > 0) {
        const alertDocs = analysis.alerts.map(a => ({
          ipAddress: a.ipAddress,
          totalFailures: a.totalFailures,
          alertType: a.alertType,
          severity: a.severity,
          message: a.message,
          timestamp: a.timestamp
        }));

        const insertedAlerts = await SecurityAlert.insertMany(alertDocs);
        savedAlertsCount = insertedAlerts.length;
      }
    } else {
      // Store in memory for dev/fallback
      const saved = memoryStore.addLogs(analysis.validLogs, analysis.alerts);
      savedLogsCount = saved.logsCount;
      savedAlertsCount = saved.alertsCount;
    }

    res.status(200).json({
      success: true,
      message: `Processed ${analysis.summary.totalLines} lines: ${analysis.summary.validCount} valid, ${analysis.summary.invalidCount} invalid, ${analysis.alerts.length} security alerts generated.`,
      dbStatus: {
        connected: dbConnected,
        storage: dbConnected ? 'MongoDB' : 'In-Memory (MongoDB unavailable)',
        info: dbConnected
          ? 'Connected to MongoDB Database'
          : 'MongoDB is currently disconnected. Data stored in in-memory demo store. Configure MONGODB_URI in backend/.env to enable permanent database persistence.'
      },
      summary: analysis.summary,
      validLogs: analysis.validLogs,
      invalidLogs: analysis.invalidLogs,
      alerts: analysis.alerts,
      ipSummary: analysis.ipSummary
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/logs
 * Retrieve paginated network logs with search, filtering, and sorting.
 */
async function getLogs(req, res, next) {
  try {
    const {
      search,
      status,
      fsmState,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 1 : -1;

    if (isDbConnected()) {
      const query = {};

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ ipAddress: regex }, { username: regex }, { analysisResult: regex }];
      }

      if (status && ['SUCCESS', 'FAILED'].includes(status.toUpperCase())) {
        query.status = status.toUpperCase();
      }

      if (fsmState && ['S0', 'S1', 'S2', 'S3'].includes(fsmState.toUpperCase())) {
        query.fsmState = fsmState.toUpperCase();
      }

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.timestamp.$lte = end;
        }
      }

      const total = await NetworkLog.countDocuments(query);
      const logs = await NetworkLog.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean();

      return res.status(200).json({
        success: true,
        count: logs.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        data: logs
      });
    }

    // Fallback in-memory
    const memResult = memoryStore.getLogs({
      search,
      status,
      fsmState,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      page: pageNum,
      limit: limitNum
    });

    res.status(200).json({
      success: true,
      ...memResult
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/logs/:id
 * Retrieve a specific log by ID.
 */
async function getLogById(req, res, next) {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: `Invalid MongoDB ObjectId: '${id}'`
        });
      }

      const log = await NetworkLog.findById(id).lean();
      if (!log) {
        return res.status(404).json({
          success: false,
          error: `Log with ID '${id}' not found.`
        });
      }

      return res.status(200).json({
        success: true,
        data: log
      });
    }

    // In-memory fallback
    const log = memoryStore.getLogById(id);
    if (!log) {
      return res.status(404).json({
        success: false,
        error: `Log with ID '${id}' not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/logs
 * Clears stored network logs and security alerts when explicitly requested.
 */
async function clearLogs(req, res, next) {
  try {
    let deletedLogs = 0;
    let deletedAlerts = 0;

    if (isDbConnected()) {
      const logRes = await NetworkLog.deleteMany({});
      const alertRes = await SecurityAlert.deleteMany({});
      deletedLogs = logRes.deletedCount;
      deletedAlerts = alertRes.deletedCount;
    }

    // Always clear memory store as well
    const memRes = memoryStore.clear();
    if (!isDbConnected()) {
      deletedLogs = memRes.deletedLogs;
      deletedAlerts = memRes.deletedAlerts;
    }

    res.status(200).json({
      success: true,
      message: 'All network logs and security alerts have been cleared.',
      deleted: {
        logs: deletedLogs,
        alerts: deletedAlerts
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeLogs,
  getLogs,
  getLogById,
  clearLogs,
  isDbConnected
};
