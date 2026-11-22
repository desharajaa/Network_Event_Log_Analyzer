/**
 * In-Memory Data Store
 * Provides fallback storage when MongoDB is not currently running.
 * Academic Project: Network Event Log Analyzer
 */

class MemoryStore {
  constructor() {
    this.logs = [];
    this.alerts = [];
    this.ipStates = {};
    this.counter = 1;
  }

  addLogs(newLogs = [], newAlerts = []) {
    const enrichedLogs = newLogs.map(log => {
      const doc = {
        _id: 'mem_' + (this.counter++),
        ...log,
        createdAt: new Date()
      };
      return doc;
    });

    const enrichedAlerts = newAlerts.map(alert => {
      const doc = {
        _id: 'alert_' + (this.counter++),
        ...alert,
        createdAt: new Date()
      };
      return doc;
    });

    this.logs.push(...enrichedLogs);
    this.alerts.push(...enrichedAlerts);

    // Update IP states
    for (const log of enrichedLogs) {
      const consecutive = log.fsmState === 'S1' ? 1 : log.fsmState === 'S2' ? 2 : log.fsmState === 'S3' ? 3 : 0;
      this.ipStates[log.ipAddress] = {
        currentState: log.fsmState,
        consecutiveFailures: consecutive,
        activeAlertRaised: log.fsmState === 'S3'
      };
    }

    return {
      logsCount: enrichedLogs.length,
      alertsCount: enrichedAlerts.length
    };
  }

  getIpStates() {
    return { ...this.ipStates };
  }

  getLogs({ search, status, fsmState, startDate, endDate, sortBy = 'timestamp', sortOrder = 'desc', page = 1, limit = 20 }) {
    let filtered = [...this.logs];

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(l => 
        (l.ipAddress && l.ipAddress.toLowerCase().includes(term)) ||
        (l.username && l.username.toLowerCase().includes(term)) ||
        (l.analysisResult && l.analysisResult.toLowerCase().includes(term))
      );
    }

    if (status && ['SUCCESS', 'FAILED'].includes(status.toUpperCase())) {
      filtered = filtered.filter(l => l.status === status.toUpperCase());
    }

    if (fsmState && ['S0', 'S1', 'S2', 'S3'].includes(fsmState.toUpperCase())) {
      filtered = filtered.filter(l => l.fsmState === fsmState.toUpperCase());
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const endTime = end.getTime();
      filtered = filtered.filter(l => new Date(l.timestamp).getTime() <= endTime);
    }

    // Sort
    const dir = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'timestamp' || sortBy === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const paginated = filtered.slice(skip, skip + limit);

    return {
      count: paginated.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      data: paginated
    };
  }

  getLogById(id) {
    return this.logs.find(l => l._id.toString() === id.toString()) || null;
  }

  getAlerts({ search, severity, page = 1, limit = 20 }) {
    let filtered = [...this.alerts];

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(a =>
        (a.ipAddress && a.ipAddress.toLowerCase().includes(term)) ||
        (a.message && a.message.toLowerCase().includes(term))
      );
    }

    if (severity && severity.toUpperCase() !== 'ALL') {
      filtered = filtered.filter(a => a.severity === severity.toUpperCase());
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const paginated = filtered.slice(skip, skip + limit);

    return {
      count: paginated.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      data: paginated
    };
  }

  getStats() {
    const totalLogs = this.logs.length;
    let successCount = 0;
    let failedCount = 0;
    let repeatedFailuresCount = 0;

    const fsmCounts = { S0: 0, S1: 0, S2: 0, S3: 0 };
    const ipFailureMap = {};

    for (const log of this.logs) {
      if (log.status === 'SUCCESS') successCount++;
      if (log.status === 'FAILED') {
        failedCount++;
        ipFailureMap[log.ipAddress] = (ipFailureMap[log.ipAddress] || 0) + 1;
      }
      if (log.fsmState === 'S2' || log.fsmState === 'S3') {
        repeatedFailuresCount++;
      }
      if (fsmCounts[log.fsmState] !== undefined) {
        fsmCounts[log.fsmState]++;
      }
    }

    const uniqueIps = new Set(this.logs.map(l => l.ipAddress)).size;
    const successRate = totalLogs > 0 ? ((successCount / totalLogs) * 100).toFixed(1) : 0;

    // Recent 10 logs
    const recentActivities = [...this.logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Latest 5 alerts
    const latestAlerts = [...this.alerts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    // Suspicious IPs list
    const suspiciousIps = Object.entries(ipFailureMap)
      .filter(([, count]) => count >= 2)
      .map(([ip, failures]) => {
        const stateInfo = this.ipStates[ip] || {};
        return {
          ipAddress: ip,
          failedAttempts: failures,
          currentState: stateInfo.currentState || 'S0',
          hasAlert: stateInfo.currentState === 'S3'
        };
      })
      .sort((a, b) => b.failedAttempts - a.failedAttempts)
      .slice(0, 10);

    return {
      totalLogs,
      successCount,
      failedCount,
      repeatedFailuresCount,
      totalAlerts: this.alerts.length,
      uniqueIps,
      successRate,
      fsmCounts,
      recentActivities,
      latestAlerts,
      suspiciousIps
    };
  }

  clear() {
    const deletedLogs = this.logs.length;
    const deletedAlerts = this.alerts.length;
    this.logs = [];
    this.alerts = [];
    this.ipStates = {};
    return { deletedLogs, deletedAlerts };
  }
}

const memoryStore = new MemoryStore();

module.exports = {
  MemoryStore,
  memoryStore
};
