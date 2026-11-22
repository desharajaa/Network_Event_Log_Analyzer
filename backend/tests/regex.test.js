/**
 * Automated Tests for Regular Expression and Semantic Validation
 * Academic Project: Network Event Log Analyzer
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  parseAndValidateLine,
  validateIPv4,
  validateDateTime,
  isLeapYear
} = require('../utils/regex');

describe('Regex & Semantic Validation Tests', () => {
  it('should validate and parse a standard valid SUCCESS log line', () => {
    const line = '2026-11-13 10:00:01 IP=192.168.1.10 USER=admin STATUS=SUCCESS';
    const result = parseAndValidateLine(line, 1);

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.data.ipAddress, '192.168.1.10');
    assert.strictEqual(result.data.username, 'admin');
    assert.strictEqual(result.data.status, 'SUCCESS');
    assert.strictEqual(result.data.date, '2026-11-13');
    assert.strictEqual(result.data.time, '10:00:01');
  });

  it('should validate and parse a standard valid FAILED log line', () => {
    const line = '2026-11-13 10:01:01 IP=192.168.1.20 USER=root STATUS=FAILED';
    const result = parseAndValidateLine(line, 2);

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.data.ipAddress, '192.168.1.20');
    assert.strictEqual(result.data.username, 'root');
    assert.strictEqual(result.data.status, 'FAILED');
  });

  it('should reject IPv4 octets greater than 255', () => {
    const line = '2026-11-13 10:00:01 IP=256.168.1.10 USER=admin STATUS=SUCCESS';
    const result = parseAndValidateLine(line, 3);

    assert.strictEqual(result.valid, false);
    assert.match(result.error, /out of range/i);
  });

  it('should reject IPv4 octets with leading zeros (e.g. 192.168.01.1)', () => {
    const line = '2026-11-13 10:00:01 IP=192.168.01.1 USER=admin STATUS=SUCCESS';
    const result = parseAndValidateLine(line, 4);

    assert.strictEqual(result.valid, false);
    assert.match(result.error, /leading zero/i);
  });

  it('should reject invalid calendar months (e.g., month 13)', () => {
    const line = '2026-13-10 10:00:01 IP=192.168.1.1 USER=admin STATUS=SUCCESS';
    const result = parseAndValidateLine(line, 5);

    assert.strictEqual(result.valid, false);
    assert.match(result.error, /month/i);
  });

  it('should reject invalid days for February in non-leap year (e.g. 2025-02-29)', () => {
    const line = '2025-02-29 10:00:01 IP=192.168.1.1 USER=admin STATUS=SUCCESS';
    const result = parseAndValidateLine(line, 6);

    assert.strictEqual(result.valid, false);
    assert.match(result.error, /day: 29 for month 2/i);
  });

  it('should accept 29th February in leap year (e.g. 2024-02-29)', () => {
    const line = '2024-02-29 10:00:01 IP=192.168.1.1 USER=admin STATUS=SUCCESS';
    const result = parseAndValidateLine(line, 7);

    assert.strictEqual(result.valid, true);
  });

  it('should reject invalid hour (e.g. 25:00:00)', () => {
    const line = '2026-11-13 25:00:01 IP=192.168.1.1 USER=admin STATUS=SUCCESS';
    const result = parseAndValidateLine(line, 8);

    assert.strictEqual(result.valid, false);
    assert.match(result.error, /hour/i);
  });

  it('should reject unsupported status (e.g. UNKNOWN or PENDING)', () => {
    const line = '2026-11-13 10:00:01 IP=192.168.1.1 USER=admin STATUS=UNKNOWN';
    const result = parseAndValidateLine(line, 9);

    assert.strictEqual(result.valid, false);
    assert.match(result.error, /status/i);
  });

  it('should reject malformed lines missing required fields', () => {
    const line = '2026-11-13 10:00:01 IP=192.168.1.1 STATUS=SUCCESS';
    const result = parseAndValidateLine(line, 10);

    assert.strictEqual(result.valid, false);
    assert.match(result.error, /USER/i);
  });
});
