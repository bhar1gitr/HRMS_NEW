import React from "react";
import { C, RADIUS } from "../../theme";

const LEAVE_TYPES = [
  { value: "Casual", label: "Casual Leave", total: 7 },
  { value: "Sick", label: "Sick Leave", total: 7 },
  { value: "Earned", label: "Earned Leave", total: 14 },
  { value: "Flexi", label: "Flexi Holiday", total: 2 },
  { value: "LWP", label: "Leave Without Pay", total: null },
  { value: "Maternity", label: "Maternity Leave", total: 180 },
];

const FLEXI_OPTIONS = [
  "26 Jan 2026 — Republic Day",
  "25 Mar 2026 — Holi",
  "10 Apr 2026 — Good Friday",
  "14 Apr 2026 — Ambedkar Jayanti",
  "07 Nov 2026 — Guru Nanak Jayanti",
  "25 Dec 2026 — Christmas",
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

export default function LeavePoliciesTab() {
  return (
    <div>
      <SectionLabel>Leave Policies</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={s.policyCard}>
          <h3 style={s.policyTitle}>Leave Allocation</h3>
          <div style={s.policyGrid}>
            {LEAVE_TYPES.map(lt => (
              <div key={lt.value} style={s.policyItem}>
                <label style={s.label}>{lt.label}</label>
                <input
                  type="number"
                  style={s.input}
                  defaultValue={lt.total || 0}
                  placeholder={lt.total ? lt.total.toString() : "Unlimited"}
                />
              </div>
            ))}
          </div>
          <button style={s.saveBtn}>Save Allocation</button>
        </div>

        <div style={s.policyCard}>
          <h3 style={s.policyTitle}>Carry Forward</h3>
          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <input type="checkbox" defaultChecked /> Allow carry forward
            </label>
            <div style={s.field}>
              <label style={s.label}>Max carry forward days</label>
              <input type="number" style={{ ...s.input, width: "120px" }} defaultValue="5" />
            </div>
            <button style={s.saveBtn}>Save</button>
          </div>
        </div>

        <div style={s.policyCard}>
          <h3 style={s.policyTitle}>Flexi Holidays</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {FLEXI_OPTIONS.map(opt => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked /> {opt}
              </label>
            ))}
          </div>
          <button style={{ ...s.saveBtn, marginTop: "12px" }}>Update Flexi Holidays</button>
        </div>

        <div style={s.policyCard}>
          <h3 style={s.policyTitle}>Approval Hierarchy</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontWeight: "600", minWidth: "80px" }}>≤ 3 days</span>
              <span>Employee → Manager</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontWeight: "600", minWidth: "80px" }}>&gt; 3 days</span>
              <span>Employee → Manager → HR</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontWeight: "600", minWidth: "80px" }}>Manager</span>
              <span>Manager → HR</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontWeight: "600", minWidth: "80px" }}>HR</span>
              <span>HR → Admin</span>
            </div>
          </div>
          <button style={{ ...s.saveBtn, marginTop: "12px" }}>Update Hierarchy</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  policyCard: {
    background: C.inputBg,
    border: `1px solid ${C.borderLight}`,
    borderRadius: RADIUS.card,
    padding: "20px"
  },
  policyTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: C.text,
    margin: "0 0 12px 0"
  },
  policyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "12px"
  },
  policyItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: C.text
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: `1.5px solid ${C.borderLight}`,
    borderRadius: "6px",
    fontSize: "13px",
    background: C.inputBg,
    color: C.text,
    outline: "none",
    transition: "all 0.2s ease",
    '&:focus': { borderColor: C.primary }
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  saveBtn: {
    padding: "8px 20px",
    background: C.primary,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    '&:hover': { opacity: 0.9 }
  },
};