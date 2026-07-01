import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C, SHADOW, RADIUS } from "../../theme";
import AnnouncementCarousel from "../../components/common/AnnouncementCarousel";
import {
  FiUsers,
  FiBriefcase,
  FiCalendar,
  FiMapPin,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";

const stats = [
  {
    label: "Total Employees",
    value: "245",
    delta: "+12 this month",
    up: true,
    icon: <FiUsers />,
    bg: "#e8f4fa",
    color: C.primary,
  },
  {
    label: "Departments",
    value: "12",
    delta: "+1 new",
    up: true,
    icon: <FiBriefcase />,
    bg: "#e1f5ee",
    color: "#0f6e56",
  },
  {
    label: "Leaves Today",
    value: "18",
    delta: "-3 vs yesterday",
    up: false,
    icon: <FiCalendar />,
    bg: "#fde8ef",
    color: C.accent,
  },
  {
    label: "Branches",
    value: "5",
    delta: "No change",
    up: null,
    icon: <FiMapPin />,
    bg: "#faeeda",
    color: "#854f0b",
  },
];

const recentEmployees = [
  {
    name: "Aisha Rahman",
    dept: "Cardiology",
    status: "Active",
    initials: "AR",
    iBg: "#e8f4fa",
    iColor: "#0c447c",
  },
  {
    name: "Suresh Mehta",
    dept: "Radiology",
    status: "On Leave",
    initials: "SM",
    iBg: "#fde8ef",
    iColor: "#993556",
  },
  {
    name: "Priya Kulkarni",
    dept: "Nursing",
    status: "Active",
    initials: "PK",
    iBg: "#e1f5ee",
    iColor: "#085041",
  },
  {
    name: "Rajan Joshi",
    dept: "Administration",
    status: "Remote",
    initials: "RJ",
    iBg: "#faeeda",
    iColor: "#633806",
  },
];

const leaves = [
  {
    type: "Sick Leave",
    note: "Pending Approval",
    count: 8,
  },
  {
    type: "Casual Leave",
    note: "Approved",
    count: 6,
  },
  {
    type: "Earned Leave",
    note: "This Month",
    count: 4,
  },
  {
    type: "Maternity Leave",
    note: "Active",
    count: 2,
  },
];

const pillStyle = (status) => {
  const map = {
    Active: { background: "#e1f5ee", color: "#085041" },
    "On Leave": { background: "#fde8ef", color: "#993556" },
    Remote: { background: "#e8f4fa", color: "#0c447c" },
  };
  return map[status] || {};
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [showDashboard, setShowDashboard] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Show carousel if announcements exist and dashboard not shown
  if (!showDashboard && announcements.length > 0 && !isLoading) {
    return (
      <AnnouncementCarousel 
        announcements={announcements}
        onContinue={() => setShowDashboard(true)}
        continueText="Continue To Dashboard →"
      />
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '88vh', 
        color: C.text,
        fontSize: "16px"
      }}>
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.pageHead}>
        <div>
          <div style={styles.welcome}>Welcome back, Admin</div>
          <h1 style={styles.pageTitle}>Dashboard Overview</h1>
          <p style={styles.pageSub}>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button style={styles.addBtn}>+ Add Employee</button>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        {stats.map((item) => (
          <div key={item.label} style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: item.bg, color: item.color }}>
              {item.icon}
            </div>
            <div style={styles.statValue}>{item.value}</div>
            <div style={styles.statLabel}>{item.label}</div>
            <div style={{ ...styles.statDelta, color: item.up === false ? C.accent : item.up ? "#0f6e56" : C.muted }}>
              {item.up === true && <FiArrowUp />}
              {item.up === false && <FiArrowDown />}
              {item.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Panels */}
      <div style={styles.twoCol}>
        <div style={styles.panel}>
          <div style={styles.panelHead}>
            <span style={styles.panelTitle}>Recent Employees</span>
            <span style={styles.link}>View All</span>
          </div>
          {recentEmployees.map((emp) => (
            <div key={emp.name} style={styles.empRow}>
              <div style={{ ...styles.empAvatar, background: emp.iBg, color: emp.iColor }}>
                {emp.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.empName}>{emp.name}</div>
                <div style={styles.empDept}>{emp.dept}</div>
              </div>
              <span style={{ ...styles.pill, ...pillStyle(emp.status) }}>
                {emp.status}
              </span>
            </div>
          ))}
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHead}>
            <span style={styles.panelTitle}>Leave Overview</span>
            <span style={styles.link}>Manage</span>
          </div>
          {leaves.map((leave) => (
            <div key={leave.type} style={styles.leaveRow}>
              <div>
                <div style={styles.leaveType}>{leave.type}</div>
                <div style={styles.leaveNote}>{leave.note}</div>
              </div>
              <div style={styles.leaveCount}>{leave.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Cards */}
      <div style={styles.bottomGrid}>
        <div style={styles.bigCard}>
          <div style={styles.bigTitle}>Department Distribution</div>
          <div style={styles.chartPlaceholder}>Analytics Chart Coming Soon</div>
        </div>

        <div style={styles.bigCard}>
          <div style={styles.bigTitle}>Upcoming Activities</div>
          <div style={styles.activity}>Annual Performance Reviews</div>
          <div style={styles.activity}>Payroll Processing</div>
          <div style={styles.activity}>Employee Onboarding</div>
          <div style={styles.activity}>HR Policy Updates</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", gap: "32px", padding: "32px" },
  pageHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  welcome: { color: C.primary, fontWeight: "600", fontSize: "15px", marginBottom: "6px" },
  pageTitle: { fontSize: "32px", fontWeight: "700", margin: 0, color: C.text },
  pageSub: { color: C.muted, marginTop: "6px", fontSize: "15px" },
  addBtn: {
    padding: "10px 24px",
    background: C.primary,
    color: "#fff",
    border: "none",
    borderRadius: RADIUS.button,
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" },
  statCard: { background: "#fff", borderRadius: "24px", padding: "24px", boxShadow: "0 10px 35px rgba(15,23,42,.05)", border: "1px solid rgba(43,125,161,.08)" },
  statIcon: { width: "56px", height: "56px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "18px" },
  statValue: { fontSize: "36px", fontWeight: "700", color: C.text },
  statLabel: { color: C.muted, marginTop: "6px", fontSize: "14px" },
  statDelta: { marginTop: "12px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "500" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  panel: { background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid rgba(43,125,161,.08)", boxShadow: "0 10px 35px rgba(15,23,42,.05)" },
  panelHead: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
  panelTitle: { fontWeight: "700", fontSize: "18px", color: C.text },
  link: { color: C.primary, cursor: "pointer", fontWeight: "600" },
  empRow: { display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", borderBottom: "1px solid #eef2f6" },
  empAvatar: { width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" },
  empName: { fontWeight: "600", color: C.text },
  empDept: { fontSize: "13px", color: C.muted },
  pill: { padding: "6px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "600" },
  leaveRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #eef2f6" },
  leaveType: { fontWeight: "600" },
  leaveNote: { color: C.muted, fontSize: "13px" },
  leaveCount: { fontSize: "26px", fontWeight: "700", color: C.primary },
  bottomGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" },
  bigCard: { background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid rgba(43,125,161,.08)", boxShadow: "0 10px 35px rgba(15,23,42,.05)" },
  bigTitle: { fontSize: "18px", fontWeight: "700", marginBottom: "18px" },
  chartPlaceholder: { height: "280px", borderRadius: "18px", background: "linear-gradient(135deg,#f5fbff,#eef8fd)", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontWeight: "600" },
  activity: { padding: "14px", background: "#f8fafc", border: "1px solid #eef2f6", borderRadius: "14px", marginBottom: "12px", fontSize: "14px", fontWeight: "500" },
};