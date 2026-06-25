import React from "react";
import { C, RADIUS, SHADOW } from "../../theme";

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

const STATUS_STYLE = {
  Pending:  { bg: "#fffbeb", color: "#92400e", border: "#fcd34d" },
  Approved: { bg: "#ecfdf5", color: "#065f46", border: "#6ee7b7" },
  Rejected: { bg: "#fef2f2", color: "#b91c1c", border: "#f87171" },
  "Forwarded to HR": { bg: "#eff6ff", color: "#1e40af", border: "#60a5fa" },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Pending;
  return (
    <span style={{
      display: "inline-block",
      padding: "5px 14px",
      borderRadius: "9999px",
      fontSize: "12.5px",
      fontWeight: "600",
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      letterSpacing: "0.3px",
    }}>
      {status}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: "13px",
      fontWeight: "700",
      color: C.primary,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "16px",
      paddingBottom: "10px",
      borderBottom: `2px solid ${C.borderLight}`,
    }}>
      {children}
    </div>
  );
}

export default function MyRequestsTab({ requests, onViewDetails }) {
  return (
    <div>
      <SectionLabel>My Leave Requests</SectionLabel>

      {requests.length === 0 && (
        <div style={{
          padding: "80px 20px",
          textAlign: "center",
          color: C.muted,
          fontSize: "15px",
          background: C.card,
          borderRadius: RADIUS.card,
          border: `1px solid ${C.borderLight}`,
        }}>
          No leave requests found yet.
        </div>
      )}

      {requests.length > 0 && (
        <div style={{ overflowX: "auto", borderRadius: RADIUS.card, border: `1px solid ${C.borderLight}`, background: C.card }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Applied On</th>
                <th>Period</th>
                <th>Days</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={i} style={i % 2 === 0 ? s.evenRow : {}}>
                  <td style={s.typeCell}>
                    <strong>{LEAVE_TYPES.find(l => l.value === r.leaveType)?.label ?? r.leaveType}</strong>
                  </td>
                  <td>{r.appliedOn ? new Date(r.appliedOn).toLocaleDateString() : "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {r.fromDate} — {r.toDate}
                  </td>
                  <td style={{ fontWeight: "600", color: C.primary }}>
                    {daysBetween(r.fromDate, r.toDate)}
                  </td>
                  <td>
                    <StatusPill status={r.status} />
                  </td>
                  <td style={{ color: C.muted }}>{r.approvedBy || "—"}</td>
                  <td>
                    <button style={s.viewBtn} onClick={() => onViewDetails(r)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Professional Table Styles ───────────────────────────────────
const s = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    color: C.text,
  },

  evenRow: {
    backgroundColor: C.inputBg,
  },

  typeCell: {
    fontWeight: "500",
  },

  viewBtn: {
    padding: "7px 18px",
    background: C.primary,
    color: "#fff",
    border: "none",
    borderRadius: RADIUS.button,
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },

};