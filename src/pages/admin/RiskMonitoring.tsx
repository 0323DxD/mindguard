import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend
} from "recharts";
import { MdDownload, MdWarningAmber } from "react-icons/md";
import styles from "./layout/AdminLayout.module.css";
import AlertsPanel from "./AlertsPanel";

export default function RiskMonitoring() {
  const [riskData, setRiskData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [riskRes, alertRes] = await Promise.all([
        axios.get("/api/admin/risk-analytics"),
        axios.get("/api/admin/alerts")
      ]);
      
      const rData = riskRes.data;
      setRiskData([
        { name: "Level 0 - Stable", count: rData.level_0 || 0, color: "#10b981" },
        { name: "Level 1 - Distressed", count: rData.level_1 || 0, color: "#facc15" },
        { name: "Level 2 - Soft Crisis", count: rData.level_2 || 0, color: "#f97316" },
        { name: "Level 3 - High Crisis", count: rData.level_3 || 0, color: "#ef4444" }
      ]);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error("Failed to fetch risk data", err);
    }
  };

  // Mock trend data
  const trendData = [
    { name: 'Week 1', level_2: 4, level_3: 1 },
    { name: 'Week 2', level_2: 3, level_3: 2 },
    { name: 'Week 3', level_2: 5, level_3: 0 },
    { name: 'Week 4', level_2: 2, level_3: 1 },
  ];

  // Custom label for Pie Chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    if (percent === 0) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={"12px"} fontWeight={"bold"}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const hasCriticalAlerts = alerts.some((a: any) => a.risk_level >= 2);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e293b", margin: 0 }}>
          Risk Monitoring
        </h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          <select className={styles.filterSelect}>
            <option>All Alerts</option>
            <option>High Risk Only</option>
            <option>Critical Only</option>
          </select>
          <select className={styles.filterSelect}>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <button className={styles.reviewBtn} style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#ffedd5", color: "#ea580c" }}>
            <MdDownload /> Export Risk Log
          </button>
        </div>
      </div>

      {hasCriticalAlerts && (
        <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "1rem 1.5rem", borderRadius: "0.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", border: "1px solid #fecaca" }}>
          <MdWarningAmber size={24} color="#dc2626" />
          <div>
            <h4 style={{ margin: 0, fontWeight: "bold" }}>Critical Alert Activity Detected</h4>
            <p style={{ margin: 0, fontSize: "0.875rem", marginTop: "0.25rem" }}>One or more students have triggered a high-risk alert recently. Please review the Alert Log below and dispatch immediate outreach if necessary.</p>
          </div>
        </div>
      )}

      <div className={styles.chartsGrid} style={{ marginBottom: "2rem" }}>
        {/* Donut Chart */}
        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>Risk Level Distribution</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="count"
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Horizontal Bar Chart Trend */}
        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>30-Day Risk Trends (L2 & L3)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={trendData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="level_2" name="Soft Crisis (L2)" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
              <Bar dataKey="level_3" name="High Crisis (L3)" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AlertsPanel alerts={alerts} />
    </div>
  );
}
