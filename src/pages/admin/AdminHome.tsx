import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MdInsertChartOutlined, MdWarningAmber, MdPeopleOutline, MdPersonOutline } from "react-icons/md";
import styles from "./layout/AdminLayout.module.css";

export default function AdminHome() {
  const [summary, setSummary] = useState({
    total_active_students: 0,
    conversations_today: 0,
    crisis_alerts: 0,
    students_at_risk: 0
  });

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get("/api/admin/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch summary", err);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e293b", marginBottom: "1.5rem" }}>
        Dashboard Overview
      </h2>
      
      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Total Active Students</p>
          <h4 className={styles.cardValue}>{summary.total_active_students}</h4>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Conversations Today</p>
          <h4 className={styles.cardValue}>{summary.conversations_today}</h4>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Students at Risk (Level 2-3)</p>
          <h4 className={styles.cardValue}>{summary.students_at_risk}</h4>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Crisis Alerts Triggered</p>
          <h4 className={styles.cardValue} style={{ color: summary.crisis_alerts > 0 ? '#dc2626' : '#0f766e' }}>
            {summary.crisis_alerts}
          </h4>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
        <Link to="/admin/mood-analytics" style={{ textDecoration: "none" }}>
          <div className={styles.card} style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ backgroundColor: "#e0f2fe", padding: "1rem", borderRadius: "50%", color: "#0284c7" }}>
              <MdInsertChartOutlined size={32} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.125rem" }}>Mood Analytics</h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>View campus mood trends</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/risk-monitoring" style={{ textDecoration: "none" }}>
          <div className={styles.card} style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ backgroundColor: "#ffedd5", padding: "1rem", borderRadius: "50%", color: "#ea580c" }}>
              <MdWarningAmber size={32} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.125rem" }}>Risk Monitoring</h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>Track alerts and critical cases</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/student-overview" style={{ textDecoration: "none" }}>
          <div className={styles.card} style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ backgroundColor: "#f3e8ff", padding: "1rem", borderRadius: "50%", color: "#9333ea" }}>
              <MdPeopleOutline size={32} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.125rem" }}>Student Overview</h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>Detailed case management</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
