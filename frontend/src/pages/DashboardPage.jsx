import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ShieldAlert,
  Server,
  ArrowRight,
  TrendingUp,
  Clock,
  Shield,
  ShieldCheck
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../services/api';
import TopBar from '../components/TopBar';
import DatabaseBanner from '../components/DatabaseBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function DashboardPage({ refreshTrigger, triggerRefresh }) {
  const [stats, setStats] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardStats();
      if (res.success) {
        setStats(res.data);
        setDbStatus(res.dbStatus);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all stored network logs and security alerts?')) {
      try {
        await api.clearLogs();
        triggerRefresh();
      } catch (err) {
        alert('Failed to clear logs: ' + err.message);
      }
    }
  };

  if (loading && !stats) {
    return (
      <div className="main-wrapper">
        <TopBar title="Security Operations Center" subtitle="Network Event Monitoring & Log Telemetry" />
        <div className="page-content">
          <LoadingSpinner message="Aggregating network statistics from database..." />
        </div>
      </div>
    );
  }

  // Chart configuration: Success vs Failure
  const successCount = stats?.successCount || 0;
  const failedCount = stats?.failedCount || 0;
  const totalLogs = stats?.totalLogs || 0;

  const doughnutData = {
    labels: ['Successful Connections', 'Failed Attempts'],
    datasets: [
      {
        data: totalLogs > 0 ? [successCount, failedCount] : [1, 0],
        backgroundColor: totalLogs > 0 ? ['#10b981', '#ef4444'] : ['#334155', '#1e293b'],
        borderColor: '#111c38',
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 },
          boxWidth: 14,
          padding: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (totalLogs === 0) return ' No data available';
            const value = context.raw || 0;
            const pct = ((value / totalLogs) * 100).toFixed(1);
            return ` ${context.label}: ${value} (${pct}%)`;
          }
        }
      }
    },
    cutout: '72%'
  };

  // Chart configuration: FSM State Distribution
  const fsmCounts = stats?.fsmCounts || { S0: 0, S1: 0, S2: 0, S3: 0 };
  const barData = {
    labels: ['S0: Normal', 'S1: 1 Failure', 'S2: 2 Failures', 'S3: Alert State'],
    datasets: [
      {
        label: 'Log Count',
        data: [fsmCounts.S0, fsmCounts.S1, fsmCounts.S2, fsmCounts.S3],
        backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
        borderRadius: 6
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.label || ''
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 }
      }
    }
  };

  return (
    <div className="main-wrapper">
      <TopBar
        title="Security Operations Center (SOC)"
        subtitle="Network Event Log Telemetry, FSM State Automata & Intrusion Detection"
        onRefresh={fetchStats}
        onClear={totalLogs > 0 ? handleClear : null}
        dbStatus={dbStatus}
      />

      <div className="page-content">
        <DatabaseBanner dbStatus={dbStatus} />

        {error && (
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              marginBottom: '24px',
              fontSize: '13px'
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* 1. Metric Cards Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div>
              <div className="metric-label">Total Network Logs</div>
              <div className="metric-value">{stats?.totalLogs?.toLocaleString() || 0}</div>
              <div className="metric-sub">Across {stats?.uniqueIps || 0} distinct IPs</div>
            </div>
            <div className="metric-icon-wrap blue">
              <Activity size={24} />
            </div>
          </div>

          <div className="metric-card">
            <div>
              <div className="metric-label">Successful Connections</div>
              <div className="metric-value">{stats?.successCount?.toLocaleString() || 0}</div>
              <div className="metric-sub">{stats?.successRate || 0}% overall success rate</div>
            </div>
            <div className="metric-icon-wrap green">
              <CheckCircle2 size={24} />
            </div>
          </div>

          <div className="metric-card">
            <div>
              <div className="metric-label">Failed Connections</div>
              <div className="metric-value">{stats?.failedCount?.toLocaleString() || 0}</div>
              <div className="metric-sub">Monitored for anomaly escalation</div>
            </div>
            <div className="metric-icon-wrap red">
              <XCircle size={24} />
            </div>
          </div>

          <div className="metric-card">
            <div>
              <div className="metric-label">Repeated Failures (S2 / S3)</div>
              <div className="metric-value">{stats?.repeatedFailuresCount?.toLocaleString() || 0}</div>
              <div className="metric-sub">Persistent consecutive failed inputs</div>
            </div>
            <div className="metric-icon-wrap orange">
              <AlertOctagon size={24} />
            </div>
          </div>

          <div className="metric-card">
            <div>
              <div className="metric-label">Security Alerts (HIGH)</div>
              <div className="metric-value" style={{ color: stats?.totalAlerts > 0 ? '#ef4444' : '#fff' }}>
                {stats?.totalAlerts?.toLocaleString() || 0}
              </div>
              <div className="metric-sub">3+ consecutive failures trigger</div>
            </div>
            <div className="metric-icon-wrap red">
              <ShieldAlert size={24} />
            </div>
          </div>
        </div>

        {/* 2. Charts Row */}
        <div className="dashboard-grid-2">
          {/* Success vs Failure Doughnut */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <TrendingUp size={18} color="#3b82f6" />
                  <span>Connection Success vs Failure</span>
                </h3>
                <p className="card-subtitle">Real-time ratio of valid network handshakes vs failures</p>
              </div>
            </div>
            <div style={{ height: '240px', position: 'relative' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
              {totalLogs === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -60%)',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '12px'
                  }}
                >
                  No Logs Yet
                </div>
              )}
            </div>
          </div>

          {/* FSM State Distribution Bar */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <Activity size={18} color="#06b6d4" />
                  <span>Automata State Distribution</span>
                </h3>
                <p className="card-subtitle">Active classification across S0, S1, S2, and S3 states</p>
              </div>
              <Link to="/fsm" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                <span>View FSM</span>
                <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ height: '240px' }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        {/* 3. Suspicious IPs & Latest Alerts */}
        <div className="dashboard-grid-2">
          {/* Suspicious IP Addresses */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <Server size={18} color="#f97316" />
                  <span>Suspicious IP Addresses</span>
                </h3>
                <p className="card-subtitle">IPs exhibiting repeated failed attempts or alert states</p>
              </div>
            </div>

            {(!stats?.suspiciousIps || stats.suspiciousIps.length === 0) ? (
              <EmptyState
                icon={Shield}
                title="No Suspicious IPs"
                description="All client IP addresses are currently within normal operating parameters."
              />
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>IP Address</th>
                      <th>Failures</th>
                      <th>FSM State</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.suspiciousIps.map((ipObj, idx) => (
                      <tr key={idx}>
                        <td className="mono-cell">{ipObj.ipAddress}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#f87171' }}>
                            {ipObj.failedAttempts} attempts
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              ipObj.currentState === 'S3'
                                ? 'badge-danger'
                                : ipObj.currentState === 'S2'
                                ? 'badge-orange'
                                : 'badge-warning'
                            }`}
                          >
                            {ipObj.currentState}
                          </span>
                        </td>
                        <td>
                          {ipObj.hasAlert ? (
                            <span className="badge badge-danger">ALERT GENERATED</span>
                          ) : (
                            <span className="badge badge-warning">MONITORED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Latest Security Alerts */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <ShieldAlert size={18} color="#ef4444" />
                  <span>Latest Security Alerts</span>
                </h3>
                <p className="card-subtitle">Automata-triggered threshold breaches (HIGH severity)</p>
              </div>
              <Link to="/alerts" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                <span>All Alerts</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {(!stats?.latestAlerts || stats.latestAlerts.length === 0) ? (
              <EmptyState
                icon={ShieldCheck}
                title="Zero Security Alerts"
                description="No brute-force or repeated failure thresholds breached."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.latestAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="mono-cell" style={{ color: '#fff', fontWeight: 600 }}>
                        {alert.ipAddress}
                      </span>
                      <span className="badge badge-danger">{alert.severity} SEVERITY</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#fca5a5' }}>{alert.message}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                      <Clock size={12} />
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Recent Network Activities Table */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Clock size={18} color="#60a5fa" />
                <span>Recent Network Activities</span>
              </h3>
              <p className="card-subtitle">Chronological feed of latest ingested connection events</p>
            </div>
            <Link to="/logs" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              <span>View All Logs</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {(!stats?.recentActivities || stats.recentActivities.length === 0) ? (
            <EmptyState
              title="No Ingested Logs"
              description="Upload a network event log file or load sample test data to begin analysis."
              action={
                <Link to="/upload" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                  <span>Upload Logs Now</span>
                </Link>
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>IP Address</th>
                    <th>Username</th>
                    <th>Status</th>
                    <th>FSM State</th>
                    <th>Automata Analysis</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivities.map((log, idx) => (
                    <tr key={idx}>
                      <td className="mono-cell" style={{ fontSize: '12px' }}>
                        {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="mono-cell" style={{ fontWeight: 600 }}>
                        {log.ipAddress}
                      </td>
                      <td>
                        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{log.username}</span>
                      </td>
                      <td>
                        <span className={`badge ${log.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            log.fsmState === 'S0'
                              ? 'badge-success'
                              : log.fsmState === 'S1'
                              ? 'badge-warning'
                              : log.fsmState === 'S2'
                              ? 'badge-orange'
                              : 'badge-danger'
                          }`}
                        >
                          {log.fsmState}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#cbd5e1' }}>{log.analysisResult}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
