import React from "react";
import styles from "./layout/AdminLayout.module.css";
import { format } from "date-fns";

interface Alert {
  session_id: string;
  risk_level: number;
  mood: string;
  action: string;
  timestamp: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className={styles.alertsPanel}>
      <h2 className={styles.alertsTitle}>
        <span role="img" aria-label="alert">⚠️</span> Crisis Alerts Detected ({alerts.length})
      </h2>
      <div className={styles.alertsList}>
        {alerts.map((alert, idx) => {
          let formattedTime = alert.timestamp;
          try {
             formattedTime = format(new Date(alert.timestamp), "MMM d, h:mm a");
          } catch(e) {}

          return (
            <div key={`${alert.session_id}-${idx}`} className={styles.alertItem}>
              <div>
                <div className={styles.alertText}>
                  <strong>Level {alert.risk_level} Risk</strong> detected in session: <code>{alert.session_id}</code>
                </div>
                <div style={{ fontSize: "0.875rem", color: "#b91c1c", marginTop: "0.25rem" }}>
                  Action Triggered: <strong>{alert.action || "Unknown"}</strong> • Mood: {alert.mood} • {formattedTime}
                </div>
              </div>
              <button 
                className={styles.reviewBtn}
                onClick={() => window.alert(`Reviewing session ${alert.session_id}...`)}
              >
                Mark as Reviewed
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
