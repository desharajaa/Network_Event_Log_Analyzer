# Network Event Log Analyzer — Simple Setup Guide

## Project purpose
This project reads network login event logs and detects repeated failed login attempts (a possible brute-force attack).

## How it covers the 3 subjects
- **Computer Networks:** reads network/login events, IP addresses, success/failure activity and identifies suspicious repeated connection attempts.
- **Formal Language & Automata Theory:** Regular Expressions parse and validate log lines. A DFA tracks each IP through S0, S1, S2 and S3; a high alert is triggered at 3 consecutive failures.
- **Full Stack Web Development:** React + Vite frontend; Node.js + Express REST API backend; MongoDB storage (the project has an in-memory fallback if MongoDB is not available).

## Features
- Dashboard: totals, successful/failed events, suspicious IPs and charts.
- Upload `.txt` / `.log` files or paste log text.
- Validate IPv4, date/time, and log format; invalid lines get explanations.
- Track consecutive failed login attempts by IP.
- High-severity alert at the third consecutive failure.
- Search/filter log analysis and alerts.
- Interactive DFA/FSM visualizer.
- Sample logs and scenarios included.
- MongoDB connection with fallback demo mode.

## Run it (Windows)
### 1. Install Node.js
Install the LTS version of Node.js. Then close and reopen PowerShell/VS Code.
Check:
```powershell
node -v
npm -v
```
Both should print version numbers.

### 2. Start backend
Open a terminal in the project folder, then:
```powershell
cd backend
npm install
npm start
```
Keep this terminal open. Backend runs on port 5000.

### 3. Start frontend
Open a **second terminal** in the project folder:
```powershell
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal (usually http://localhost:5173).

## Demo
Open Upload Logs, paste or upload `samples/sample-logs.txt`, then analyze. Use three consecutive FAILED entries from one IP to demonstrate the alert and FSM transition S0 -> S1 -> S2 -> S3.

## Sample log format
```text
2026-11-13 10:00:01 IP=192.168.1.10 USER=admin STATUS=SUCCESS
2026-11-13 10:01:01 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:01:10 IP=192.168.1.20 USER=root STATUS=FAILED
2026-11-13 10:01:20 IP=192.168.1.20 USER=root STATUS=FAILED
```

## If MongoDB is not installed
Start the app anyway: the backend is designed to use its fallback memory store for demo/evaluation. Memory-store data may reset when the server restarts.

## Viva quick explanation
- **Network log:** record of a network-related event/activity.
- **Regex:** pattern used to recognize and validate each log line.
- **DFA:** four states count consecutive failures. SUCCESS resets the IP to S0. The third consecutive failure reaches S3 and raises an alert.
- **Frontend:** user-facing dashboard built with React.
- **Backend:** API and analysis logic built with Node.js and Express.
- **Database:** MongoDB stores data when it is available.
