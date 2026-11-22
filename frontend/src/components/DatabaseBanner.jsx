import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Database, ExternalLink } from 'lucide-react';

export default function DatabaseBanner({ dbStatus }) {
  const [expanded, setExpanded] = useState(false);

  if (!dbStatus) return null;

  if (dbStatus.connected) {
    return (
      <div className="db-banner connected">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={18} color="#10b981" />
          <span>
            <strong>MongoDB Connected:</strong> Logs and security alerts are being persisted permanently to the database.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="db-banner warning" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} color="#f59e0b" />
          <span>
            <strong>Notice: MongoDB is currently disconnected.</strong> The application is functioning normally using its fast <em>In-Memory Storage Mode</em> for this demo session.
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fbbf24',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <span>{expanded ? 'Hide Guide' : 'How to Connect MongoDB'}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(245, 158, 11, 0.2)',
            fontSize: '12px',
            color: '#fef3c7',
            lineHeight: 1.6
          }}
        >
          <p style={{ marginBottom: '8px' }}>
            To enable permanent MongoDB persistence, follow either of these standard options:
          </p>
          <ol style={{ paddingLeft: '20px', marginBottom: '8px' }}>
            <li style={{ marginBottom: '4px' }}>
              <strong>Option A (Local MongoDB):</strong> Ensure MongoDB Community Server is installed, then start it by running <code>mongod</code> in terminal or starting the <em>MongoDB</em> service in Windows Services.
            </li>
            <li>
              <strong>Option B (Free Cloud MongoDB Atlas):</strong> Create a cluster at{' '}
              <a
                href="https://www.mongodb.com/cloud/atlas"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#60a5fa', textDecoration: 'underline' }}
              >
                mongodb.com/cloud/atlas
              </a>
              , copy the connection URI, and update <code>backend/.env</code>:
              <pre
                style={{
                  background: '#0a0f1d',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  marginTop: '4px',
                  fontFamily: 'monospace'
                }}
              >
                MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/network_log_analyzer
              </pre>
            </li>
          </ol>
          <p style={{ fontSize: '11px', color: '#cbd5e1' }}>
            Note: All parsing, Regular Expressions, FSM transitions, and dashboards work 100% interactively in both modes!
          </p>
        </div>
      )}
    </div>
  );
}
