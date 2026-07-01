import React from "react";
import { C } from "../../theme";

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
      display: "inline-block", padding: "4px 14px", borderRadius: "999px",
      fontSize: "12px", fontWeight: "600", background: st.bg, color: st.color,
    }}>
      {status}
    </span>
  );
}

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "4px 0" }}>
      <span style={{ fontSize: "11.5px", color: C.muted, fontWeight: "500" }}>{label}</span>
      <span style={{ fontSize: "13.5px", color: C.text, fontWeight: "600" }}>{value}</span>
    </div>
  );
}

export default function ViewDetailsModal({ request: r, onClose }) {
  if (!r) return null;

  const fromDate = r.fromDate ? new Date(r.fromDate).toLocaleDateString() : "—";
  const toDate   = r.toDate   ? new Date(r.toDate).toLocaleDateString()   : "—";
  const applied  = r.appliedOn ? new Date(r.appliedOn).toLocaleDateString() : "—";

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.head}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: C.text }}>Leave Request Details</div>
            {r.employeeName && (
              <div style={{ fontSize: "13px", color: C.muted, marginTop: "3px" }}>{r.employeeName}</div>
            )}
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div style={s.body}>
          {/* Status banner */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderRadius: "10px",
            background: STATUS_STYLE[r.status]?.bg ?? "#fffbeb",
            border: `1px solid ${C.borderLight}`,
          }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: C.text }}>Status</span>
            <StatusPill status={r.status} />
          </div>

          {/* Details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
            <Row label="Leave Type"  value={LEAVE_TYPE_LABELS[r.leaveType] ?? r.leaveType} />
            <Row label="Days"        value={r.days} />
            <Row label="From"        value={fromDate} />
            <Row label="To"          value={toDate} />
            <Row label="Day Type"    value={r.halfDay !== "Full" ? `${r.halfDay} half` : "Full day"} />
            <Row label="Applied On"  value={applied} />
            {r.employeeName && <Row label="Employee" value={r.employeeName} />}
            {r.approvedBy   && <Row label="Approved By" value={r.approvedBy} />}
          </div>

          {/* Reason */}
          {r.reason && (
            <div style={{ background: C.inputBg, borderRadius: "8px", padding: "14px", border: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: C.muted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Reason</div>
              <p style={{ margin: 0, fontSize: "13.5px", color: C.text, lineHeight: "1.6" }}>{r.reason}</p>
            </div>
          )}

          {/* Attachment */}
          {r.attachment && (
            <div style={{ background: C.inputBg, borderRadius: "8px", padding: "12px 14px", border: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>📎</span>
              <span style={{ fontSize: "13px", color: C.primary, fontWeight: "500" }}>
                {r.attachment}
              </span>
            </div>
          )}

          {/* Approval trail */}
          <div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: C.muted, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Approval Trail
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <TrailItem done label="Submitted by employee" />
              <TrailItem
                done={r.managerApproved}
                pending={!r.managerApproved && r.status === "Pending"}
                skipped={r.status === "Forwarded to HR"}
                label="Manager review"
                note={r.status === "Forwarded to HR" ? "Forwarded to HR (>3 days)" : undefined}
              />
              <TrailItem
                done={r.hrApproved}
                pending={["Forwarded to HR"].includes(r.status)}
                label="HR approval"
              />
              {r.status === "Approved" && <TrailItem done label="Approved ✓" />}
              {r.status === "Rejected" && (
                <TrailItem label="Rejected" style={{ color: "#b91c1c" }} />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={s.foot}>
          <button style={s.closeModalBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function TrailItem({ done, pending, skipped, label, note, style }) {
  const icon   = done    ? "✓" : pending ? "⏳" : skipped ? "→" : "○";
  const color  = done    ? "#065f46"
               : pending ? "#92400e"
               : skipped ? "#1e40af"
               : C.muted;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px" }}>
      <span style={{ fontWeight: "700", color, minWidth: "16px" }}>{icon}</span>
      <span style={{ color: done ? C.text : C.muted, ...style }}>
        {label}
        {note && <span style={{ fontSize: "12px", color: "#1e40af", marginLeft: "6px" }}>({note})</span>}
      </span>
    </div>
  );
}

const s = {
  overlay:      { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  modal:        { background: C.card, width: "100%", maxWidth: "520px", borderRadius: "14px", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.15)" },
  head:         { padding: "18px 20px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 },
  body:         { padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "18px" },
  foot:         { padding: "14px 20px", borderTop: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "flex-end", flexShrink: 0 },
  closeBtn:     { background: "none", border: "none", fontSize: "20px", color: C.muted, cursor: "pointer", padding: "2px 6px" },
  closeModalBtn:{ padding: "9px 22px", background: C.inputBg, border: `1px solid ${C.borderLight}`, borderRadius: "8px", color: C.text, cursor: "pointer", fontSize: "13px", fontWeight: "500" },
};