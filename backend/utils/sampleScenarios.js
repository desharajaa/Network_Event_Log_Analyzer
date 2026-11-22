/**
 * Sample Log Scenarios for Demonstration and Testing
 * Academic Project: Network Event Log Analyzer
 */

const DEFAULT_SAMPLE_LOGS = `2026-11-13 10:00:01 IP=192.168.1.10 USER=admin STATUS=SUCCESS
2026-11-13 10:01:01 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:01:10 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:01:20 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:02:00 IP=192.168.1.30 USER=user STATUS=SUCCESS`;

const TEST_SCENARIOS = [
  {
    id: 1,
    title: 'Test 1: Successful Connection',
    description: 'A single valid SUCCESS log. Evaluates normal state S0 transition.',
    expected: 'Successful connection detected. State remains S0. No security alert.',
    logs: '2026-11-13 10:00:01 IP=192.168.1.10 USER=admin STATUS=SUCCESS'
  },
  {
    id: 2,
    title: 'Test 2: Single Failed Connection',
    description: 'A single FAILED connection attempt. State moves from S0 to S1.',
    expected: 'Failed connection detected. State transitions to S1. No security alert generated.',
    logs: '2026-11-13 10:01:01 IP=192.168.1.20 USER=root STATUS=FAILED'
  },
  {
    id: 3,
    title: 'Test 3: Repeated Failed Connections (Brute-Force Alert)',
    description: 'Three consecutive FAILED connection attempts from the same IP (192.168.1.20). Transitions S0 -> S1 -> S2 -> S3.',
    expected: 'HIGH severity security alert generated upon the 3rd failure. State transitions to S3 (Alert State).',
    logs: `2026-11-13 10:01:01 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:01:10 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:01:20 IP=192.168.1.20 USER=root STATUS=FAILED`
  },
  {
    id: 4,
    title: 'Test 4: Successful Login Reset Sequence',
    description: 'Sequence: FAILED -> FAILED -> SUCCESS -> FAILED. Verifies that SUCCESS resets failure counter back to S0.',
    expected: 'Failure counter resets to S0 after SUCCESS. The subsequent failure starts fresh at S1. No repeated failure alert.',
    logs: `2026-11-13 10:05:00 IP=192.168.1.50 USER=analyst STATUS=FAILED
2026-11-13 10:05:15 IP=192.168.1.50 USER=analyst STATUS=FAILED
2026-11-13 10:05:30 IP=192.168.1.50 USER=analyst STATUS=SUCCESS
2026-11-13 10:05:45 IP=192.168.1.50 USER=analyst STATUS=FAILED`
  },
  {
    id: 5,
    title: 'Test 5: Multiple Independent IP Addresses',
    description: 'Two failures from IP 192.168.1.100 and one failure from IP 192.168.1.200. Verifies independent per-IP tracking.',
    expected: 'Each IP is tracked independently. IP 192.168.1.100 is at S2; IP 192.168.1.200 is at S1. No combined count and no false alert.',
    logs: `2026-11-13 10:10:00 IP=192.168.1.100 USER=userA STATUS=FAILED
2026-11-13 10:10:05 IP=192.168.1.200 USER=userB STATUS=FAILED
2026-11-13 10:10:10 IP=192.168.1.100 USER=userA STATUS=FAILED`
  },
  {
    id: 6,
    title: 'Test 6: Invalid & Malformed Log Entries',
    description: 'Tests regex and semantic validations (invalid octets 999, invalid month 13, missing IP tag, bad status).',
    expected: 'Malformed entries are rejected and displayed with clear, meaningful error diagnostics.',
    logs: `2026-11-13 10:00:01 IP=192.168.1.10 USER=admin STATUS=SUCCESS
2026-11-13 10:01:00 IP=999.168.1.1 USER=hacker STATUS=FAILED
2026-13-45 10:02:00 IP=10.0.0.1 USER=test STATUS=SUCCESS
2026-11-13 10:03:00 192.168.1.5 USER=guest STATUS=UNKNOWN`
  }
];

module.exports = {
  DEFAULT_SAMPLE_LOGS,
  TEST_SCENARIOS
};
