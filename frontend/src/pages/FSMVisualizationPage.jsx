import React, { useState } from 'react';
import {
  GitCommit,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import TopBar from '../components/TopBar';

const FSM_STATES = [
  { id: 'S0', name: 'Normal State', desc: '0 consecutive failures. Standard operation.', color: '#10b981' },
  { id: 'S1', name: 'First Failure', desc: '1 failed connection. Monitored.', color: '#f59e0b' },
  { id: 'S2', name: 'Second Failure', desc: '2 consecutive failures. High alert imminent.', color: '#f97316' },
  { id: 'S3', name: 'Security Alert', desc: '>=3 consecutive failures. Brute-force threshold breached.', color: '#ef4444' }
];

const TRANSITION_TABLE = [
  { current: 'S0', input: 'F (Failed)', next: 'S1', action: 'RECORD_FIRST_FAILURE', alert: 'No' },
  { current: 'S0', input: 'S (Success)', next: 'S0', action: 'MAINTAIN_NORMAL', alert: 'No' },
  { current: 'S1', input: 'F (Failed)', next: 'S2', action: 'RECORD_SECOND_FAILURE', alert: 'No' },
  { current: 'S1', input: 'S (Success)', next: 'S0', action: 'RESET_TO_NORMAL', alert: 'No' },
  { current: 'S2', input: 'F (Failed)', next: 'S3', action: 'TRIGGER_SECURITY_ALERT', alert: 'YES (HIGH)' },
  { current: 'S2', input: 'S (Success)', next: 'S0', action: 'RESET_TO_NORMAL', alert: 'No' },
  { current: 'S3', input: 'F (Failed)', next: 'S3', action: 'MAINTAIN_ALERT_STATE', alert: 'No (Suppressed)' },
  { current: 'S3', input: 'S (Success)', next: 'S0', action: 'RESET_ALERT_STATE', alert: 'No (Alert Cleared)' }
];

export default function FSMVisualizationPage() {
  const [currentState, setCurrentState] = useState('S0');
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [lastInput, setLastInput] = useState(null);
  const [lastTransition, setLastTransition] = useState(null);
  const [history, setHistory] = useState([]);
  const [alertActive, setAlertActive] = useState(false);

  // Apply FSM Step
  const applyInput = (inputSymbol) => {
    let next = 'S0';
    let action = '';
    let triggerAlert = false;
    let newConsecutive = consecutiveFailures;
    let newAlertActive = alertActive;

    if (inputSymbol === 'F') {
      newConsecutive += 1;
      if (currentState === 'S0') {
        next = 'S1';
        action = 'RECORD_FIRST_FAILURE';
      } else if (currentState === 'S1') {
        next = 'S2';
        action = 'RECORD_SECOND_FAILURE';
      } else if (currentState === 'S2') {
        next = 'S3';
        action = 'TRIGGER_SECURITY_ALERT';
        triggerAlert = true;
        newAlertActive = true;
      } else if (currentState === 'S3') {
        next = 'S3';
        action = 'MAINTAIN_ALERT_STATE';
      }
    } else if (inputSymbol === 'S') {
      newConsecutive = 0;
      next = 'S0';
      if (currentState === 'S3') {
        action = 'RESET_ALERT_STATE';
        newAlertActive = false;
      } else if (currentState === 'S0') {
        action = 'MAINTAIN_NORMAL';
      } else {
        action = 'RESET_TO_NORMAL';
      }
    }

    const transitionRecord = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      previousState: currentState,
      input: inputSymbol,
      nextState: next,
      action,
      consecutive: newConsecutive,
      alert: triggerAlert
    };

    setLastTransition(transitionRecord);
    setLastInput(inputSymbol);
    setCurrentState(next);
    setConsecutiveFailures(newConsecutive);
    setAlertActive(newAlertActive);
    setHistory((prev) => [transitionRecord, ...prev].slice(0, 15));
  };

  const handleReset = () => {
    setCurrentState('S0');
    setConsecutiveFailures(0);
    setLastInput(null);
    setLastTransition(null);
    setAlertActive(false);
    setHistory([]);
  };

  return (
    <div className="main-wrapper">
      <TopBar
        title="Finite State Machine (FSM) Visualizer"
        subtitle="Deterministic Automata for 3-Consecutive Failure Intrusion Detection"
      />

      <div className="page-content">
        {/* Interactive Simulator Card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Play size={18} color="#3b82f6" />
                <span>Interactive Automata Simulator</span>
              </h3>
              <p className="card-subtitle">
                Step through transitions manually by applying inputs and observe live state changes
              </p>
            </div>

            <button onClick={handleReset} className="btn btn-secondary btn-sm">
              <RotateCcw size={14} />
              <span>Reset Simulator</span>
            </button>
          </div>

          {/* Active Status Display Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              padding: '16px',
              background: '#090e1c',
              borderRadius: '8px',
              border: '1px solid #1e3a5f',
              marginBottom: '24px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Active State</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: currentState === 'S3' ? '#ef4444' : '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                {currentState}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Consecutive Failures</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                {consecutiveFailures}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Last Input</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: lastInput === 'F' ? '#ef4444' : lastInput === 'S' ? '#10b981' : '#64748b', fontFamily: 'var(--font-mono)' }}>
                {lastInput || 'None'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Alert Status</div>
              <div>
                {alertActive ? (
                  <span className="badge badge-danger">HIGH ALERT ACTIVE</span>
                ) : (
                  <span className="badge badge-success">SECURE (NORMAL)</span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Visual SVG Diagram */}
          <div className="fsm-diagram-container">
            <h4 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
              State Transition Diagram (Active Node Highlighted)
            </h4>

            <svg viewBox="0 0 900 240" style={{ width: '100%', maxWidth: '850px', height: 'auto' }}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
                </marker>
                <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                </marker>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                </marker>
              </defs>

              {/* Reset curved paths (S1, S2, S3 back to S0 on input S) */}
              <path d="M 330,90 Q 220,15 110,90" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow-green)" />
              <text x="220" y="42" fill="#10b981" fontSize="12" fontWeight="600" textAnchor="middle">S (Reset)</text>

              <path d="M 550,90 Q 330,-15 110,85" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow-green)" />
              <text x="330" y="22" fill="#10b981" fontSize="12" fontWeight="600" textAnchor="middle">S (Reset)</text>

              <path d="M 770,90 Q 440,-45 105,80" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow-green)" />
              <text x="440" y="6" fill="#10b981" fontSize="12" fontWeight="600" textAnchor="middle">S (Reset & Clear Alert)</text>

              {/* Self loop on S0 on S */}
              <path d="M 90,80 C 70,30 130,30 110,80" fill="none" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-green)" />
              <text x="100" y="32" fill="#10b981" fontSize="11" fontWeight="600" textAnchor="middle">S</text>

              {/* Forward paths: S0 -> S1 (F) */}
              <line x1="145" y1="120" x2="275" y2="120" stroke="#f59e0b" strokeWidth="3" markerEnd="url(#arrow)" />
              <text x="210" y="112" fill="#f59e0b" fontSize="13" fontWeight="700" textAnchor="middle">F (1st Failure)</text>

              {/* Forward paths: S1 -> S2 (F) */}
              <line x1="365" y1="120" x2="495" y2="120" stroke="#f97316" strokeWidth="3" markerEnd="url(#arrow)" />
              <text x="430" y="112" fill="#f97316" fontSize="13" fontWeight="700" textAnchor="middle">F (2nd Failure)</text>

              {/* Forward paths: S2 -> S3 (F) */}
              <line x1="585" y1="120" x2="715" y2="120" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-red)" />
              <text x="650" y="112" fill="#ef4444" fontSize="13" fontWeight="700" textAnchor="middle">F (3rd: ALERT!)</text>

              {/* Self loop on S3 on F (maintain) */}
              <path d="M 780,85 C 830,35 830,195 780,150" fill="none" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow-red)" />
              <text x="835" y="125" fill="#ef4444" fontSize="12" fontWeight="700">F (Maintain)</text>

              {/* Nodes S0, S1, S2, S3 */}
              {/* S0 */}
              <g transform="translate(100, 120)">
                <circle
                  r="45"
                  fill="#111c38"
                  stroke={currentState === 'S0' ? '#10b981' : '#1e3a5f'}
                  strokeWidth={currentState === 'S0' ? '5' : '3'}
                  filter={currentState === 'S0' ? 'drop-shadow(0 0 12px #10b981)' : 'none'}
                />
                <text y="-5" fill="#fff" fontSize="18" fontWeight="700" textAnchor="middle" fontFamily="monospace">S0</text>
                <text y="14" fill="#94a3b8" fontSize="10" textAnchor="middle">Normal</text>
                <text y="26" fill="#64748b" fontSize="9" textAnchor="middle">(0 fails)</text>
              </g>

              {/* S1 */}
              <g transform="translate(320, 120)">
                <circle
                  r="45"
                  fill="#111c38"
                  stroke={currentState === 'S1' ? '#f59e0b' : '#1e3a5f'}
                  strokeWidth={currentState === 'S1' ? '5' : '3'}
                  filter={currentState === 'S1' ? 'drop-shadow(0 0 12px #f59e0b)' : 'none'}
                />
                <text y="-5" fill="#fff" fontSize="18" fontWeight="700" textAnchor="middle" fontFamily="monospace">S1</text>
                <text y="14" fill="#94a3b8" fontSize="10" textAnchor="middle">1st Failure</text>
                <text y="26" fill="#64748b" fontSize="9" textAnchor="middle">(1 fail)</text>
              </g>

              {/* S2 */}
              <g transform="translate(540, 120)">
                <circle
                  r="45"
                  fill="#111c38"
                  stroke={currentState === 'S2' ? '#f97316' : '#1e3a5f'}
                  strokeWidth={currentState === 'S2' ? '5' : '3'}
                  filter={currentState === 'S2' ? 'drop-shadow(0 0 12px #f97316)' : 'none'}
                />
                <text y="-5" fill="#fff" fontSize="18" fontWeight="700" textAnchor="middle" fontFamily="monospace">S2</text>
                <text y="14" fill="#94a3b8" fontSize="10" textAnchor="middle">2nd Failure</text>
                <text y="26" fill="#64748b" fontSize="9" textAnchor="middle">(2 fails)</text>
              </g>

              {/* S3 Double Circle for Accepting/Alert State */}
              <g transform="translate(760, 120)">
                <circle
                  r="45"
                  fill="#111c38"
                  stroke={currentState === 'S3' ? '#ef4444' : '#7f1d1d'}
                  strokeWidth={currentState === 'S3' ? '5' : '3'}
                  filter={currentState === 'S3' ? 'drop-shadow(0 0 16px #ef4444)' : 'none'}
                />
                {/* Inner accepting ring */}
                <circle
                  r="38"
                  fill="none"
                  stroke={currentState === 'S3' ? '#ef4444' : '#7f1d1d'}
                  strokeWidth="2"
                />
                <text y="-5" fill="#fff" fontSize="18" fontWeight="700" textAnchor="middle" fontFamily="monospace">S3</text>
                <text y="14" fill="#fca5a5" fontSize="10" fontWeight="600" textAnchor="middle">ALERT</text>
                <text y="26" fill="#ef4444" fontSize="9" textAnchor="middle">(&gt;= 3 fails)</text>
              </g>
            </svg>
          </div>

          {/* Interactive Controller Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => applyInput('F')}
              className="btn btn-danger"
              style={{ minWidth: '180px', padding: '12px 24px', fontSize: '15px' }}
            >
              <XCircle size={18} />
              <span>Input: Failed (F)</span>
            </button>

            <button
              onClick={() => applyInput('S')}
              className="btn btn-primary"
              style={{ minWidth: '180px', padding: '12px 24px', fontSize: '15px', background: '#059669' }}
            >
              <CheckCircle2 size={18} />
              <span>Input: Success (S)</span>
            </button>
          </div>
        </div>

        {/* Transition History & Automata Theory Row */}
        <div className="dashboard-grid-2">
          {/* Transition History Table */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <History size={18} color="#60a5fa" />
                  <span>Simulator Transition Log</span>
                </h3>
                <p className="card-subtitle">Chronological sequence of simulated inputs and state changes</p>
              </div>
            </div>

            {history.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>
                Click "Input: Failed (F)" or "Input: Success (S)" above to record transitions.
              </p>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Transition</th>
                      <th>Input</th>
                      <th>Action</th>
                      <th>Alert?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id}>
                        <td className="mono-cell" style={{ fontSize: '11px' }}>{item.timestamp}</td>
                        <td className="mono-cell">
                          <span style={{ color: '#94a3b8' }}>{item.previousState}</span>
                          <span style={{ margin: '0 6px', color: '#60a5fa' }}>&rarr;</span>
                          <span style={{ fontWeight: 700, color: item.nextState === 'S3' ? '#ef4444' : '#fff' }}>
                            {item.nextState}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${item.input === 'F' ? 'badge-danger' : 'badge-success'}`}>
                            {item.input}
                          </span>
                        </td>
                        <td style={{ fontSize: '11px', color: '#cbd5e1' }}>{item.action}</td>
                        <td>
                          {item.alert ? (
                            <span className="badge badge-danger">HIGH</span>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '11px' }}>None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Formal Automata Theory Specification */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <Info size={18} color="#06b6d4" />
                  <span>Formal Automata Specification</span>
                </h3>
                <p className="card-subtitle">Deterministic Finite Automaton (DFA) 5-Tuple Definition</p>
              </div>
            </div>

            <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#e2e8f0' }}>
              <p style={{ marginBottom: '10px' }}>
                The intrusion detection logic is formulated as a 5-tuple:
              </p>
              <div
                style={{
                  background: '#090e1c',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: '1px solid #1e3a5f',
                  fontFamily: 'monospace',
                  color: '#60a5fa',
                  marginBottom: '14px'
                }}
              >
                M = (Q, &Sigma;, &delta;, q0, F)
              </div>

              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>Q (States):</strong> <code>{'{ S0, S1, S2, S3 }'}</code>
                  <br />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    S0: Normal, S1: 1 failure, S2: 2 failures, S3: Security Alert (Brute-Force suspected).
                  </span>
                </li>
                <li>
                  <strong>&Sigma; (Alphabet):</strong> <code>{'{ F (Failed), S (Success) }'}</code>
                </li>
                <li>
                  <strong>&delta; (Transition Function):</strong> <code>Q &times; &Sigma; &rarr; Q</code>
                </li>
                <li>
                  <strong>q0 (Initial State):</strong> <code>S0</code>
                </li>
                <li>
                  <strong>F (Accepting / Alert States):</strong> <code>{'{ S3 }'}</code>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* State Transition Table Card */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <GitCommit size={18} color="#10b981" />
                <span>Deterministic State Transition Table</span>
              </h3>
              <p className="card-subtitle">
                Complete mapping of (Current State, Input) &rarr; Next State, Action, and Alert generation
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Current State</th>
                  <th>Input Received</th>
                  <th>Next State</th>
                  <th>Internal Action</th>
                  <th>Alert Triggered</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {TRANSITION_TABLE.map((row, idx) => (
                  <tr key={idx}>
                    <td className="mono-cell" style={{ fontWeight: 600 }}>{row.current}</td>
                    <td>
                      <span className={`badge ${row.input.startsWith('F') ? 'badge-danger' : 'badge-success'}`}>
                        {row.input}
                      </span>
                    </td>
                    <td className="mono-cell" style={{ fontWeight: 700, color: row.next === 'S3' ? '#ef4444' : '#fff' }}>
                      {row.next}
                    </td>
                    <td className="mono-cell" style={{ fontSize: '12px', color: '#93c5fd' }}>
                      {row.action}
                    </td>
                    <td>
                      <span className={`badge ${row.alert.includes('YES') ? 'badge-danger' : 'badge-info'}`}>
                        {row.alert}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#cbd5e1' }}>
                      {row.next === 'S3' && row.input.startsWith('F')
                        ? '3rd failure generates HIGH security alert'
                        : row.next === 'S0' && row.input.startsWith('S')
                        ? 'Successful authentication resets consecutive failure counter to 0'
                        : row.next === 'S3' && row.action === 'MAINTAIN_ALERT_STATE'
                        ? 'Continued failure in alert state avoids spamming duplicate alerts'
                        : 'Standard incremental failure escalation'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
