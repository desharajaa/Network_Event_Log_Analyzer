/**
 * Network Event Log Parser
 * Coordinates Regex validation, line-by-line parsing, and FSM sequence analysis.
 * Academic Project: Network Event Log Analyzer
 */

const { parseAndValidateLine } = require('./regex');
const { NetworkFSMTracker } = require('./stateMachine');

/**
 * Parses raw text input containing multiple network event log lines.
 * 
 * @param {string} rawContent Full text content of log file or manual input.
 * @param {object} initialIpStates Optional previous IP states map for ongoing tracking.
 * @returns {{
 *   validLogs: Array<object>,
 *   invalidLogs: Array<object>,
 *   alerts: Array<object>,
 *   summary: {
 *     totalLines: number,
 *     validCount: number,
 *     invalidCount: number,
 *     successCount: number,
 *     failedCount: number,
 *     alertCount: number,
 *     uniqueIps: number
 *   }
 * }}
 */
function parseLogs(rawContent, initialIpStates = {}) {
  if (!rawContent || typeof rawContent !== 'string') {
    return {
      validLogs: [],
      invalidLogs: [],
      alerts: [],
      summary: {
        totalLines: 0,
        validCount: 0,
        invalidCount: 0,
        successCount: 0,
        failedCount: 0,
        alertCount: 0,
        uniqueIps: 0
      }
    };
  }

  // Normalize line breaks and split
  const lines = rawContent.split(/\r?\n/);
  const rawParsedValid = [];
  const invalidLogs = [];

  let lineNumber = 0;
  for (const line of lines) {
    lineNumber++;
    const trimmed = line.trim();

    // Ignore blank lines
    if (!trimmed) {
      continue;
    }

    const parseResult = parseAndValidateLine(trimmed, lineNumber);

    if (parseResult.valid) {
      rawParsedValid.push(parseResult.data);
    } else {
      invalidLogs.push({
        lineNumber,
        rawLine: trimmed,
        error: parseResult.error || 'Syntax error: does not conform to network log specification.'
      });
    }
  }

  // Execute Finite State Machine processing on all valid logs
  const tracker = new NetworkFSMTracker(initialIpStates);
  const { processedLogs, alerts, ipSummary } = tracker.processBatch(rawParsedValid);

  let successCount = 0;
  let failedCount = 0;
  const ipSet = new Set();

  for (const log of processedLogs) {
    if (log.status === 'SUCCESS') successCount++;
    if (log.status === 'FAILED') failedCount++;
    if (log.ipAddress) ipSet.add(log.ipAddress);
  }

  return {
    validLogs: processedLogs,
    invalidLogs,
    alerts,
    ipSummary,
    summary: {
      totalLines: rawParsedValid.length + invalidLogs.length,
      validCount: processedLogs.length,
      invalidCount: invalidLogs.length,
      successCount,
      failedCount,
      alertCount: alerts.length,
      uniqueIps: ipSet.size
    }
  };
}

module.exports = {
  parseLogs
};
