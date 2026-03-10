import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import {
  MdDashboard, MdInsertChartOutlined, MdWarningAmber,
  MdPeopleOutline, MdLogout, MdBarChart
} from "react-icons/md";
import styles from "./AdminLayout.module.css";

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get("/api/admin/alerts");
      setAlerts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <h2>MindGuard</h2>
        <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", marginTop: "-8px", marginBottom: "16px" }}>
          Staff Dashboard
        </p>
        <nav>
          <Link to="/staff/dashboard" className={location.pathname === "/staff/dashboard" ? styles.active : ""}>
            <MdDashboard size={20} />
            <span className={styles.sidebarText}>Dashboard</span>
          </Link>
          <Link to="/staff/mood-analytics" className={location.pathname.includes("mood") ? styles.active : ""}>
            <MdInsertChartOutlined size={20} />
            <span className={styles.sidebarText}>Mood Analytics</span>
          </Link>
          <Link to="/staff/risk-monitoring" className={location.pathname.includes("risk") ? styles.active : ""}>
            <MdWarningAmber size={20} />
            <span className={styles.sidebarText}>Risk Monitoring</span>
          </Link>
          <Link to="/staff/student-overview" className={location.pathname.includes("student") ? styles.active : ""}>
            <MdPeopleOutline size={20} />
            <span className={styles.sidebarText}>Student Overview</span>
          </Link>
          <Link to="/staff/reports" className={location.pathname.includes("reports") ? styles.active : ""}>
            <MdBarChart size={20} />
            <span className={styles.sidebarText}>Reports</span>
          </Link>
          <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem", color: "rgba(255,255,255,0.7)", padding: "0.75rem 1rem", width: "100%", textAlign: "left" }}>
            <MdLogout size={20} />
            <span className={styles.sidebarText}>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className={styles.greeting}>
              <h1>Hello, {user?.fullname?.split(" ")[0] || "Staff"}</h1>
              <p>Monitoring student well-being and safety</p>
            </div>
          </div>
          <div className={styles.topbarRight}>
            <span role="img" aria-label="alert bell">🔔 {alerts.length > 0 && <span style={{ color: 'red', fontWeight: 'bold' }}>({alerts.length})</span>}</span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
              {(user?.fullname || "S")[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
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
