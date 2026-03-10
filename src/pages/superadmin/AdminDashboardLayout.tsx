import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard, MdPeople, MdHistory, MdSettings, MdLogout, MdShield
} from 'react-icons/md';

const sidebarStyle: React.CSSProperties = {
  width: '240px',
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 0',
  flexShrink: 0,
};

const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 24px',
  color: 'rgba(255,255,255,0.65)',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 500,
  transition: 'all 0.2s',
  borderLeft: '3px solid transparent',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  width: '100%',
};

const activeLinkStyle: React.CSSProperties = {
  ...linkStyle,
  color: '#fff',
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderLeft: '3px solid #6366f1',
};

export function AdminDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <MdShield size={24} color="#6366f1" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>MindGuard</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', margin: 0 }}>Admin Control Panel</p>
        </div>

        <nav style={{ marginTop: '16px', flex: 1 }}>
          <Link to="/superadmin/dashboard" style={isActive('superadmin/dashboard') ? activeLinkStyle : linkStyle}>
            <MdDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/superadmin/manage-staff" style={isActive('manage-staff') ? activeLinkStyle : linkStyle}>
            <MdPeople size={20} />
            Manage Staff
          </Link>
          <Link to="/superadmin/system-logs" style={isActive('system-logs') ? activeLinkStyle : linkStyle}>
            <MdHistory size={20} />
            System Logs
          </Link>
          <Link to="/superadmin/settings" style={isActive('settings') ? activeLinkStyle : linkStyle}>
            <MdSettings size={20} />
            Settings
          </Link>
        </nav>

        <div style={{ padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '8px 24px', marginBottom: '4px' }}>
            <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{user?.fullname || 'Administrator'}</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} style={{ ...linkStyle, color: '#f87171' }}>
            <MdLogout size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Topbar */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Admin Dashboard</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>System administration & staff management</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
              {(user?.fullname || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
          <Outlet />
        </div>

        <footer style={{ padding: '16px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
          🔒 All data is encrypted and protected for your privacy.
        </footer>
      </main>
    </div>
  );
}
