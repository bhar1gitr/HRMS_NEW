import React, { useState } from "react";
import { C, RADIUS } from "../../theme";

const LEAVE_TYPES = [
  { value: "Casual", label: "Casual Leave", total: 7, color: "#0c447c", bg: "#e8f4fa" },
  { value: "Sick", label: "Sick Leave", total: 7, color: "#993556", bg: "#fde8ef" },
  { value: "Earned", label: "Earned Leave", total: 14, color: "#085041", bg: "#e1f5ee" },
  { value: "Flexi", label: "Flexi Holiday", total: 2, color: "#633806", bg: "#faeeda" },
  { value: "LWP", label: "Leave Without Pay", total: null, color: "#5f5e5a", bg: "#f1efe8" },
  { value: "Maternity", label: "Maternity Leave", total: 180, color: "#72243e", bg: "#fbeaf0" },
];

const FLEXI_OPTIONS = [
  "26 Jan 2026 — Republic Day",
  "25 Mar 2026 — Holi",
  "10 Apr 2026 — Good Friday",
  "14 Apr 2026 — Ambedkar Jayanti",
  "07 Nov 2026 — Guru Nanak Jayanti",
  "25 Dec 2026 — Christmas",
];

const EMPLOYEES = [
  "Rahul Sharma",
  "Amit Kumar",
  "Priya Singh",
  "Sneha Patel",
  "Vikram Reddy",
];

function daysBetween(from, to) {
  if (!from || !to) return 0;
  const d1 = new Date(from), d2 = new Date(to);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
}

function getApprovalWorkflow(days) {
  if (days <= 3) {
    return ["Employee", "Manager"];
  }
  return ["Employee", "Manager", "HR"];
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

function InfoBox({ type = "info", children }) {
  const map = {
    info: { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
    warn: { bg: "#fffbeb", color: "#92400e", border: "#fcd34d" },
    error: { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5" },
  };
  const style = map[type];
  return (
    <div style={{
      display: "flex",
      gap: "12px",
      padding: "12px 16px",
      borderRadius: RADIUS.input,
      background: style.bg,
      border: `1px solid ${style.border}`,
      color: style.color,
      fontSize: "13px",
      marginBottom: "16px",
      alignItems: "flex-start"
    }}>
      <span style={{ fontSize: "16px", flexShrink: 0, fontWeight: "700" }}>
        {type === "info" && "ℹ"}
        {type === "warn" && "⚠"}
        {type === "error" && "✕"}
      </span>
      <span style={{ lineHeight: "1.5" }}>{children}</span>
    </div>
  );
}

function ApprovalWorkflow({ days }) {
  const workflow = getApprovalWorkflow(days);
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 16px",
      background: C.inputBg,
      borderRadius: RADIUS.input,
      border: `1px solid ${C.borderLight}`,
      marginBottom: "16px",
      flexWrap: "wrap"
    }}>
      <span style={{ fontSize: "13px", fontWeight: "600", color: C.text, marginRight: "4px" }}>Approval Workflow:</span>
      {workflow.map((step, index) => (
        <React.Fragment key={step}>
          <span style={{
            padding: "4px 12px",
            borderRadius: "6px",
            background: C.card,
            border: `1px solid ${C.borderLight}`,
            fontSize: "12px",
            fontWeight: "500",
            color: C.text
          }}>
            {step}
          </span>
          {index < workflow.length - 1 && (
            <span style={{ color: C.muted, fontSize: "14px" }}>→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ApplyLeaveTab({ onSubmit }) {
  const [form, setForm] = useState({
    leaveType: "",
    halfDay: "Full",
    fromDate: "",
    toDate: "",
    reason: "",
    attachment: null,
    flexiSelected: "",
    emergencyContact: "",
    contactNumber: "",
    handoverTo: "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const days = daysBetween(form.fromDate, form.toDate);
  const isSickLong = form.leaveType === "Sick" && days > 2;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.leaveType || !form.fromDate || !form.toDate || !form.reason) {
      alert("Please fill all required fields.");
      return;
    }
    if (form.leaveType === "Flexi" && !form.flexiSelected) {
      alert("Please select a flexi holiday.");
      return;
    }
    if (isSickLong && !form.attachment) {
      alert("Doctor's prescription is required for sick leave exceeding 2 days.");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <SectionLabel>Apply for Leave</SectionLabel>

      <div style={s.grid2}>
        <div style={s.field}>
          <label style={s.label}>Leave Type <span style={{ color: "#dc2626" }}>*</span></label>
          <select style={s.input} value={form.leaveType} onChange={e => set("leaveType", e.target.value)} required>
            <option value="">Select type</option>
            {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Half Day</label>
          <select style={s.input} value={form.halfDay} onChange={e => set("halfDay", e.target.value)}>
            <option value="Full">Full Day</option>
            <option value="First">First Half</option>
            <option value="Second">Second Half</option>
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>From Date <span style={{ color: "#dc2626" }}>*</span></label>
          <input type="date" style={s.input} value={form.fromDate} onChange={e => set("fromDate", e.target.value)} required />
        </div>
        <div style={s.field}>
          <label style={s.label}>To Date <span style={{ color: "#dc2626" }}>*</span></label>
          <input type="date" style={s.input} value={form.toDate} onChange={e => set("toDate", e.target.value)} required />
        </div>
      </div>

      {days > 0 && (
        <>
          <InfoBox type="info">
            <strong>{days} day{days > 1 ? "s" : ""}</strong> selected.
          </InfoBox>
          <ApprovalWorkflow days={days} />
        </>
      )}

      {isSickLong && (
        <InfoBox type="warn">
          Sick leave exceeding 2 days requires a doctor's prescription. Please upload it below.
        </InfoBox>
      )}

      {form.leaveType === "Flexi" && (
        <div style={{ marginBottom: "16px" }}>
          <SectionLabel>Select Flexi Holiday</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {FLEXI_OPTIONS.map(opt => (
              <label key={opt} style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "13px",
                cursor: "pointer",
                padding: "10px 14px",
                border: `1.5px solid ${form.flexiSelected === opt ? C.primary : C.borderLight}`,
                borderRadius: RADIUS.input,
                background: form.flexiSelected === opt ? C.inputBg : C.card,
                transition: "all 0.2s ease"
              }}>
                <input
                  type="radio" name="flexi" value={opt}
                  checked={form.flexiSelected === opt}
                  onChange={() => set("flexiSelected", opt)}
                  style={{ flexShrink: 0, width: "16px", height: "16px" }}
                />
                <span style={{ flex: 1 }}>{opt}</span>
                {form.flexiSelected === opt && (
                  <span style={{ color: C.primary, fontWeight: "600" }}>Selected</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {form.leaveType === "Maternity" && (
        <InfoBox type="info">
          Maternity leave is 180 days. Please ensure your expected delivery date is shared with HR separately.
        </InfoBox>
      )}

      {form.leaveType === "LWP" && (
        <InfoBox type="warn">
          Leave without pay will only be approved if all other leave balances are exhausted.
        </InfoBox>
      )}

      <div style={s.grid2}>
        <div style={s.field}>
          <label style={s.label}>Emergency Contact</label>
          <input
            type="text"
            style={s.input}
            placeholder="Name"
            value={form.emergencyContact}
            onChange={e => set("emergencyContact", e.target.value)}
          />
        </div>
        <div style={s.field}>
          <label style={s.label}>Contact Number</label>
          <input
            type="tel"
            style={s.input}
            placeholder="Phone number"
            value={form.contactNumber}
            onChange={e => set("contactNumber", e.target.value)}
          />
        </div>
      </div>

      <div style={s.field}>
        <label style={s.label}>Handover To</label>
        <select
          style={s.input}
          value={form.handoverTo}
          onChange={e => set("handoverTo", e.target.value)}
        >
          <option value="">Select employee</option>
          {EMPLOYEES.map(emp => (
            <option key={emp} value={emp}>{emp}</option>
          ))}
        </select>
      </div>

      <div style={{ ...s.field, marginBottom: "16px" }}>
        <label style={s.label}>Reason <span style={{ color: "#dc2626" }}>*</span></label>
        <textarea
          rows={3}
          style={s.textarea}
          placeholder="Briefly describe the reason for your leave…"
          value={form.reason}
          onChange={e => set("reason", e.target.value)}
          required
        />
      </div>

      {isSickLong && (
        <div style={{ ...s.field, marginBottom: "16px" }}>
          <label style={s.label}>Doctor's Prescription <span style={{ color: "#dc2626" }}>*</span></label>
          <input
            type="file"
            style={s.input}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => set("attachment", e.target.files[0] || null)}
          />
          {form.attachment && (
            <div style={{
              marginTop: "8px",
              fontSize: "13px",
              color: C.text,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              background: C.inputBg,
              borderRadius: RADIUS.input,
              border: `1px solid ${C.borderLight}`
            }}>
              <span style={{ fontWeight: "500" }}>📎 {form.attachment.name}</span>
              <span style={{
                color: "#dc2626",
                cursor: "pointer",
                marginLeft: "auto",
                fontWeight: "600",
                fontSize: "12px"
              }} onClick={() => set("attachment", null)}>Remove</span>
            </div>
          )}
        </div>
      )}

      <button type="submit" style={s.submitBtn}>Submit Application</button>
    </form>
  );
}

const s = {
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px"
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: C.text
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${C.borderLight}`,
    borderRadius: RADIUS.input,
    fontSize: "14px",
    background: C.inputBg,
    color: C.text,
    outline: "none",
    transition: "all 0.2s ease",
    '&:focus': { borderColor: C.primary }
  },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${C.borderLight}`,
    borderRadius: RADIUS.input,
    fontSize: "14px",
    background: C.inputBg,
    color: C.text,
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
    '&:focus': { borderColor: C.primary }
  },
  submitBtn: {
    marginTop: "20px",
    padding: "12px 32px",
    background: C.accent,
    color: "#fff",
    border: "none",
    borderRadius: RADIUS.button,
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    '&:hover': { opacity: 0.9 }
  },
};