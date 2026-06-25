import React from "react";
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

const STATUS_STYLE = {
  Pending: { bg: "#faeeda", color: "#633806" },
  Approved: { bg: "#e1f5ee", color: "#085041" },
  Rejected: { bg: "#fde8ef", color: "#993556" },
  "Forwarded to HR": { bg: "#e8f4fa", color: "#0c447c" },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Pending;
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 14px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "600",
      background: s.bg,
      color: s.color,
      letterSpacing: "0.3px"
    }}>
      {status}
    </span>
  );
}

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

export default function TeamRequestsTab({ requests, onApprove, onReject, onViewDetails }) {
  return (
    <div>
      <SectionLabel>Team Leave Requests</SectionLabel>
      <div style={{
        fontSize: "13px",
        color: C.muted,
        marginBottom: "16px",
        padding: "10px 14px",
        background: C.inputBg,
        borderRadius: "6px",
        border: `1px solid ${C.borderLight}`
      }}>
        Showing requests from your team. Requests ≤ 3 days can be approved by you.
        Longer requests are forwarded to HR.
      </div>
      {requests.length === 0 && (
        <div style={{
          padding: "60px 20px",
          textAlign: "center",
          color: C.muted,
          fontSize: "14px"
        }}>No team requests found.</div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r, i) => {
              const days = daysBetween(r.fromDate, r.toDate);
              const canApprove = days <= 3 && ["Casual", "Sick", "Earned"].includes(r.leaveType);
              return (
                <tr key={i}>
                  <td>{r.employeeName}</td>
                  <td>{LEAVE_TYPES.find(l => l.value === r.leaveType)?.label ?? r.leaveType}</td>
                  <td>{r.fromDate} – {r.toDate}</td>
                  <td>{days}</td>
                  <td style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.reason}
                  </td>
                  <td>
                    {canApprove ? (
                      <StatusPill status={r.status} />
                    ) : (
                      <span style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#0c447c",
                        background: "#e8f4fa",
                        padding: "3px 10px",
                        borderRadius: "999px"
                      }}>Forwarded to HR</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {canApprove && r.status === "Pending" && (
                        <>
                          <button style={s.approveBtn} onClick={() => onApprove(r.id)}>Approve</button>
                          <button style={s.rejectBtn} onClick={() => onReject(r.id)}>Reject</button>
                        </>
                      )}
                      <button style={s.viewBtn} onClick={() => onViewDetails(r)}>View</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s = {
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