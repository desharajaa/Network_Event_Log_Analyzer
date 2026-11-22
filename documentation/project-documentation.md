# Project Documentation: Network Event Log Analyzer

## Academic Full-Stack Engineering & Automata Theory Project

---

## 1. Executive Summary & Objectives
Network Event Log Analyzer is a full-stack cybersecurity application designed to ingest, validate, classify, and analyze network event logs. It combines techniques from **Full Stack Web Development (MERN)**, **Computer Networks**, **Formal Language Regular Expressions**, and **Automata Theory (Finite State Machines)**.

### Core Capabilities:
1. **Field Extraction & Lexical Analysis**: Uses regular expressions to parse timestamps, IPv4 addresses, user IDs, and connection status.
2. **Semantic Range Validation**: Validates IPv4 octets ($0 \le \text{octet} \le 255$) without illegal leading zeros, and validates calendar dates (including leap years) and clock times ($0 \le H \le 23, 0 \le M, S \le 59$).
3. **Deterministic Finite State Machine (DFA)**: Tracks individual IP failure histories in chronological order to identify brute-force attacks ($\ge 3$ consecutive failures).
4. **Intrusion Alerting**: Raises high-severity security alerts upon reaching state $S_3$ while preventing duplicate alerts for persistent sequences.
5. **Interactive Dashboard**: Modern dark navy/blue cybersecurity UI featuring Chart.js visualizations, searchable logs table, filter controls, alert manager, and an interactive FSM state-machine simulator.

---

## 2. Architecture & Technology Stack

```
+-----------------------------------------------------------+
|                      React.js Frontend                    |
|   - Chart.js / react-chartjs-2 Visualizations             |
|   - Interactive FSM State Simulator & SVG Diagram         |
|   - Search, Filter, Sort & Pagination Components          |
|   - Drag-and-drop file ingestion + sample presets         |
+-----------------------------------------------------------+
                             |
                      REST API (JSON)
                             |
                             v
+-----------------------------------------------------------+
|                     Express.js Backend                    |
|   - Multer Ingestion Middleware (2MB limit, .txt / .log)  |
|   - Regex & Semantic Parser (regex.js)                    |
|   - Deterministic FSM Tracker (stateMachine.js)           |
|   - Controllers: logs, dashboard stats, alerts, samples   |
+-----------------------------------------------------------+
                             |
                             +-------------------+
                             |                   |
                             v                   v
                    +----------------+  +------------------+
                    | MongoDB Driver |  | In-Memory Engine |
                    | (Mongoose ORM) |  | (Demo Fallback)  |
                    +----------------+  +------------------+
```

### Components:
- **Frontend**: React.js 18, Vite 5, Axios, React Router 6, Chart.js, Lucide Icons, CSS3.
- **Backend**: Node.js 20, Express.js 4, Mongoose 8, Multer, Dotenv, Cors.
- **Database**: MongoDB (with Mongoose schema models and automatic in-memory fallback for environments without MongoDB installed).
- **Automated Tests**: Node.js native test runner (`node --test`).

---

## 3. Log Format Specification

The expected log format is:

```text
YYYY-MM-DD HH:MM:SS IP=IPv4 USER=username STATUS=SUCCESS/FAILED
```

### Regular Expression:
```javascript
/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+IP=([^\s]+)\s+USER=([^\s]+)\s+STATUS=(SUCCESS|FAILED)$/
```

### Semantic Validations:
- **IPv4**: Four dot-separated numerical octets. Each octet $\in [0, 255]$. Leading zeros disallowed (e.g. `192.168.01.1` rejected).
- **Date**: YYYY-MM-DD where Month $\in [1, 12]$, Days $\in [1, \text{DaysInMonth}(\text{year})]$. Properly validates February 29th for leap years.
- **Time**: HH:MM:SS where $0 \le \text{HH} \le 23, 0 \le \text{MM} \le 59, 0 \le \text{SS} \le 59$.
- **Status**: Must be strictly `SUCCESS` or `FAILED`.

---

## 4. Five Academic Test Scenarios

### Test Scenario 1: Successful Connection
- **Input**: `2026-11-13 10:00:01 IP=192.168.1.10 USER=admin STATUS=SUCCESS`
- **Automata Flow**: $S_0 + S \to S_0$ (`MAINTAIN_NORMAL`).
- **Result**: Success handshake recorded. IP remains in trusted normal state $S_0$. No alert.

### Test Scenario 2: Single Failed Connection
- **Input**: `2026-11-13 10:01:01 IP=192.168.1.20 USER=root STATUS=FAILED`
- **Automata Flow**: $S_0 + F \to S_1$ (`RECORD_FIRST_FAILURE`).
- **Result**: Failure count = 1. State advances to $S_1$. No security alert.

### Test Scenario 3: Repeated Failed Connections (Brute-Force)
- **Input**:
  ```text
  2026-11-13 10:01:01 IP=192.168.1.20 USER=root STATUS=FAILED
  2026-11-13 10:01:10 IP=192.168.1.20 USER=root STATUS=FAILED
  2026-11-13 10:01:20 IP=192.168.1.20 USER=root STATUS=FAILED
  ```
- **Automata Flow**: $S_0 \xrightarrow{F} S_1 \xrightarrow{F} S_2 \xrightarrow{F} S_3$.
- **Result**: Exactly at 3rd failure, transition $S_2 + F \to S_3$ executes `TRIGGER_SECURITY_ALERT`. A **HIGH** severity incident is registered.

### Test Scenario 4: Successful Login Reset
- **Input**:
  ```text
  2026-11-13 10:05:00 IP=192.168.1.50 USER=analyst STATUS=FAILED
  2026-11-13 10:05:15 IP=192.168.1.50 USER=analyst STATUS=FAILED
  2026-11-13 10:05:30 IP=192.168.1.50 USER=analyst STATUS=SUCCESS
  2026-11-13 10:05:45 IP=192.168.1.50 USER=analyst STATUS=FAILED
  ```
- **Automata Flow**: $S_0 \xrightarrow{F} S_1 \xrightarrow{F} S_2 \xrightarrow{S} S_0 \xrightarrow{F} S_1$.
- **Result**: The `SUCCESS` event at line 3 executes `RESET_TO_NORMAL`, clearing the consecutive failure count back to 0. Line 4 starts a fresh sequence at $S_1$. No false alarm is triggered.

### Test Scenario 5: Multiple Independent IP Addresses
- **Input**:
  ```text
  2026-11-13 10:10:00 IP=192.168.1.100 USER=userA STATUS=FAILED
  2026-11-13 10:10:05 IP=192.168.1.200 USER=userB STATUS=FAILED
  2026-11-13 10:10:10 IP=192.168.1.100 USER=userA STATUS=FAILED
  ```
- **Automata Flow**:
  - For `192.168.1.100`: $S_0 \xrightarrow{F} S_1 \xrightarrow{F} S_2$.
  - For `192.168.1.200`: $S_0 \xrightarrow{F} S_1$.
- **Result**: Each IP state is maintained in an independent mapping. No cross-contamination of counts occurs.
