import React, { useState, useEffect } from "react";
import { C, RADIUS } from "../../theme";
import { apiUrl } from "../../URL";

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

function StatusPill({ status }) {
  const colors = {
    Approved: { bg: "#ecfdf5", color: "#065f46" },
    Pending: { bg: "#fffbeb", color: "#92400e" },
    "Forwarded to HR": { bg: "#eff6ff", color: "#1e40af" },
  };
  const st = colors[status] || colors.Pending;
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: "999px",
      fontSize: "10px", fontWeight: "600", background: st.bg, color: st.color,
    }}>
      {status}
    </span>
  );
}

const LEAVE_TYPE_COLORS = {
  Casual: "#0c447c",
  Sick: "#993556",
  Earned: "#085041",
  Flexi: "#633806",
  LWP: "#5f5e5a",
  Maternity: "#72243e",
};

export default function LeaveCalendarTab({ year: propYear }) {
  const token = localStorage.getItem("token");
  const today = new Date();
  const [year, setYear] = useState(propYear || today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendar();
  }, [year, month]);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${apiUrl}/api/leaves/calendar?year=${year}&month=${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) setCalendar(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  // Find days with leaves
  const leaveDays = {};
  calendar.forEach(day => {
    if (day.leaves.length > 0) {
      const dayNum = new Date(day.date).getDate();
      leaveDays[dayNum] = day.leaves;
    }
  });

  // Get month total
  const totalLeaves = calendar.reduce((sum, day) => sum + day.leaves.length, 0);

  return (
    <div>

      {/* Controls */}
      <div style={{
        display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px",
        flexWrap: "wrap"
      }}>
        <select
          style={s.select}
          value={year}
          onChange={e => setYear(Number(e.target.value))}
        >
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          style={s.select}
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
        >
          {monthNames.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
        <span style={{
          padding: "4px 14px", background: C.inputBg,
          borderRadius: RADIUS.input, fontSize: "13px", color: C.text
        }}>
          {totalLeaves} leave{totalLeaves !== 1 ? "s" : ""} this month
        </span>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
      ) : (
        <div style={s.calendar}>
          {/* Header */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} style={s.cellHeader}>{day}</div>
          ))}

          {/* Empty days before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={s.emptyCell} />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const leaves = leaveDays[dayNum] || [];
            const date = new Date(year, month - 1, dayNum);
            const isToday = date.toDateString() === new Date().toDateString();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div key={dayNum} style={{
                ...s.dayCell,
                background: isToday ? C.primary + "15" : isWeekend ? C.bg : C.card,
                borderColor: isToday ? C.primary : C.borderLight,
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: "4px"
                }}>
                  <span style={{
                    fontSize: "14px", fontWeight: isToday ? "700" : "500",
                    color: isToday ? C.primary : C.text
                  }}>
                    {dayNum}
                  </span>
                  {leaves.length > 0 && (
                    <span style={{
                      fontSize: "11px", background: C.primary + "20",
                      padding: "1px 8px", borderRadius: "999px", color: C.primary
                    }}>
                      {leaves.length}
                    </span>
                  )}
                </div>
                {leaves.slice(0, 3).map((leave, idx) => (
                  <div key={idx} style={{
                    fontSize: "10px", padding: "2px 6px",
                    borderRadius: "4px", marginTop: "2px",
                    background: LEAVE_TYPE_COLORS[leave.leaveType] + "20",
                    borderLeft: `2px solid ${LEAVE_TYPE_COLORS[leave.leaveType]}`,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>
                    {leave.employeeName} ({leave.leaveType})
                    <StatusPill status={leave.status} />
                  </div>
                ))}
                {leaves.length > 3 && (
                  <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>
                    +{leaves.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: "flex", gap: "16px", marginTop: "16px",
        flexWrap: "wrap", padding: "12px 16px",
        background: C.inputBg, borderRadius: RADIUS.input,
        border: `1px solid ${C.borderLight}`
      }}>
        <span style={{ fontSize: "12px", fontWeight: "600", color: C.muted }}>Legend:</span>
        {Object.entries(LEAVE_TYPE_COLORS).map(([type, color]) => (
          <span key={type} style={{
            fontSize: "12px", display: "flex", alignItems: "center", gap: "6px"
          }}>
            <span style={{
              display: "inline-block", width: "12px", height: "12px",
              borderRadius: "3px", background: color
            }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}

const s = {
  select: {
    padding: "8px 12px",
    border: `1.5px solid ${C.borderLight}`,
    borderRadius: RADIUS.input,
    fontSize: "13px",
    background: C.card,
    color: C.text,
    outline: "none",
    cursor: "pointer",
  },
  calendar: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px",
    border: `1px solid ${C.borderLight}`,
    borderRadius: RADIUS.card,
    overflow: "hidden",
    background: C.bg,
  },
  cellHeader: {
    padding: "8px 4px",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "600",
    color: C.muted,
    background: C.inputBg,
    borderBottom: `2px solid ${C.borderLight}`,
  },
  emptyCell: {
    padding: "8px 4px",
    minHeight: "80px",
    background: C.bg,
  },
  dayCell: {
    padding: "8px 6px",
    minHeight: "80px",
    border: `1px solid ${C.borderLight}`,
    borderRadius: "4px",
    background: C.card,
  },
};