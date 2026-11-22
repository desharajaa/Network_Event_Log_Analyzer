/**
 * Dashboard Controller
 * Computes dynamic statistics, aggregations, charts, and activity feeds.
 * Academic Project: Network Event Log Analyzer
 */

const mongoose = require('mongoose');
const NetworkLog = require('../models/NetworkLog');
const SecurityAlert = require('../models/SecurityAlert');
const { memoryStore } = require('../utils/memoryStore');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * GET /api/dashboard/stats
 * Dynamic aggregate stats for dashboard metrics and visualizations.
 */
async function getDashboardStats(req, res, next) {
  try {
    const dbConnected = isDbConnected();

    if (dbConnected) {
      // 1. Total counts
      const [totalLogs, successCount, failedCount, repeatedFailuresCount, totalAlerts] = await Promise.all([
        NetworkLog.countDocuments({}),
        NetworkLog.countDocuments({ status: 'SUCCESS' }),
        NetworkLog.countDocuments({ status: 'FAILED' }),
        NetworkLog.countDocuments({ fsmState: { $in: ['S2', 'S3'] } }),
        SecurityAlert.countDocuments({})
      ]);

      // 2. Unique IP count
      const uniqueIpsList = await NetworkLog.distinct('ipAddress');
      const uniqueIps = uniqueIpsList.length;

      // 3. FSM distribution
      const fsmAggregate = await NetworkLog.aggregate([
        { $group: { _id: '$fsmState', count: { $sum: 1 } } }
      ]);
      const fsmCounts = { S0: 0, S1: 0, S2: 0, S3: 0 };
      fsmAggregate.forEach(item => {
        if (item._id && fsmCounts[item._id] !== undefined) {
          fsmCounts[item._id] = item.count;
        }
      });

      // 4. Recent network activities (latest 10)
      const recentActivities = await NetworkLog.find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();

      // 5. Latest security alerts (latest 5)
      const latestAlerts = await SecurityAlert.find({})
        .sort({ timestamp: -1 })
        .limit(5)
        .lean();

      // 6. Suspicious IP addresses (IPs with 2+ failures or S3 alert state)
      const suspiciousIpsAgg = await NetworkLog.aggregate([
        { $match: { status: 'FAILED' } },
        {
          $group: {
            _id: '$ipAddress',
            failedAttempts: { $sum: 1 },
            lastState: { $first: '$fsmState' },
            usernames: { $addToSet: '$username' },
            lastAttempt: { $max: '$timestamp' }
          }
        },
        { $sort: { failedAttempts: -1 } },
        { $limit: 10 }
      ]);

      const suspiciousIps = suspiciousIpsAgg.map(item => ({
        ipAddress: item._id,
        failedAttempts: item.failedAttempts,
        currentState: item.lastState || 'S1',
        targetedUsers: item.usernames || [],
        hasAlert: item.failedAttempts >= 3,
        lastAttempt: item.lastAttempt
      }));

      const successRate = totalLogs > 0 ? ((successCount / totalLogs) * 100).toFixed(1) : 0;

      return res.status(200).json({
        success: true,
        dbStatus: {
          connected: true,
          storage: 'MongoDB'
        },
        data: {
          totalLogs,
          successCount,
          failedCount,
          repeatedFailuresCount,
          totalAlerts,
          uniqueIps,
          successRate,
          fsmCounts,
          recentActivities,
          latestAlerts,
          suspiciousIps
        }
      });
    }

    // In-memory fallback
    const memStats = memoryStore.getStats();

    res.status(200).json({
      success: true,
      dbStatus: {
        connected: false,
        storage: 'In-Memory (MongoDB unavailable)',
        message: 'MongoDB is disconnected. Stats are rendered dynamically from in-memory session.'
      },
      data: memStats
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats
};
