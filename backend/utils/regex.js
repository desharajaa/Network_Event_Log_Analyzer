/**
 * Regular Expression and Semantic Validation Utility for Network Event Logs
 * Academic Project: Network Event Log Analyzer
 */

// Primary log line regular expression
// Expected format: YYYY-MM-DD HH:MM:SS IP=IPv4 USER=username STATUS=SUCCESS/FAILED
const LOG_PATTERN = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+IP=([^\s]+)\s+USER=([^\s]+)\s+STATUS=([^\s]+)$/;

// Strict IPv4 format: 4 dot-separated integer strings
const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

// Timestamp regex components
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2}):(\d{2})$/;

// Username pattern: alphanumeric, underscore, dot, hyphen (1-64 chars)
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{1,64}$/;

/**
 * Validates whether a given year is a leap year.
 * @param {number} year
 * @returns {boolean}
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Semantically validates date and time strings.
 * @param {string} dateStr YYYY-MM-DD
 * @param {string} timeStr HH:MM:SS
 * @returns {{ valid: boolean, error?: string }}
 */
function validateDateTime(dateStr, timeStr) {
  const dateMatch = dateStr.match(DATE_PATTERN);
  if (!dateMatch) {
    return { valid: false, error: `Invalid date format: '${dateStr}'. Expected YYYY-MM-DD.` };
  }

  const year = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10);
  const day = parseInt(dateMatch[3], 10);

  if (month < 1 || month > 12) {
    return { valid: false, error: `Invalid month: ${month}. Must be between 01 and 12.` };
  }

  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maxDay = daysInMonth[month - 1];

  if (day < 1 || day > maxDay) {
    return {
      valid: false,
      error: `Invalid day: ${day} for month ${month} in year ${year}. Max allowed is ${maxDay}.`
    };
  }

  const timeMatch = timeStr.match(TIME_PATTERN);
  if (!timeMatch) {
    return { valid: false, error: `Invalid time format: '${timeStr}'. Expected HH:MM:SS.` };
  }

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const seconds = parseInt(timeMatch[3], 10);

  if (hours < 0 || hours > 23) {
    return { valid: false, error: `Invalid hour: ${hours}. Must be between 00 and 23.` };
  }
  if (minutes < 0 || minutes > 59) {
    return { valid: false, error: `Invalid minute: ${minutes}. Must be between 00 and 59.` };
  }
  if (seconds < 0 || seconds > 59) {
    return { valid: false, error: `Invalid second: ${seconds}. Must be between 00 and 59.` };
  }

  return { valid: true };
}

/**
 * Semantically validates an IPv4 address string (octets 0-255, no invalid leading zeros).
 * @param {string} ip
 * @returns {{ valid: boolean, error?: string }}
 */
function validateIPv4(ip) {
  const match = ip.match(IPV4_PATTERN);
  if (!match) {
    return {
      valid: false,
      error: `Invalid IPv4 format: '${ip}'. Expected 4 numeric octets separated by dots (e.g., 192.168.1.1).`
    };
  }

  for (let i = 1; i <= 4; i++) {
    const octetStr = match[i];
    const octetNum = parseInt(octetStr, 10);

    // Disallow numbers outside 0-255
    if (octetNum < 0 || octetNum > 255) {
      return {
        valid: false,
        error: `IPv4 octet '${octetStr}' out of range (0-255) in address '${ip}'.`
      };
    }

    // Disallow redundant leading zeros like 01 or 001, but allow single '0'
    if (octetStr.length > 1 && octetStr.startsWith('0')) {
      return {
        valid: false,
        error: `IPv4 octet '${octetStr}' has forbidden leading zero in address '${ip}'.`
      };
    }
  }

  return { valid: true };
}

/**
 * Validates a single log line against Regex pattern and semantic rules.
 * @param {string} rawLine
 * @param {number} lineNumber
 * @returns {{ valid: boolean, data?: object, error?: string, rawLine: string, lineNumber: number }}
 */
function parseAndValidateLine(rawLine, lineNumber = 1) {
  const trimmed = rawLine.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Empty log entry.',
      rawLine,
      lineNumber
    };
  }

  const match = trimmed.match(LOG_PATTERN);
  if (!match) {
    // Provide diagnostic hint for common formatting deviations
    let diagnostic = 'Log entry does not match standard pattern: YYYY-MM-DD HH:MM:SS IP=<IPv4> USER=<username> STATUS=<SUCCESS|FAILED>';
    if (!trimmed.includes('IP=')) diagnostic += " (Missing 'IP=' tag)";
    if (!trimmed.includes('USER=')) diagnostic += " (Missing 'USER=' tag)";
    if (!trimmed.includes('STATUS=')) diagnostic += " (Missing 'STATUS=' tag)";
    return {
      valid: false,
      error: diagnostic,
      rawLine: trimmed,
      lineNumber
    };
  }

  const [, dateStr, timeStr, ipStr, userStr, statusStr] = match;

  // 1. Validate Date and Time semantically
  const dtValidation = validateDateTime(dateStr, timeStr);
  if (!dtValidation.valid) {
    return {
      valid: false,
      error: dtValidation.error,
      rawLine: trimmed,
      lineNumber
    };
  }

  // 2. Validate IPv4 address semantically
  const ipValidation = validateIPv4(ipStr);
  if (!ipValidation.valid) {
    return {
      valid: false,
      error: ipValidation.error,
      rawLine: trimmed,
      lineNumber
    };
  }

  // 3. Validate Username
  if (!USERNAME_PATTERN.test(userStr)) {
    return {
      valid: false,
      error: `Invalid username: '${userStr}'. Must be alphanumeric characters (1-64 chars).`,
      rawLine: trimmed,
      lineNumber
    };
  }

  // 4. Validate Status
  if (statusStr !== 'SUCCESS' && statusStr !== 'FAILED') {
    return {
      valid: false,
      error: `Invalid connection status: '${statusStr}'. Expected 'SUCCESS' or 'FAILED'.`,
      rawLine: trimmed,
      lineNumber
    };
  }

  const timestamp = new Date(`${dateStr}T${timeStr}Z`);

  return {
    valid: true,
    data: {
      date: dateStr,
      time: timeStr,
      timestamp,
      ipAddress: ipStr,
      username: userStr,
      status: statusStr,
      rawLog: trimmed,
      lineNumber
    }
  };
}

module.exports = {
  LOG_PATTERN,
  IPV4_PATTERN,
  DATE_PATTERN,
  TIME_PATTERN,
  USERNAME_PATTERN,
  isLeapYear,
  validateDateTime,
  validateIPv4,
  parseAndValidateLine
};
