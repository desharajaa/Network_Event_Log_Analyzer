/**
 * Finite State Machine (FSM) Implementation for Network Event Log Analysis
 * Academic Project: Network Event Log Analyzer
 * 
 * Formal Definition:
 * M = (Q, Sigma, delta, q0, F_states)
 * Q (States): { S0, S1, S2, S3 }
 * Sigma (Alphabet/Inputs): { F (Failed), S (Success) }
 * q0 (Initial State): S0
 * F_states (Alert States): { S3 }
 */

const STATES = {
  S0: 'S0', // Normal State (0 consecutive failures)
  S1: 'S1', // First Failure Detected (1 consecutive failure)
  S2: 'S2', // Second Failure Detected (2 consecutive failures)
  S3: 'S3'  // Security Alert State (3 or more consecutive failures)
};

const INPUTS = {
  F: 'F',
  S: 'S',
  FAILED: 'F',
  SUCCESS: 'S'
};

const STATE_METADATA = {
  S0: {
    name: 'Normal State',
    description: 'System functioning normally. 0 consecutive failed attempts.',
    badgeClass: 'badge-success',
    color: '#10b981'
  },
  S1: {
    name: 'First Failure Detected',
    description: '1 failed connection recorded. Monitored for potential escalation.',
    badgeClass: 'badge-warning',
    color: '#f59e0b'
  },
  S2: {
    name: 'Second Failure Detected',
    description: '2 consecutive failed connections. Suspicious threshold imminent.',
    badgeClass: 'badge-orange',
    color: '#f97316'
  },
  S3: {
    name: 'Security Alert State',
    description: 'Threshold met: 3 or more consecutive failures. High security alert raised.',
    badgeClass: 'badge-danger',
    color: '#ef4444'
  }
};

/**
 * Deterministic Transition Table
 * Format: [CurrentState][Input] => { nextState, action, triggerAlert, resultDescription }
 */
const TRANSITION_TABLE = {
  [STATES.S0]: {
    [INPUTS.F]: {
      nextState: STATES.S1,
      action: 'RECORD_FIRST_FAILURE',
      triggerAlert: false,
      resultDescription: 'First failed connection attempt detected (State: S1).'
    },
    [INPUTS.S]: {
      nextState: STATES.S0,
      action: 'MAINTAIN_NORMAL',
      triggerAlert: false,
      resultDescription: 'Successful network connection. State remains S0 (Normal).'
    }
  },
  [STATES.S1]: {
    [INPUTS.F]: {
      nextState: STATES.S2,
      action: 'RECORD_SECOND_FAILURE',
      triggerAlert: false,
      resultDescription: 'Second consecutive failed connection attempt detected (State: S2).'
    },
    [INPUTS.S]: {
      nextState: STATES.S0,
      action: 'RESET_TO_NORMAL',
      triggerAlert: false,
      resultDescription: 'Successful connection. Consecutive failure counter reset to S0.'
    }
  },
  [STATES.S2]: {
    [INPUTS.F]: {
      nextState: STATES.S3,
      action: 'TRIGGER_SECURITY_ALERT',
      triggerAlert: true,
      resultDescription: 'SECURITY ALERT: 3 consecutive failed attempts from IP (State: S3, Severity: HIGH).'
    },
    [INPUTS.S]: {
      nextState: STATES.S0,
      action: 'RESET_TO_NORMAL',
      triggerAlert: false,
      resultDescription: 'Successful connection. Consecutive failure counter reset to S0.'
    }
  },
  [STATES.S3]: {
    [INPUTS.F]: {
      nextState: STATES.S3,
      action: 'MAINTAIN_ALERT_STATE',
      triggerAlert: false, // Prevents duplicate alerts for the same active sequence
      resultDescription: 'Repeated failure while in Alert State S3. Sequence continued (No duplicate alert).'
    },
    [INPUTS.S]: {
      nextState: STATES.S0,
      action: 'RESET_ALERT_STATE',
      triggerAlert: false,
      resultDescription: 'Successful connection. Security alert state cleared; reset to S0.'
    }
  }
};

/**
 * Step function: evaluates a single FSM transition.
 * @param {string} currentState S0, S1, S2, or S3
 * @param {string} input 'F' or 'S'
 * @returns {{ nextState: string, action: string, triggerAlert: boolean, resultDescription: string }}
 */
function transition(currentState, input) {
  const state = currentState || STATES.S0;
  const inputCode = input === 'FAILED' ? INPUTS.F : input === 'SUCCESS' ? INPUTS.S : input;

  if (!TRANSITION_TABLE[state]) {
    throw new Error(`Invalid FSM State: ${state}`);
  }
  if (!TRANSITION_TABLE[state][inputCode]) {
    throw new Error(`Invalid FSM Input: ${inputCode} for state: ${state}`);
  }

  return {
    previousState: state,
    input: inputCode,
    ...TRANSITION_TABLE[state][inputCode]
  };
}

/**
 * Stateful IP Tracker class for processing sequences of logs.
 */
class NetworkFSMTracker {
  constructor(initialStates = {}) {
    // Map of ipAddress => { currentState, consecutiveFailures, totalAlerts, activeAlertSequence }
    this.ipStates = new Map();

    for (const [ip, info] of Object.entries(initialStates)) {
      this.ipStates.set(ip, {
        currentState: info.currentState || STATES.S0,
        consecutiveFailures: info.consecutiveFailures || 0,
        activeAlertRaised: info.activeAlertRaised || false
      });
    }
  }

  getIpState(ipAddress) {
    if (!this.ipStates.has(ipAddress)) {
      this.ipStates.set(ipAddress, {
        currentState: STATES.S0,
        consecutiveFailures: 0,
        activeAlertRaised: false
      });
    }
    return this.ipStates.get(ipAddress);
  }

  /**
   * Process a single parsed log event.
   * @param {object} log { ipAddress, status, timestamp, username, ... }
   * @returns {object} { ...log, previousState, fsmState, input, analysisResult, alert: null|object }
   */
  processLog(log) {
    const ip = log.ipAddress;
    const currentInfo = this.getIpState(ip);
    const inputCode = log.status === 'FAILED' ? INPUTS.F : INPUTS.S;

    const trans = transition(currentInfo.currentState, inputCode);
    const previousState = currentInfo.currentState;
    const nextState = trans.nextState;

    let alertGenerated = null;

    if (inputCode === INPUTS.F) {
      currentInfo.consecutiveFailures += 1;

      // Trigger alert on transition S2 -> S3 (3rd consecutive failure)
      if (trans.triggerAlert && !currentInfo.activeAlertRaised) {
        currentInfo.activeAlertRaised = true;
        alertGenerated = {
          ipAddress: ip,
          totalFailures: currentInfo.consecutiveFailures,
          alertType: 'BRUTE_FORCE_SUSPECTED',
          severity: 'HIGH',
          message: `Suspicious activity: 3 consecutive failed login attempts detected from IP ${ip} (Target User: ${log.username}).`,
          timestamp: log.timestamp || new Date()
        };
      }
    } else if (inputCode === INPUTS.S) {
      // Successful connection resets consecutive failure count and alert sequence
      currentInfo.consecutiveFailures = 0;
      currentInfo.activeAlertRaised = false;
    }

    currentInfo.currentState = nextState;

    return {
      ...log,
      previousState,
      fsmState: nextState,
      input: inputCode,
      action: trans.action,
      analysisResult: trans.resultDescription,
      consecutiveFailures: currentInfo.consecutiveFailures,
      alert: alertGenerated
    };
  }

  /**
   * Processes a list of logs in chronological order.
   * @param {Array<object>} logs
   * @returns {{ processedLogs: Array<object>, alerts: Array<object>, ipSummary: object }}
   */
  processBatch(logs) {
    // Ensure chronological order
    const sorted = [...logs].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      if (timeA === timeB) {
        return (a.lineNumber || 0) - (b.lineNumber || 0);
      }
      return timeA - timeB;
    });

    const processedLogs = [];
    const alerts = [];

    for (const log of sorted) {
      const result = this.processLog(log);
      processedLogs.push(result);
      if (result.alert) {
        alerts.push(result.alert);
      }
    }

    const ipSummary = {};
    for (const [ip, data] of this.ipStates.entries()) {
      ipSummary[ip] = { ...data };
    }

    return {
      processedLogs,
      alerts,
      ipSummary
    };
  }
}

module.exports = {
  STATES,
  INPUTS,
  STATE_METADATA,
  TRANSITION_TABLE,
  transition,
  NetworkFSMTracker
};
