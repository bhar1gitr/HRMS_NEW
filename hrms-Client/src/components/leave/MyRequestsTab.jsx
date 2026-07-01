import React from "react";
import { C, RADIUS } from "../../theme";

const LEAVE_TYPE_LABELS = {
  Casual: "Casual Leave", Sick: "Sick Leave", Earned: "Earned Leave",
  Flexi: "Flexi Holiday", LWP: "Leave Without Pay", Maternity: "Maternity Leave",
};

const STATUS_STYLE = {
  Pending:           { bg: "#fffbeb", color: "#92400e", border: "#fcd34d" },
  Approved:          { bg: "#ecfdf5", color: "#065f46", border: "#6ee7b7" },
  Rejected:          { bg: "#fef2f2", color: "#b91c1c", border: "#f87171" },
  "Forwarded to HR": { bg: "#eff6ff", color: "#1e40af", border: "#60a5fa" },
};

function StatusPill({ status }) {
  const st = STATUS_STYLE[status] ?? STATUS_STYLE.Pending;
  return (
    <span style={{
      display: "inline-block", padding: "5px 14px", borderRadius: "9999px",
      fontSize: "12.5px", fontWeight: "600", background: st.bg, color: st.color,
      border: `1px solid ${st.border}`,
    }}>
      {status}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: "13px", fontWeight: "700", color: C.primary,
      letterSpacing: "0.08em", textTransform: "uppercase",
      marginBottom: "16px", paddingBottom: "10px", borderBottom: `2px solid ${C.borderLight}`,
    }}>
      {children}
    </div>
  );
}

export default function MyRequestsTab({ requests, onViewDetails }) {
  return (
    <div>
      <SectionLabel>My Leave Requests</SectionLabel>

      {requests.length === 0 ? (
        <div style={{
          padding: "80px 20px", textAlign: "center", color: C.muted,
          fontSize: "15px", background: C.card, borderRadius: RADIUS.card,
          border: `1px solid ${C.borderLight}`,
        }}>
          No leave requests yet. Apply your first leave using the "Apply Leave" tab.
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: RADIUS.card, border: `1px solid ${C.borderLight}`, background: C.card }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr>
                {["Leave Type", "Applied On", "Period", "Days", "Status", "Approved By", ""].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "12px 14px", background: C.inputBg,
                    borderBottom: `2px solid ${C.borderLight}`, fontSize: "12px",
                    fontWeight: "600", color: C.muted, whiteSpace: "nowrap"
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={r.id || i} style={i % 2 === 0 ? {} : { background: C.inputBg }}>
                  <td style={s.td}>
                    <strong>{LEAVE_TYPE_LABELS[r.leaveType] ?? r.leaveType}</strong>
                    {r.halfDay !== "Full" && (
                      <span style={{ fontSize: "11px", color: C.muted, marginLeft: "6px" }}>
                        ({r.halfDay} half)
                      </span>
                    )}
                  </td>
                  <td style={s.td}>
                    {r.appliedOn ? new Date(r.appliedOn).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ ...s.td, whiteSpace: "nowrap" }}>
                    {r.fromDate ? new Date(r.fromDate).toLocaleDateString() : "—"}
                    {" — "}
                    {r.toDate   ? new Date(r.toDate).toLocaleDateString()   : "—"}
                  </td>
                  <td style={{ ...s.td, fontWeight: "600", color: C.primary }}>
                    {r.days}
                  </td>
                  <td style={s.td}>
                    <StatusPill status={r.status} />
                  </td>
                  <td style={{ ...s.td, color: C.muted }}>
                    {r.approvedBy || "—"}
                  </td>
                  <td style={s.td}>
                    <button
                      style={s.viewBtn}
                      onClick={() => onViewDetails(r)}
                    >
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

const s = {
  td: {
    padding: "12px 14px",
    borderBottom: `1px solid ${C.borderLight}`,
    color: C.text,
    fontSize: "13px",
  },
  viewBtn: {
    padding: "7px 16px", background: C.primary, color: "#fff",
    border: "none", borderRadius: RADIUS.button, fontSize: "13px",
    fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap",
  },
};