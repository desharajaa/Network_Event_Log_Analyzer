/**
 * Automated Tests for Finite State Machine (FSM) Engine
 * Academic Project: Network Event Log Analyzer
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  STATES,
  INPUTS,
  transition,
  NetworkFSMTracker
} = require('../utils/stateMachine');
const { parseLogs } = require('../utils/parser');

describe('Finite State Machine (FSM) Unit Tests', () => {
  describe('Deterministic State Transitions', () => {
    it('S0 + F -> S1 (First Failure)', () => {
      const step = transition(STATES.S0, INPUTS.FAILED);
      assert.strictEqual(step.nextState, STATES.S1);
      assert.strictEqual(step.triggerAlert, false);
      assert.strictEqual(step.action, 'RECORD_FIRST_FAILURE');
    });

    it('S1 + F -> S2 (Second Failure)', () => {
      const step = transition(STATES.S1, INPUTS.FAILED);
      assert.strictEqual(step.nextState, STATES.S2);
      assert.strictEqual(step.triggerAlert, false);
      assert.strictEqual(step.action, 'RECORD_SECOND_FAILURE');
    });

    it('S2 + F -> S3 (Third Failure triggers HIGH Alert)', () => {
      const step = transition(STATES.S2, INPUTS.FAILED);
      assert.strictEqual(step.nextState, STATES.S3);
      assert.strictEqual(step.triggerAlert, true);
      assert.strictEqual(step.action, 'TRIGGER_SECURITY_ALERT');
    });

    it('S3 + F -> S3 (Subsequent Failure in Alert State does not re-alert)', () => {
      const step = transition(STATES.S3, INPUTS.FAILED);
      assert.strictEqual(step.nextState, STATES.S3);
      assert.strictEqual(step.triggerAlert, false);
      assert.strictEqual(step.action, 'MAINTAIN_ALERT_STATE');
    });

    it('S0 + S -> S0 (Maintain Normal)', () => {
      const step = transition(STATES.S0, INPUTS.SUCCESS);
      assert.strictEqual(step.nextState, STATES.S0);
      assert.strictEqual(step.action, 'MAINTAIN_NORMAL');
    });

    it('S1 + S -> S0 (Reset to Normal)', () => {
      const step = transition(STATES.S1, INPUTS.SUCCESS);
      assert.strictEqual(step.nextState, STATES.S0);
      assert.strictEqual(step.action, 'RESET_TO_NORMAL');
    });

    it('S2 + S -> S0 (Reset to Normal)', () => {
      const step = transition(STATES.S2, INPUTS.SUCCESS);
      assert.strictEqual(step.nextState, STATES.S0);
      assert.strictEqual(step.action, 'RESET_TO_NORMAL');
    });

    it('S3 + S -> S0 (Clear Alert State to Normal)', () => {
      const step = transition(STATES.S3, INPUTS.SUCCESS);
      assert.strictEqual(step.nextState, STATES.S0);
      assert.strictEqual(step.action, 'RESET_ALERT_STATE');
    });
  });

  describe('Five Academic Test Scenarios', () => {
    // Test 1: Successful Connection
    it('Test 1: Successful Connection -> Normal State detected', () => {
      const raw = '2026-11-13 10:00:01 IP=192.168.1.10 USER=admin STATUS=SUCCESS';
      const result = parseLogs(raw);

      assert.strictEqual(result.summary.validCount, 1);
      assert.strictEqual(result.summary.alertCount, 0);
      assert.strictEqual(result.validLogs[0].fsmState, STATES.S0);
      assert.strictEqual(result.validLogs[0].status, 'SUCCESS');
    });

    // Test 2: Single Failed Connection
    it('Test 2: Single Failed Connection -> State S1, no alert', () => {
      const raw = '2026-11-13 10:01:01 IP=192.168.1.20 USER=root STATUS=FAILED';
      const result = parseLogs(raw);

      assert.strictEqual(result.summary.validCount, 1);
      assert.strictEqual(result.summary.alertCount, 0);
      assert.strictEqual(result.validLogs[0].fsmState, STATES.S1);
      assert.strictEqual(result.validLogs[0].consecutiveFailures, 1);
    });

    // Test 3: Repeated Failed Connections
    it('Test 3: Repeated Failed Connections (3 consecutive) -> HIGH severity security alert', () => {
      const raw = `2026-11-13 10:01:01 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:01:10 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:01:20 IP=192.168.1.20 USER=root STATUS=FAILED`;
      const result = parseLogs(raw);

      assert.strictEqual(result.summary.validCount, 3);
      assert.strictEqual(result.summary.alertCount, 1);
      assert.strictEqual(result.validLogs[0].fsmState, STATES.S1);
      assert.strictEqual(result.validLogs[1].fsmState, STATES.S2);
      assert.strictEqual(result.validLogs[2].fsmState, STATES.S3);

      const alert = result.alerts[0];
      assert.strictEqual(alert.ipAddress, '192.168.1.20');
      assert.strictEqual(alert.severity, 'HIGH');
      assert.strictEqual(alert.alertType, 'BRUTE_FORCE_SUSPECTED');
      assert.strictEqual(alert.totalFailures, 3);
    });

    // Test 4: Successful Login Reset
    it('Test 4: Successful Login Reset (FAILED -> FAILED -> SUCCESS -> FAILED) -> Counter resets', () => {
      const raw = `2026-11-13 10:05:00 IP=192.168.1.50 USER=analyst STATUS=FAILED
2026-11-13 10:05:15 IP=192.168.1.50 USER=analyst STATUS=FAILED
2026-11-13 10:05:30 IP=192.168.1.50 USER=analyst STATUS=SUCCESS
2026-11-13 10:05:45 IP=192.168.1.50 USER=analyst STATUS=FAILED`;
      const result = parseLogs(raw);

      assert.strictEqual(result.summary.validCount, 4);
      assert.strictEqual(result.summary.alertCount, 0); // No alert because SUCCESS reset the sequence!
      assert.strictEqual(result.validLogs[0].fsmState, STATES.S1);
      assert.strictEqual(result.validLogs[1].fsmState, STATES.S2);
      assert.strictEqual(result.validLogs[2].fsmState, STATES.S0); // reset
      assert.strictEqual(result.validLogs[3].fsmState, STATES.S1); // fresh failure after reset
    });

    // Test 5: Different IP Addresses
    it('Test 5: Different IP Addresses -> Tracked independently without cross-contamination', () => {
      const raw = `2026-11-13 10:10:00 IP=192.168.1.100 USER=userA STATUS=FAILED
2026-11-13 10:10:05 IP=192.168.1.200 USER=userB STATUS=FAILED
2026-11-13 10:10:10 IP=192.168.1.100 USER=userA STATUS=FAILED`;
      const result = parseLogs(raw);

      assert.strictEqual(result.summary.validCount, 3);
      assert.strictEqual(result.summary.alertCount, 0);

      // Log 0 (IP 100): S1
      assert.strictEqual(result.validLogs[0].ipAddress, '192.168.1.100');
      assert.strictEqual(result.validLogs[0].fsmState, STATES.S1);

      // Log 1 (IP 200): S1
      assert.strictEqual(result.validLogs[1].ipAddress, '192.168.1.200');
      assert.strictEqual(result.validLogs[1].fsmState, STATES.S1);

      // Log 2 (IP 100): S2
      assert.strictEqual(result.validLogs[2].ipAddress, '192.168.1.100');
      assert.strictEqual(result.validLogs[2].fsmState, STATES.S2);

      // Verify IP summary
      assert.strictEqual(result.ipSummary['192.168.1.100'].currentState, STATES.S2);
      assert.strictEqual(result.ipSummary['192.168.1.200'].currentState, STATES.S1);
    });

    it('Prevents duplicate alerts on 4th and 5th consecutive failure in same sequence', () => {
      const raw = `2026-11-13 10:01:01 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:01:10 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:01:20 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:01:30 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:01:40 IP=192.168.1.20 USER=root STATUS=FAILED`;
      const result = parseLogs(raw);

      assert.strictEqual(result.summary.validCount, 5);
      // Exactly 1 alert generated for the sequence, not 3!
      assert.strictEqual(result.summary.alertCount, 1);
      assert.strictEqual(result.validLogs[3].fsmState, STATES.S3);
      assert.strictEqual(result.validLogs[4].fsmState, STATES.S3);
    });
  });
});
