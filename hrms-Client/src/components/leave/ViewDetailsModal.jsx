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

export default function ViewDetailsModal({ request, onClose }) {
  if (!request) return null;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalHead}>
          <h3 style={s.modalTitle}>Leave Request Details</h3>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          <div style={s.detailGrid}>
            <div><strong>Employee:</strong> {request.employeeName || "You"}</div>
            <div><strong>Leave Type:</strong> {LEAVE_TYPES.find(l => l.value === request.leaveType)?.label ?? request.leaveType}</div>
            <div><strong>From:</strong> {request.fromDate}</div>
            <div><strong>To:</strong> {request.toDate}</div>
            <div><strong>Days:</strong> {daysBetween(request.fromDate, request.toDate)}</div>
            <div><strong>Status:</strong> <StatusPill status={request.status} /></div>
          </div>
          <div style={s.detailSection}>
            <strong>Reason:</strong>
            <p style={{ margin: "4px 0 0", color: C.muted }}>{request.reason}</p>
          </div>
          {request.attachment && (
            <div style={s.detailSection}>
              <strong>Attachment:</strong>
              <p style={{ margin: "4px 0 0", color: C.primary, cursor: "pointer" }}>📎 {request.attachment}</p>
            </div>
          )}
          <div style={s.detailSection}>
            <strong>Approval History:</strong>
            <div style={{ marginTop: "4px" }}>
              <div style={{ fontSize: "13px", color: C.text, padding: "4px 0" }}>✓ Employee: Submitted</div>
              {request.managerApproved && (
                <div style={{ fontSize: "13px", color: "#085041", padding: "4px 0" }}>✓ Manager: Approved</div>
              )}
              {request.hrApproved && (
                <div style={{ fontSize: "13px", color: "#085041", padding: "4px 0" }}>✓ HR: Approved</div>
              )}
              {!request.managerApproved && request.status === "Pending" && (
                <div style={{ fontSize: "13px", color: "#92400e", padding: "4px 0" }}>⏳ Awaiting Approval</div>
              )}
            </div>
          </div>
        </div>
        <div style={s.modalFoot}>
          <button style={s.closeModalBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  modal: {
    background: C.card,
    width: "100%",
    maxWidth: "500px",
    borderRadius: "14px",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)"
  },
  modalHead: {
    padding: "16px 20px",
    borderBottom: `1px solid ${C.borderLight}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0
  },
  modalTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: C.text,
    margin: 0
  },
  modalBody: {
    padding: "20px",
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  modalFoot: {
    padding: "16px 20px",
    borderTop: `1px solid ${C.borderLight}`,
    display: "flex",
    justifyContent: "flex-end",
    flexShrink: 0
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: C.muted,
    cursor: "pointer",
    padding: "4px",
    '&:hover': { color: C.text }
  },
  closeModalBtn: {
    padding: "8px 20px",
    background: C.inputBg,
    border: `1px solid ${C.borderLight}`,
    borderRadius: "6px",
    color: C.text,
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    '&:hover': { background: C.borderLight }
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px 16px",
    fontSize: "13px",
    '& div': {
      padding: "4px 0"
    }
  },
  detailSection: {
    fontSize: "13px",
    '& strong': {
      display: "block",
      marginBottom: "4px",
      color: C.text
    }
  },
};