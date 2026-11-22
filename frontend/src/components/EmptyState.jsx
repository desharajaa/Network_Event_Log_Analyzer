import React from 'react';
import { ShieldAlert, Inbox } from 'lucide-react';

export default function EmptyState({
  title = 'No Data Found',
  description = 'No network event logs or activities recorded yet.',
  action = null,
  icon: Icon = Inbox
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={48} color="#475569" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
}
