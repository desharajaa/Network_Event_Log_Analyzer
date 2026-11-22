import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function LogAnalysisPage({ refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Query state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [fsmState, setFsmState] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit, setLimit] = useState(20);

  // Fetch parsed logs from backend
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit,
        sortBy,
        sortOrder
      };

      if (search.trim()) params.search = search.trim();
      if (status !== 'ALL') params.status = status;
      if (fsmState !== 'ALL') params.fsmState = fsmState;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.getLogs(params);
      if (res.success) {
        setLogs(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, sortBy, sortOrder, status, fsmState, refreshTrigger]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setFsmState('ALL');
    setStartDate('');
    setEndDate('');
    setSortBy('timestamp');
    setSortOrder('desc');
    setPage(1);
  };

  const handleSortToggle = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="main-wrapper">
      <TopBar
        title="Log Telemetry & Automata Analysis"
        subtitle="Chronological inspection of parsed network connection events and FSM state classifications"
        onRefresh={fetchLogs}
      />

      <div className="page-content">
        {/* Search & Filter Bar */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSearchSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
              {/* Search input */}
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Search IP or Username
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 192.168.1.20 or root"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                </div>
              </div>

              {/* Status filter */}
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Connection Status
                </label>
                <select
                  className="form-control"
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              {/* FSM State filter */}
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  FSM Automata State
                </label>
                <select
                  className="form-control"
                  value={fsmState}
                  onChange={(e) => { setFsmState(e.target.value); setPage(1); }}
                >
                  <option value="ALL">All States (S0 - S3)</option>
                  <option value="S0">S0 (Normal State)</option>
                  <option value="S1">S1 (1st Failure)</option>
                  <option value="S2">S2 (2nd Failure)</option>
                  <option value="S3">S3 (Security Alert State)</option>
                </select>
              </div>

              {/* Date Filters */}
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  End Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Filter size={15} />
                  <span>Filter</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-secondary"
                  title="Reset Filters"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Data Table Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Parsed Network Logs</h3>
              <p className="card-subtitle">
                Showing {logs.length} of {totalRecords} logged events (Page {page} of {totalPages})
              </p>
            </div>

            {/* Items per page selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
              <span>Rows per page:</span>
              <select
                className="form-control"
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                style={{ width: '70px', padding: '4px 8px' }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Querying network event logs..." />
          ) : error ? (
            <div style={{ padding: '20px', color: '#f87171', fontSize: '13px' }}>
              Failed to load logs: {error}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              title="No Logs Matched Criteria"
              description="Try adjusting your search queries or upload fresh network event logs."
            />
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSortToggle('timestamp')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Timestamp</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortToggle('ipAddress')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>IP Address</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortToggle('username')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Username</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortToggle('status')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Connection Status</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortToggle('fsmState')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>FSM State</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </th>
                      <th>Automata Analysis Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const isSuccess = log.status === 'SUCCESS';
                      let fsmBadgeClass = 'badge-success';
                      if (log.fsmState === 'S1') fsmBadgeClass = 'badge-warning';
                      if (log.fsmState === 'S2') fsmBadgeClass = 'badge-orange';
                      if (log.fsmState === 'S3') fsmBadgeClass = 'badge-danger';

                      return (
                        <tr key={log._id}>
                          <td className="mono-cell" style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>
                            {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                          </td>
                          <td className="mono-cell" style={{ fontWeight: 600 }}>
                            {log.ipAddress}
                          </td>
                          <td>
                            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{log.username}</span>
                          </td>
                          <td>
                            <span className={`badge ${isSuccess ? 'badge-success' : 'badge-danger'}`}>
                              {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              <span>{log.status}</span>
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${fsmBadgeClass}`}>
                              {log.fsmState}
                            </span>
                          </td>
                          <td style={{ fontSize: '13px', color: '#cbd5e1' }}>
                            {log.analysisResult}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
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
                  Showing {logs.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                  {Math.min(page * limit, totalRecords)} of {totalRecords} entries
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
