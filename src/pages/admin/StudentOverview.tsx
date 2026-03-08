import React from "react";
import { MdDownload } from "react-icons/md";
import styles from "./layout/AdminLayout.module.css";
import StudentTable from "./StudentTable";

export default function StudentOverview() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e293b", margin: 0 }}>
          Student Overview
        </h2>
        <button className={styles.reviewBtn} style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#f3e8ff", color: "#9333ea" }}>
          <MdDownload /> Export Student Overview
        </button>
      </div>

      {/* The StudentTable component already has search/filter/sort built in */}
      <StudentTable />
      
    </div>
  );
}
