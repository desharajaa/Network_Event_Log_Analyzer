import React from 'react';
import { RefreshCw, Trash2, Database, ShieldCheck } from 'lucide-react';

export default function TopBar({
  title,
  subtitle,
  onRefresh,
  onClear,
  dbStatus
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-right">
        {dbStatus && (
          <div
            className={`badge ${
              dbStatus.connected ? 'badge-success' : 'badge-warning'
            }`}
            title={dbStatus.info || ''}
            style={{ padding: '6px 12px' }}
          >
            <Database size={14} />
            <span>{dbStatus.connected ? 'MongoDB Active' : 'In-Memory Mode'}</span>
          </div>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-sm"
            title="Refresh Data"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        )}

        {onClear && (
          <button
            onClick={onClear}
            className="btn btn-danger btn-sm"
            title="Clear all stored logs and alerts"
          >
            <Trash2 size={14} />
            <span>Clear Logs</span>
          </button>
        )}
      </div>
    </header>
  );
}
