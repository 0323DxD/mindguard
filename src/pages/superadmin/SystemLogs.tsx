import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MdHistory, MdSearch } from 'react-icons/md';

const actionColors: Record<string, string> = {
  CREATED_STAFF: '#10b981',
  UPDATED_STAFF: '#3b82f6',
  DELETED_STAFF: '#ef4444',
  CREATED_ADMIN: '#6366f1',
  DELETED_ADMIN: '#dc2626',
};

export default function SystemLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/admin/system-logs')
      .then(r => setLogs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    l.actor?.toLowerCase().includes(search.toLowerCase()) ||
    l.target?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>System Audit Logs</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Track all administrative actions</p>
      </div>

      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
        <MdSearch size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          placeholder="Search logs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Action', 'Performed By', 'Target', 'Timestamp'].map(h => (
                <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading logs...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No logs found.</td></tr>
            ) : filtered.map((l, i) => (
              <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                    background: `${actionColors[l.action] || '#6b7280'}1a`,
                    color: actionColors[l.action] || '#6b7280'
                  }}>
                    {l.action?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#334155' }}>{l.actor}</td>
                <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#64748b' }}>{l.target}</td>
                <td style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#94a3b8' }}>
                  {new Date(l.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
