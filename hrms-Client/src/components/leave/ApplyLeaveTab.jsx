import React, { useState, useMemo } from "react";
import { C, RADIUS } from "../../theme";

const ALL_LEAVE_TYPES = [
  { value: "Casual",    label: "Casual Leave",       color: "#0c447c", total: 7   },
  { value: "Sick",      label: "Sick Leave",          color: "#993556", total: 7   },
  { value: "Earned",    label: "Earned Leave",        color: "#085041", total: 14  },
  { value: "Flexi",     label: "Flexi Holiday",       color: "#633806", total: 2   },
  { value: "LWP",       label: "Leave Without Pay",   color: "#5f5e5a", total: null},
  { value: "Maternity", label: "Maternity Leave",     color: "#72243e", total: 180 },
];

const FLEXI_OPTIONS = [
  "26 Jan 2026 — Republic Day",
  "25 Mar 2026 — Holi",
  "10 Apr 2026 — Good Friday",
  "14 Apr 2026 — Ambedkar Jayanti",
  "07 Nov 2026 — Guru Nanak Jayanti",
  "25 Dec 2026 — Christmas",
];

function daysBetween(from, to) {
  if (!from || !to) return 0;
  const d1 = new Date(from), d2 = new Date(to);
  if (d2 < d1) return 0;
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
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

function InfoBox({ type = "info", children }) {
  const map = {
    info:  { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", icon: "ℹ" },
    warn:  { bg: "#fffbeb", color: "#92400e", border: "#fcd34d", icon: "⚠" },
    error: { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5", icon: "✕" },
  };
  const st = map[type];
  return (
    <div style={{
      display: "flex", gap: "12px", padding: "12px 16px",
      borderRadius: RADIUS.input, background: st.bg,
      border: `1px solid ${st.border}`, color: st.color,
      fontSize: "13px", marginBottom: "16px", alignItems: "flex-start",
    }}>
      <span style={{ fontSize: "15px", flexShrink: 0, fontWeight: "700" }}>{st.icon}</span>
      <span style={{ lineHeight: "1.5" }}>{children}</span>
    </div>
  );
}

function ApprovalWorkflow({ days, leaveType }) {
  const goesHR = days > 3 || ["Maternity", "LWP"].includes(leaveType);
  const steps  = goesHR ? ["You", "HR"] : ["You", "Manager"];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "12px 16px", background: C.inputBg,
      borderRadius: RADIUS.input, border: `1px solid ${C.borderLight}`,
      marginBottom: "16px", flexWrap: "wrap",
    }}>
      <span style={{ fontSize: "13px", fontWeight: "600", color: C.text, marginRight: "4px" }}>
        Approval path:
      </span>
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <span style={{
            padding: "4px 12px", borderRadius: "6px",
            background: C.card, border: `1px solid ${C.borderLight}`,
            fontSize: "12px", fontWeight: "500", color: C.text,
          }}>
            {step}
          </span>
          {i < steps.length - 1 && <span style={{ color: C.muted }}>→</span>}
        </React.Fragment>
      ))}
      {goesHR && (
        <span style={{ fontSize: "12px", color: "#92400e", marginLeft: "4px" }}>
          (forwarded directly to HR)
        </span>
      )}
    </div>
  );
}

const Required = () => <span style={{ color: "#dc2626" }}>*</span>;
const ErrMsg   = ({ children }) => (
  <span style={{ fontSize: "12px", color: "#dc2626", marginTop: "2px" }}>{children}</span>
);

/**
 * Props:
 *   onSubmit  — (form) => void
 *   gender    — "male" | "female"
 *   balances  — { Casual, Sick, Earned, Flexi, Maternity? } — integer values from backend
 */
export default function ApplyLeaveTab({ onSubmit, gender, balances = {} }) {
  const isFemale = gender?.toLowerCase() === "female";

  // Build the list of available leave types for this employee,
  // disabling types with 0 balance (except LWP and Maternity which have no cap)
  const leaveTypes = useMemo(() => {
    return ALL_LEAVE_TYPES
      .filter(lt => {
        if (lt.value === "Maternity") return isFemale;
        return true; // show all others
      })
      .map(lt => {
        const bal = Math.floor(Number(balances[lt.value] ?? 0));
        // Disable if balance is 0 and it's a limited-leave type
        const disabled =
          lt.total !== null &&
          lt.value !== "LWP" &&
          lt.value !== "Maternity" &&
          bal <= 0;
        return { ...lt, balance: bal, disabled };
      });
  }, [isFemale, balances]);

  const [form, setForm] = useState({
    leaveType: "", halfDay: "Full",
    fromDate: "", toDate: "",
    reason: "", attachment: null,
    flexiSelected: "",
    emergencyContact: "", contactNumber: "",
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: undefined }));
  };

  const days       = form.halfDay !== "Full" ? 0.5 : daysBetween(form.fromDate, form.toDate);
  const isSickLong = form.leaveType === "Sick" && days > 2;
  const needsDoc   = isSickLong;

  const validate = () => {
    const e = {};
    if (!form.leaveType)  e.leaveType = "Select a leave type";
    if (!form.fromDate)   e.fromDate  = "Required";
    if (!form.toDate)     e.toDate    = "Required";
    if (form.fromDate && form.toDate && new Date(form.toDate) < new Date(form.fromDate))
                          e.toDate    = "Must be after from date";
    if (!form.reason.trim()) e.reason = "Reason is required";
    if (form.leaveType === "Flexi" && !form.flexiSelected)
                          e.flexiSelected = "Select a flexi holiday";
    if (needsDoc && !form.attachment)
                          e.attachment = "Doctor's prescription required";

    // Balance check
    if (form.leaveType && days > 0) {
      const lt = leaveTypes.find(l => l.value === form.leaveType);
      if (lt && lt.total !== null && lt.value !== "Maternity") {
        if (Math.floor(Number(balances[form.leaveType] || 0)) < days) {
          e.leaveType = `Insufficient balance. Available: ${Math.floor(Number(balances[form.leaveType] || 0))} days`;
        }
      }
    }

    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(form);
  };

  const selectedType = leaveTypes.find(l => l.value === form.leaveType);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <SectionLabel>Apply for Leave</SectionLabel>

      {/* Leave type selector */}
      <div style={{ ...s.field, marginBottom: "16px" }}>
        <label style={s.label}>Leave Type <Required /></label>
        <select
          style={{ ...s.input, borderColor: errors.leaveType ? "#dc2626" : undefined }}
          value={form.leaveType}
          onChange={e => set("leaveType", e.target.value)}
        >
          <option value="">Select leave type…</option>
          {leaveTypes.map(lt => (
            <option key={lt.value} value={lt.value} disabled={lt.disabled}>
              {lt.label}
              {lt.total !== null && lt.value !== "Maternity"
                ? ` (${lt.balance} days left)`
                : lt.value === "LWP" ? " (no limit)" : ""}
              {lt.disabled ? " — no balance" : ""}
            </option>
          ))}
        </select>
        {errors.leaveType && <ErrMsg>{errors.leaveType}</ErrMsg>}
      </div>

      {/* Dates + half day */}
      <div style={s.grid3}>
        <div style={s.field}>
          <label style={s.label}>From Date <Required /></label>
          <input
            type="date"
            style={{ ...s.input, borderColor: errors.fromDate ? "#dc2626" : undefined }}
            value={form.fromDate}
            onChange={e => set("fromDate", e.target.value)}
          />
          {errors.fromDate && <ErrMsg>{errors.fromDate}</ErrMsg>}
        </div>
        <div style={s.field}>
          <label style={s.label}>To Date <Required /></label>
          <input
            type="date"
            style={{ ...s.input, borderColor: errors.toDate ? "#dc2626" : undefined }}
            value={form.toDate}
            onChange={e => set("toDate", e.target.value)}
          />
          {errors.toDate && <ErrMsg>{errors.toDate}</ErrMsg>}
        </div>
        <div style={s.field}>
          <label style={s.label}>Day Type</label>
          <select style={s.input} value={form.halfDay} onChange={e => set("halfDay", e.target.value)}>
            <option value="Full">Full Day</option>
            <option value="First">First Half</option>
            <option value="Second">Second Half</option>
          </select>
        </div>
      </div>

      {/* Summary + approval path */}
      {days > 0 && form.leaveType && (
        <>
          <InfoBox type="info">
            <strong>{days} day{days !== 1 ? "s" : ""}</strong> — {selectedType?.label || form.leaveType}
            {selectedType?.total !== null && selectedType?.value !== "Maternity" && (
              <span style={{ marginLeft: "8px", opacity: 0.8 }}>
                (Balance after: {Math.max(0, Math.floor(Number(balances[form.leaveType] || 0)) - days)} days)
              </span>
            )}
          </InfoBox>
          <ApprovalWorkflow days={days} leaveType={form.leaveType} />
        </>
      )}

      {/* Type-specific notices */}
      {isSickLong && (
        <InfoBox type="warn">
          Sick leave exceeding 2 days requires a doctor's prescription. Please upload it below.
        </InfoBox>
      )}
      {form.leaveType === "Maternity" && (
        <InfoBox type="info">
          Maternity leave is 180 days. HR will contact you to confirm your expected delivery date.
        </InfoBox>
      )}
      {form.leaveType === "LWP" && (
        <InfoBox type="warn">
          Leave Without Pay is only approved when all other leave balances are exhausted.
        </InfoBox>
      )}

      {/* Flexi holiday picker */}
      {form.leaveType === "Flexi" && (
        <div style={{ marginBottom: "20px" }}>
          <SectionLabel>Select Flexi Holiday</SectionLabel>
          {errors.flexiSelected && <ErrMsg>{errors.flexiSelected}</ErrMsg>}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            {FLEXI_OPTIONS.map(opt => (
              <label key={opt} style={{
                display: "flex", alignItems: "center", gap: "12px",
                fontSize: "13px", cursor: "pointer", padding: "10px 14px",
                border: `1.5px solid ${form.flexiSelected === opt ? C.primary : C.borderLight}`,
                borderRadius: RADIUS.input,
                background: form.flexiSelected === opt ? C.inputBg : C.card,
              }}>
                <input
                  type="radio" name="flexi" value={opt}
                  checked={form.flexiSelected === opt}
                  onChange={() => set("flexiSelected", opt)}
                  style={{ flexShrink: 0, width: "16px", height: "16px" }}
                />
                <span style={{ flex: 1 }}>{opt}</span>
                {form.flexiSelected === opt && (
                  <span style={{ color: C.primary, fontWeight: "600", fontSize: "12px" }}>✓ Selected</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Emergency contact */}
      <div style={s.grid2}>
        <div style={s.field}>
          <label style={s.label}>Emergency Contact</label>
          <input
            type="text" style={s.input} placeholder="Name"
            value={form.emergencyContact}
            onChange={e => set("emergencyContact", e.target.value)}
          />
        </div>
        <div style={s.field}>
          <label style={s.label}>Contact Number</label>
          <input
            type="tel" style={s.input} placeholder="Phone number"
            value={form.contactNumber}
            onChange={e => set("contactNumber", e.target.value)}
          />
        </div>
      </div>

      {/* Reason */}
      <div style={{ ...s.field, marginBottom: "16px" }}>
        <label style={s.label}>Reason <Required /></label>
        <textarea
          rows={3}
          style={{ ...s.textarea, borderColor: errors.reason ? "#dc2626" : undefined }}
          placeholder="Briefly describe the reason for your leave…"
          value={form.reason}
          onChange={e => set("reason", e.target.value)}
        />
        {errors.reason && <ErrMsg>{errors.reason}</ErrMsg>}
      </div>

      {/* Doctor prescription — only for sick >2 days */}
      {needsDoc && (
        <div style={{ ...s.field, marginBottom: "20px" }}>
          <label style={s.label}>Doctor's Prescription <Required /></label>
          <input
            type="file" style={s.input}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => set("attachment", e.target.files[0] || null)}
          />
          {errors.attachment && <ErrMsg>{errors.attachment}</ErrMsg>}
          {form.attachment && (
            <div style={{
              marginTop: "8px", fontSize: "13px", display: "flex", alignItems: "center",
              gap: "10px", padding: "10px 14px", background: C.inputBg,
              borderRadius: RADIUS.input, border: `1px solid ${C.borderLight}`,
            }}>
              <span style={{ fontWeight: "500" }}>📎 {form.attachment.name}</span>
              <span
                style={{ color: "#dc2626", cursor: "pointer", marginLeft: "auto", fontWeight: "600", fontSize: "12px" }}
                onClick={() => set("attachment", null)}
              >
                Remove
              </span>
            </div>
          )}
        </div>
      )}

      <button type="submit" style={s.submitBtn}>Submit Application</button>
    </form>
  );
}

const s = {
  grid2:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  grid3:     { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" },
  field:     { display: "flex", flexDirection: "column", gap: "6px" },
  label:     { fontSize: "13px", fontWeight: "600", color: C.text },
  input:     { width: "100%", padding: "10px 14px", border: `1.5px solid ${C.borderLight}`, borderRadius: RADIUS.input, fontSize: "14px", background: C.inputBg, color: C.text, outline: "none", boxSizing: "border-box" },
  textarea:  { width: "100%", padding: "10px 14px", border: `1.5px solid ${C.borderLight}`, borderRadius: RADIUS.input, fontSize: "14px", background: C.inputBg, color: C.text, outline: "none", resize: "vertical", fontFamily: "inherit", minHeight: "80px", boxSizing: "border-box" },
  submitBtn: { marginTop: "8px", padding: "12px 32px", background: C.accent, color: "#fff", border: "none", borderRadius: RADIUS.button, fontSize: "14px", fontWeight: "600", cursor: "pointer" },
};