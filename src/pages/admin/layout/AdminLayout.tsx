import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import {
  MdDashboard, MdInsertChartOutlined, MdWarningAmber,
  MdPeopleOutline, MdManageAccounts, MdLogout
} from "react-icons/md";
import styles from "./AdminLayout.module.css";

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get("/api/admin/alerts");
      // Only show count for unreviewed active alerts (just a simple count for now)
      setAlerts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  };

  const isMainDashboard = location.pathname === "/admin/dashboard";

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <h2>MindGuard</h2>
        <nav>
          <Link to="/admin/dashboard" className={location.pathname === "/admin/dashboard" ? styles.active : ""}>
            <MdDashboard size={20} />
            <span className={styles.sidebarText}>Dashboard</span>
          </Link>
          <Link to="/admin/mood-analytics" className={location.pathname.includes("mood") ? styles.active : ""}>
            <MdInsertChartOutlined size={20} />
            <span className={styles.sidebarText}>Mood Analytics</span>
          </Link>
          <Link to="/admin/risk-monitoring" className={location.pathname.includes("risk") ? styles.active : ""}>
            <MdWarningAmber size={20} />
            <span className={styles.sidebarText}>Risk Monitoring</span>
          </Link>
          <Link to="/admin/student-overview" className={location.pathname.includes("student") ? styles.active : ""}>
            <MdPeopleOutline size={20} />
            <span className={styles.sidebarText}>Student Overview</span>
          </Link>
          <Link to="/admin/manage-users" className={location.pathname.includes("manage-users") ? styles.active : ""}>
            <MdManageAccounts size={20} />
            <span className={styles.sidebarText}>Manage Users</span>
          </Link>
          <Link to="/mindguard/">
            <MdLogout size={20} />
            <span className={styles.sidebarText}>Logout</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className={styles.greeting}>
              <h1>Hello, Admin</h1>
              <p>Monitoring student well-being and safety</p>
            </div>
          </div>
          <div className={styles.topbarRight}>
            <span role="img" aria-label="alert bell">🔔 {alerts.length > 0 && <span style={{ color: 'red', fontWeight: 'bold' }}>({alerts.length})</span>}</span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
          </div>
        </header>

        {/* Scrollable Area - Content provided by Outlet */}
        <div className={styles.contentScroll}>
          <Outlet />

          <footer className={styles.footer}>
            🔒 All data is encrypted and protected for your privacy.
          </footer>
        </div>
      </main>
    </div>
  );
}
