import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend
} from "recharts";
import styles from "./layout/AdminLayout.module.css";
import { MdDownload, MdInfoOutline } from "react-icons/md";

const COLORS: Record<string, string> = {
  Happy: "#10b981",    // Green
  Okay: "#3b82f6",     // Blue
  Stressed: "#facc15", // Yellow
  Sad: "#f97316",      // Orange
  Crisis: "#ef4444"    // Red
};

export default function MoodAnalytics() {
  const [moodData, setMoodData] = useState<any[]>([]);
  const [totalChats, setTotalChats] = useState(0);
  const [negativeMoodPercentage, setNegativeMoodPercentage] = useState(0);

  useEffect(() => {
    fetchMoodData();
  }, []);

  const fetchMoodData = async () => {
    try {
      const res = await axios.get("/api/admin/mood-analytics");
      const data = res.data;
      
      const chartArr = Object.keys(data).map(key => ({
        name: key,
        uniqueStudents: Math.max(1, Math.floor(data[key] / 3)), // Mock logic for unique students
        chatVolume: data[key], // Total chats
        avgRiskLevel: key === "Crisis" ? 3 : key === "Sad" ? 2 : key === "Stressed" ? 1 : 0
      }));
      
      const predefinedOrder = ["Happy", "Okay", "Stressed", "Sad", "Crisis"];
      chartArr.sort((a, b) => predefinedOrder.indexOf(a.name) - predefinedOrder.indexOf(b.name));
      setMoodData(chartArr);

      const total = chartArr.reduce((sum, item) => sum + item.chatVolume, 0);
      const negativeTotal = chartArr.filter(i => i.name === 'Sad' || i.name === 'Crisis').reduce((sum, item) => sum + item.chatVolume, 0);
      
      setTotalChats(total);
      if (total > 0) {
        setNegativeMoodPercentage(Math.round((negativeTotal / total) * 100));
      }
    } catch (err) {
      console.error("Failed to fetch mood data", err);
    }
  };

  // Mock trend data for demonstration
  const trendData = [
    { date: 'Mon', score: 3.2 },
    { date: 'Tue', score: 3.4 },
    { date: 'Wed', score: 3.1 },
    { date: 'Thu', score: 2.8 }, // Drops mid-week
    { date: 'Fri', score: 2.9 },
    { date: 'Sat', score: 3.8 },
    { date: 'Sun', score: 4.1 },
  ];

  // Custom Tooltip for Stacked Bar
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: "white", padding: "1rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <p style={{ margin: "0 0 0.5rem 0", fontWeight: "bold", color: COLORS[label] || "#1e293b" }}>{label}</p>
          <p style={{ margin: "0", fontSize: "0.875rem", color: "#475569" }}>Chat Volume: <span style={{ fontWeight: "bold" }}>{payload[0].payload.chatVolume}</span></p>
          <p style={{ margin: "0", fontSize: "0.875rem", color: "#475569" }}>Unique Students: <span style={{ fontWeight: "bold" }}>{payload[0].payload.uniqueStudents}</span></p>
          <p style={{ margin: "0", fontSize: "0.875rem", color: "#475569" }}>Avg Risk Level: <span style={{ fontWeight: "bold" }}>{payload[0].payload.avgRiskLevel}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e293b", margin: 0 }}>
          Mood Analytics
        </h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          <select className={styles.filterSelect}>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Custom</option>
          </select>
          <button className={styles.reviewBtn} style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#e0f2fe", color: "#0284c7" }}>
            <MdDownload /> Export as PDF/CSV
          </button>
        </div>
      </div>

      {negativeMoodPercentage > 25 && (
        <div style={{ backgroundColor: "#fffbeb", color: "#b45309", padding: "1rem 1.5rem", borderRadius: "0.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", border: "1px solid #fde68a" }}>
          <MdInfoOutline size={24} color="#d97706" />
          <div>
            <h4 style={{ margin: 0, fontWeight: "bold" }}>Negative Mood Trend Increasing</h4>
            <p style={{ margin: 0, fontSize: "0.875rem", marginTop: "0.25rem" }}>{negativeMoodPercentage}% of recent chat volume is categorized as Sad or Crisis. Review Risk Monitoring for individual escalations.</p>
          </div>
        </div>
      )}

      {/* KPI Cards for Mood */}
      <div className={styles.summaryGrid} style={{ marginBottom: "1.5rem" }}>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Average Mood Score</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <h4 className={styles.cardValue} style={{ color: "#3b82f6" }}>3.2</h4>
            <span style={{ color: "#64748b", fontSize: "0.875rem" }}>/ 5.0</span>
          </div>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Most Common Mood</p>
          <h4 className={styles.cardValue} style={{ color: COLORS["Stressed"] }}>Stressed (35%)</h4>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Mood Change</p>
          <h4 className={styles.cardValue} style={{ color: "#10b981", fontSize: "1.5rem" }}>↗ +12% improvement</h4>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Total Mood Entries Logged</p>
          <h4 className={styles.cardValue}>1,284</h4>
        </div>
      </div>

      {/* Main Charts */}
      <div className={styles.chartsGrid}>
        {/* Stacked Bar Chart Distribution */}
        <div className={styles.chartContainer} style={{ gridColumn: "1 / -1", height: "400px" }}>
          <h3 className={styles.chartTitle}>Population Emotional Trends (Chat Volume)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={moodData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36}/>
              {/* Stacked segments */}
              <Bar dataKey="uniqueStudents" name="Unique Students" stackId="a" fill="#94a3b8" />
              <Bar dataKey="chatVolume" name="Chat Volume" stackId="a">
                {moodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#cbd5e1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Line Chart */}
        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>7-Day Mood Trend (Average)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#0f766e" strokeWidth={3} dot={{ r: 4, fill: "#0f766e" }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
