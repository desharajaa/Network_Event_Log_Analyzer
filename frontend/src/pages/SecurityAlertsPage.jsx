import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Server
} from 'lucide-react';
import api from '../services/api';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function SecurityAlertsPage({ refreshTrigger }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 20
      };
      if (search.trim()) params.search = search.trim();
      if (severity !== 'ALL') params.severity = severity;

      const res = await api.getAlerts(params);
      if (res.success) {
        setAlerts(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load security alerts:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch security alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, severity, refreshTrigger]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAlerts();
  };

  const handleReset = () => {
    setSearch('');
    setSeverity('ALL');
    setPage(1);
  };

  return (
    <div className="main-wrapper">
      <TopBar
        title="Security Alert Management"
        subtitle="Automated brute-force intrusion detection triggered by Finite State Machine threshold breaches"
        onRefresh={fetchAlerts}
      />

      <div className="page-content">
        {/* Search & Severity Filter */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSearchSubmit}>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1', minWidth: '220px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Search IP or Alert Message
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search suspicious IP or keywords..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                </div>
              </div>

              <div style={{ width: '180px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Severity Level
                </label>
                <select
                  className="form-control"
                  value={severity}
                  onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
                >
                  <option value="ALL">All Severities</option>
                  <option value="HIGH">HIGH Severity</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary">
                  <Filter size={15} />
                  <span>Filter</span>
                </button>
                <button type="button" onClick={handleReset} className="btn btn-secondary">
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Alerts Grid / Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <ShieldAlert size={18} color="#ef4444" />
                <span>Security Threat Incidents</span>
              </h3>
              <p className="card-subtitle">
                Total {totalRecords} alert incidents recorded in database
              </p>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Querying security alert records..." />
          ) : error ? (
            <div style={{ padding: '20px', color: '#f87171', fontSize: '13px' }}>
              Failed to load alerts: {error}
            </div>
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No Security Threats Detected"
              description="No IP addresses have breached the 3-consecutive-failure threshold. System status is secure."
            />
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Suspicious IP Address</th>
                      <th>Consecutive Failures</th>
                      <th>Alert Type</th>
                      <th>Severity</th>
                      <th>Threat Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => (
                      <tr key={alert._id}>
                        <td className="mono-cell" style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>
                          {new Date(alert.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                        </td>
                        <td className="mono-cell" style={{ fontWeight: 700, color: '#f87171' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Server size={14} color="#f87171" />
                            <span>{alert.ipAddress}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#fca5a5' }}>
                            {alert.totalFailures} failed attempts
                          </span>
                        </td>
                        <td>
                          <span className="mono-cell" style={{ fontSize: '12px', color: '#cbd5e1' }}>
                            {alert.alertType}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-danger" style={{ boxShadow: 'var(--glow-red)' }}>
                            <AlertTriangle size={12} />
                            <span>{alert.severity}</span>
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#e2e8f0', maxWidth: '350px' }}>
                          {alert.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '20px',
                  borderTop: '1px solid #1a2a47',
                  marginTop: '16px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Showing {alerts.length} of {totalRecords} alert incidents
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn btn-secondary btn-sm"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <span style={{ fontSize: '12px', color: '#fff', padding: '0 8px', fontFamily: 'var(--font-mono)' }}>
                    {page} / {totalPages}
                  </span>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn btn-secondary btn-sm"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
