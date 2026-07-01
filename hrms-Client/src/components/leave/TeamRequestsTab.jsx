import React from "react";
import { C, RADIUS } from "../../theme";

const LEAVE_TYPE_LABELS = {
  Casual: "Casual Leave", Sick: "Sick Leave", Earned: "Earned Leave",
  Flexi: "Flexi Holiday", LWP: "Leave Without Pay", Maternity: "Maternity Leave",
};

const STATUS_STYLE = {
  Pending:           { bg: "#fffbeb", color: "#92400e" },
  Approved:          { bg: "#ecfdf5", color: "#065f46" },
  Rejected:          { bg: "#fef2f2", color: "#b91c1c" },
  "Forwarded to HR": { bg: "#eff6ff", color: "#1e40af" },
};

function StatusPill({ status }) {
  const st = STATUS_STYLE[status] ?? STATUS_STYLE.Pending;
  return (
    <span style={{
      display: "inline-block", padding: "4px 12px", borderRadius: "999px",
      fontSize: "12px", fontWeight: "600", background: st.bg, color: st.color,
    }}>
      {status}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: "12px", fontWeight: "700", color: C.primary,
      letterSpacing: "0.08em", textTransform: "uppercase",
      marginBottom: "14px", paddingBottom: "8px", borderBottom: `2px solid ${C.borderLight}`,
    }}>
      {children}
    </div>
  );
}

/**
 * Manager rules:
 *   canApprove (from backend) = Pending + ≤3 days + Casual/Sick/Earned/Flexi
 *   Everything else is view-only (Forwarded to HR, or >3 days)
 */
export default function TeamRequestsTab({ requests, onApprove, onReject, onViewDetails }) {
  return (
    <div>
      <SectionLabel>Team Leave Requests</SectionLabel>

      <div style={{
        fontSize: "13px", color: C.muted, marginBottom: "16px",
        padding: "10px 14px", background: C.inputBg,
        borderRadius: "6px", border: `1px solid ${C.borderLight}`,
      }}>
        You can <strong>approve</strong> Casual, Sick, Earned or Flexi leave of <strong>≤ 3 days</strong>.
        Requests over 3 days or Maternity/LWP are automatically sent to HR — they appear here as <strong>Forwarded to HR</strong> for your visibility only.
      </div>

      {requests.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: C.muted, fontSize: "14px" }}>
          No pending team requests.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <Th>Employee</Th>
                <Th>Leave Type</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Days</Th>
                <Th>Reason</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => {
                // Backend sends canApprove flag
                const canAct = r.canApprove;
                const isForwarded = r.status === "Forwarded to HR";

                return (
                  <tr key={r.id || i} style={i % 2 === 0 ? {} : { background: C.inputBg }}>
                    <Td><strong>{r.employeeName}</strong></Td>
                    <Td>{LEAVE_TYPE_LABELS[r.leaveType] ?? r.leaveType}</Td>
                    <Td>{r.fromDate ? new Date(r.fromDate).toLocaleDateString() : "—"}</Td>
                    <Td>{r.toDate   ? new Date(r.toDate).toLocaleDateString()   : "—"}</Td>
                    <Td><strong>{r.days}</strong></Td>
                    <Td style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.muted }}>
                      {r.reason || "—"}
                    </Td>
                    <Td>
                      {isForwarded ? (
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "#1e40af", background: "#eff6ff", padding: "3px 10px", borderRadius: "999px" }}>
                          Forwarded to HR
                        </span>
                      ) : (
                        <StatusPill status={r.status} />
                      )}
                    </Td>
                    <Td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {canAct && (
                          <>
                            <button style={s.approveBtn} onClick={() => onApprove(r.id)}>Approve</button>
                            <button style={s.rejectBtn}  onClick={() => onReject(r.id)}>Reject</button>
                          </>
                        )}
                        {!canAct && !isForwarded && (
                          <span style={{ fontSize: "11px", color: "#1e40af", background: "#eff6ff", padding: "3px 10px", borderRadius: "999px", fontWeight: "600" }}>
                            Requires HR
                          </span>
                        )}
                        <button style={s.viewBtn} onClick={() => onViewDetails(r)}>View</button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const Th = ({ children }) => (
  <th style={{
    textAlign: "left", padding: "10px 12px", background: C.inputBg,
    borderBottom: `2px solid ${C.borderLight}`, fontSize: "12px",
    fontWeight: "600", color: C.muted, whiteSpace: "nowrap",
  }}>
    {children}
  </th>
);
const Td = ({ children, style }) => (
  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.borderLight}`, fontSize: "13px", color: C.text, ...style }}>
    {children}
  </td>
);

const s = {
  table:      { width: "100%", borderCollapse: "collapse" },
  approveBtn: { padding: "5px 12px", background: "#ecfdf5", color: "#065f46", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  rejectBtn:  { padding: "5px 12px", background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  viewBtn:    { padding: "5px 12px", background: "#eff6ff", color: "#1e40af", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
};