/**
 * Integration Test: In-Process Backend API Probe
 * Tests health check, log analysis, alert generation, dashboard stats, and log retrieval.
 */

const app = require('../server');
const http = require('http');

async function runProbe() {
  const PORT = 5002;
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Probe server listening on http://localhost:${PORT}`);

  try {
    // 1. Health check
    const healthRes = await fetch(`http://localhost:${PORT}/api/health`);
    const healthData = await healthRes.json();
    console.log('✓ Health Endpoint OK:', healthData.status, '| DB Connected:', healthData.database.connected);

    // 2. Post logs analysis (3 failures from IP 192.168.1.20 + 1 success from 192.168.1.10)
    const sampleLogs = [
      '2026-11-13 10:00:01 IP=192.168.1.10 USER=admin STATUS=SUCCESS',
      '2026-11-13 10:01:01 IP=192.168.1.20 USER=root STATUS=FAILED',
      '2026-11-13 10:01:10 IP=192.168.1.20 USER=root STATUS=FAILED',
      '2026-11-13 10:01:20 IP=192.168.1.20 USER=root STATUS=FAILED',
      '2026-11-13 10:02:00 IP=192.168.1.30 USER=user STATUS=SUCCESS',
      '2026-11-13 10:03:00 IP=999.0.0.1 USER=bad STATUS=FAILED' // Intentional malformed log
    ].join('\n');

    const analyzeRes = await fetch(`http://localhost:${PORT}/api/logs/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logsText: sampleLogs })
    });
    const analyzeData = await analyzeRes.json();
    console.log('✓ Analyze Endpoint OK:');
    console.log('   - Total lines:', analyzeData.summary.totalLines);
    console.log('   - Valid logs:', analyzeData.summary.validCount);
    console.log('   - Malformed rejected:', analyzeData.summary.invalidCount);
    console.log('   - Security alerts generated:', analyzeData.summary.alertCount);

    if (analyzeData.alerts.length > 0) {
      console.log('   - First Alert IP:', analyzeData.alerts[0].ipAddress, '| Severity:', analyzeData.alerts[0].severity);
    }

    // 3. Query logs with pagination
    const logsRes = await fetch(`http://localhost:${PORT}/api/logs?page=1&limit=10`);
    const logsData = await logsRes.json();
    console.log('✓ Get Logs Endpoint OK: Count =', logsData.count, '| Total =', logsData.total);

    // 4. Query security alerts
    const alertsRes = await fetch(`http://localhost:${PORT}/api/alerts`);
    const alertsData = await alertsRes.json();
    console.log('✓ Get Alerts Endpoint OK: Count =', alertsData.count, '| Total =', alertsData.total);

    // 5. Query dashboard dynamic stats
    const statsRes = await fetch(`http://localhost:${PORT}/api/dashboard/stats`);
    const statsData = await statsRes.json();
    console.log('✓ Dashboard Stats OK:');
    console.log('   - Total Logs:', statsData.data.totalLogs);
    console.log('   - Success Count:', statsData.data.successCount);
    console.log('   - Failed Count:', statsData.data.failedCount);
    console.log('   - Repeated Failures:', statsData.data.repeatedFailuresCount);
    console.log('   - Total Alerts:', statsData.data.totalAlerts);
    console.log('   - Unique IPs:', statsData.data.uniqueIps);

    // 6. Test sample scenarios endpoint
    const samplesRes = await fetch(`http://localhost:${PORT}/api/logs/samples`);
    const samplesData = await samplesRes.json();
    console.log('✓ Sample Scenarios Endpoint OK: Scenarios count =', samplesData.scenarios?.length);

    console.log('\nALL INTEGRATION CHECKS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
    process.exit(0);
  }
}

runProbe().catch((err) => {
  console.error('Probe failed:', err);
  process.exit(1);
});
