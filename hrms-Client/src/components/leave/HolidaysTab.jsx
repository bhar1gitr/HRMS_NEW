import React, { useState, useEffect } from "react";
import { C } from "../../theme";
import { apiUrl } from "../../URL";

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
  const token = localStorage.getItem("token");
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const userRole = localStorage.getItem("role") || "employee";

  const remaining = 2 - flexiSelected.length;

  // Fetch existing submissions
  useEffect(() => {
    if (userRole === 'hr' || userRole === 'admin') {
      fetchSubmissions();
    }
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/leaves/holiday-submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit selected flexi holidays
  const handleSubmitFlexi = async () => {
    if (flexiSelected.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one flexi holiday' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`${apiUrl}/api/leaves/submit-holidays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ flexiHolidays: flexiSelected })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Flexi holidays submitted successfully!' });
        if (userRole === 'hr' || userRole === 'admin') {
          fetchSubmissions();
        }
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.message || 'Failed to submit' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <SectionLabel>Company Holidays 2026</SectionLabel>
      
      {/* Stats */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "16px",
        flexWrap: "wrap"
      }}>
        <span style={s.statsPill}>
          Flexi Available: 2
        </span>
        <span style={{ ...s.statsPill, color: C.primary }}>
          Selected: {flexiSelected.length}
        </span>
        <span style={{
          ...s.statsPill,
          color: remaining > 0 ? "#085041" : "#dc2626",
          background: remaining > 0 ? "#e1f5ee" : "#fef2f2",
          border: `1px solid ${remaining > 0 ? "#a7d7c5" : "#fca5a5"}`
        }}>
          Remaining: {remaining}
        </span>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: "10px 16px",
          borderRadius: "6px",
          marginBottom: "16px",
          background: message.type === 'success' ? "#ecfdf5" : "#fef2f2",
          color: message.type === 'success' ? "#065f46" : "#b91c1c",
          border: `1px solid ${message.type === 'success' ? "#6ee7b7" : "#fca5a5"}`
        }}>
          {message.text}
        </div>
      )}

      {/* Fixed Holidays */}
      {FIXED_HOLIDAYS.map(h => (
        <div key={h.date} style={s.holidayRow}>
          <span style={s.hDate}>{h.date}</span>
          <span style={s.hName}>{h.name}</span>
          <span style={{ ...s.hPill, background: "#e8f4fa", color: "#0c447c" }}>Fixed</span>
        </div>
      ))}

      {/* Flexi Holidays */}
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

        {/* Submit Button */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginTop: "16px",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <button
            onClick={handleSubmitFlexi}
            disabled={submitting || flexiSelected.length === 0}
            style={{
              padding: "10px 28px",
              background: flexiSelected.length > 0 ? C.primary : C.muted,
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: flexiSelected.length > 0 ? "pointer" : "not-allowed",
              opacity: flexiSelected.length > 0 ? 1 : 0.5,
              transition: "all 0.2s ease",
            }}
          >
            {submitting ? "Submitting..." : "Submit Flexi Holidays"}
          </button>
          {flexiSelected.length > 0 && (
            <span style={{ fontSize: "13px", color: C.muted }}>
              You have selected {flexiSelected.length} of 2 holidays
            </span>
          )}
        </div>
      </div>

      {/* HR/Admin: View Submissions */}
      {(userRole === 'hr' || userRole === 'admin') && (
        <div style={{ marginTop: "32px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px"
          }}>
            <SectionLabel>Employee Flexi Submissions</SectionLabel>
            <button
              onClick={fetchSubmissions}
              style={{
                padding: "4px 12px",
                background: C.inputBg,
                border: `1px solid ${C.borderLight}`,
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {submissions.length === 0 ? (
            <div style={{
              padding: "40px 20px",
              textAlign: "center",
              color: C.muted,
              fontSize: "14px",
              background: C.inputBg,
              borderRadius: "6px",
              border: `1px solid ${C.borderLight}`
            }}>
              No flexi holiday submissions yet
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <Th>Employee</Th>
                    <Th>Selected Holiday</Th>
                    <Th>Submitted On</Th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, i) => (
                    <tr key={sub.id || i} style={i % 2 === 0 ? {} : { background: C.inputBg }}>
                      <Td>{sub.employeeName || sub.EmployeeId}</Td>
                      <Td>{sub.FlexiHoliday}</Td>
                      <Td style={{ color: C.muted }}>
                        {sub.SelectedDate ? new Date(sub.SelectedDate).toLocaleDateString() : '—'}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const Th = ({ children }) => (
  <th style={{
    textAlign: "left",
    padding: "8px 12px",
    background: C.inputBg,
    borderBottom: `2px solid ${C.borderLight}`,
    fontSize: "12px",
    fontWeight: "600",
    color: C.muted,
  }}>
    {children}
  </th>
);

const Td = ({ children, style }) => (
  <td style={{
    padding: "8px 12px",
    borderBottom: `1px solid ${C.borderLight}`,
    fontSize: "13px",
    color: C.text,
    ...style
  }}>
    {children}
  </td>
);

const s = {
  statsPill: {
    fontSize: "13px",
    fontWeight: "600",
    color: C.text,
    padding: "6px 14px",
    background: C.inputBg,
    borderRadius: "6px",
    border: `1px solid ${C.borderLight}`
  },
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
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px"
  }
};