import React, { useState } from "react";
import { C } from "../../theme";

function daysBetween(from, to) {
  if (!from || !to) return 0;
  const d1 = new Date(from), d2 = new Date(to);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
}

const LEAVE_TYPES = [
  { value: "Casual", label: "Casual Leave" },
  { value: "Sick", label: "Sick Leave" },
  { value: "Earned", label: "Earned Leave" },
  { value: "Flexi", label: "Flexi Holiday" },
  { value: "LWP", label: "Leave Without Pay" },
  { value: "Maternity", label: "Maternity Leave" },
];

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: "12px",
      fontWeight: "700",
      color: C.primary,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "14px",
      paddingBottom: "8px",
      borderBottom: `2px solid ${C.borderLight}`
    }}>
      {children}
    </div>
  );
}

export default function LeaveRequestsTab({ requests, onApprove, onReject, onViewDetails }) {
  const [filters, setFilters] = useState({
    department: "",
    leaveType: "",
    status: "",
    month: "",
  });

  return (
    <div>
      <SectionLabel>Leave Requests</SectionLabel>
      <div style={s.filterBar}>
        <select style={s.filterSelect} value={filters.department} onChange={e => setFilters(p => ({ ...p, department: e.target.value }))}>
          <option value="">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="HR">HR</option>
          <option value="Sales">Sales</option>
          <option value="Marketing">Marketing</option>
        </select>
        <select style={s.filterSelect} value={filters.leaveType} onChange={e => setFilters(p => ({ ...p, leaveType: e.target.value }))}>
          <option value="">All Leave Types</option>
          {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
        </select>
        <select style={s.filterSelect} value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <input
          type="month"
          style={s.filterSelect}
          value={filters.month}
          onChange={e => setFilters(p => ({ ...p, month: e.target.value }))}
        />
      </div>
      {requests.length === 0 && (
        <div style={{
          padding: "60px 20px",
          textAlign: "center",
          color: C.muted,
          fontSize: "14px"
        }}>No leave requests found.</div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Leave Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Manager Approval</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r, i) => (
              <tr key={i}>
                <td>{r.employeeName}</td>
                <td>{r.department}</td>
                <td>{LEAVE_TYPES.find(l => l.value === r.leaveType)?.label ?? r.leaveType}</td>
                <td>{r.fromDate} – {r.toDate}</td>
                <td>{daysBetween(r.fromDate, r.toDate)}</td>
                <td>
                  {r.managerApproved ? (
                    <span style={{ color: "#085041", fontWeight: "600" }}>✓ Approved</span>
                  ) : (
                    <span style={{ color: "#92400e" }}>Pending</span>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button style={s.approveBtn} onClick={() => onApprove(r.id)}>Approve</button>
                    <button style={s.rejectBtn} onClick={() => onReject(r.id)}>Reject</button>
                    <button style={s.viewBtn} onClick={() => onViewDetails(r)}>View</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s = {
  filterBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap"
  },
  filterSelect: {
    padding: "8px 12px",
    border: `1.5px solid ${C.borderLight}`,
    borderRadius: "6px",
    fontSize: "13px",
    background: C.card,
    color: C.text,
    outline: "none",
    minWidth: "150px",
    transition: "all 0.2s ease",
    '&:focus': { borderColor: C.primary }
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    '& th': {
      textAlign: "left",
      padding: "12px 12px",
      background: C.inputBg,
      borderBottom: `2px solid ${C.borderLight}`,
      fontWeight: "600",
      color: C.muted
    },
    '& td': {
      padding: "12px 12px",
      borderBottom: `1px solid ${C.borderLight}`,
      color: C.text
    }
  },
  approveBtn: {
    padding: "5px 14px",
    background: "#e1f5ee",
    color: "#085041",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    '&:hover': { opacity: 0.8 }
  },
  rejectBtn: {
    padding: "5px 14px",
    background: "#fde8ef",
    color: "#993556",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    '&:hover': { opacity: 0.8 }
  },
  viewBtn: {
    padding: "5px 14px",
    background: "#e8f4fa",
    color: "#0c447c",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    '&:hover': { opacity: 0.8 }
  },
};