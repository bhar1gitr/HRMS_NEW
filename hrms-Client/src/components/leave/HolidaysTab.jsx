import React from "react";
import { C } from "../../theme";

const FIXED_HOLIDAYS = [
  { date: "26 Jan", name: "Republic Day" },
  { date: "14 Apr", name: "Dr. Ambedkar Jayanti" },
  { date: "01 May", name: "Maharashtra Day" },
  { date: "15 Aug", name: "Independence Day" },
  { date: "02 Oct", name: "Gandhi Jayanti" },
  { date: "25 Oct", name: "Dussehra" },
  { date: "12 Nov", name: "Diwali" },
  { date: "25 Dec", name: "Christmas" },
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

export default function HolidaysTab({ flexiSelected, onFlexiToggle }) {
  const remaining = 2 - flexiSelected.length;

  return (
    <div>
      <SectionLabel>Company Holidays 2026</SectionLabel>
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "16px",
        flexWrap: "wrap"
      }}>
        <span style={{
          fontSize: "13px",
          fontWeight: "600",
          color: C.text,
          padding: "6px 14px",
          background: C.inputBg,
          borderRadius: "6px",
          border: `1px solid ${C.borderLight}`
        }}>
          Flexi Available: 2
        </span>
        <span style={{
          fontSize: "13px",
          fontWeight: "600",
          color: C.primary,
          padding: "6px 14px",
          background: C.inputBg,
          borderRadius: "6px",
          border: `1px solid ${C.borderLight}`
        }}>
          Selected: {flexiSelected.length}
        </span>
        <span style={{
          fontSize: "13px",
          fontWeight: "600",
          color: remaining > 0 ? "#085041" : "#dc2626",
          padding: "6px 14px",
          background: remaining > 0 ? "#e1f5ee" : "#fef2f2",
          borderRadius: "6px",
          border: `1px solid ${remaining > 0 ? "#a7d7c5" : "#fca5a5"}`
        }}>
          Remaining: {remaining}
        </span>
      </div>

      {FIXED_HOLIDAYS.map(h => (
        <div key={h.date} style={s.holidayRow}>
          <span style={s.hDate}>{h.date}</span>
          <span style={s.hName}>{h.name}</span>
          <span style={{ ...s.hPill, background: "#e8f4fa", color: "#0c447c" }}>Fixed</span>
        </div>
      ))}

      <div style={{ marginTop: "28px" }}>
        <SectionLabel>Flexi Holidays — Pick Any 2</SectionLabel>
        {FLEXI_OPTIONS.map(opt => {
          const checked = flexiSelected.includes(opt);
          const disabled = !checked && flexiSelected.length >= 2;
          return (
            <div key={opt} style={s.holidayRow}>
              <span style={s.hDate}>{opt.split(" — ")[0]}</span>
              <span style={{ ...s.hName, color: disabled ? C.muted : C.text }}>
                {opt.split(" — ")[1]}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ ...s.hPill, background: "#faeeda", color: "#633806" }}>Flexi</span>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onFlexiToggle(opt)}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    accentColor: C.primary
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  holidayRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 0",
    borderBottom: `1px solid ${C.borderLight}`
  },
  hDate: {
    fontSize: "13px",
    color: C.muted,
    minWidth: "60px",
    fontWeight: "500"
  },
  hName: {
    fontSize: "14px",
    fontWeight: "500",
    color: C.text,
    flex: 1
  },
  hPill: {
    fontSize: "11px",
    padding: "3px 10px",
    borderRadius: "999px",
    fontWeight: "500"
  },
};