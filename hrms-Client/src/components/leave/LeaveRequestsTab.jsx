import React, { useState, useMemo } from "react";
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

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: "12px", fontWeight: "700", color: C.primary,
      letterSpacing: "0.08em", textTransform: "uppercase",
      marginBottom: "14px", paddingBottom: "8px", borderBottom: `2px solid ${C.borderLight}`
    }}>
      {children}
    </div>
  );
}

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

export default function LeaveRequestsTab({ requests, onApprove, onReject, onViewDetails }) {
  const [filters, setFilters] = useState({ leaveType: "", status: "", search: "" });

  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (filters.leaveType && r.leaveType !== filters.leaveType) return false;
      if (filters.status    && r.status    !== filters.status)    return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!r.employeeName?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [requests, filters]);

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  return (
    <div>
      <SectionLabel>All Leave Requests</SectionLabel>

      {/* Filters */}
      <div style={s.filterBar}>
        <input
          type="text" placeholder="Search employee…" style={s.filterInput}
          value={filters.search} onChange={e => setF("search", e.target.value)}
        />
        <select style={s.filterSelect} value={filters.leaveType} onChange={e => setF("leaveType", e.target.value)}>
          <option value="">All Leave Types</option>
          {Object.entries(LEAVE_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select style={s.filterSelect} value={filters.status} onChange={e => setF("status", e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Forwarded to HR">Forwarded to HR</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <span style={s.count}>{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>No leave requests found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <Th>Employee</Th>
                <Th>Leave Type</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Days</Th>
                <Th>Status</Th>
                <Th>Applied On</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id || i} style={i % 2 === 0 ? {} : { background: C.inputBg }}>
                  <Td><strong>{r.employeeName}</strong></Td>
                  <Td>{LEAVE_TYPE_LABELS[r.leaveType] ?? r.leaveType}</Td>
                  <Td>{r.fromDate ? new Date(r.fromDate).toLocaleDateString() : "—"}</Td>
                  <Td>{r.toDate   ? new Date(r.toDate).toLocaleDateString()   : "—"}</Td>
                  <Td><strong>{r.days}</strong></Td>
                  <Td><StatusPill status={r.status} /></Td>
                  <Td style={{ color: C.muted }}>
                    {r.appliedOn ? new Date(r.appliedOn).toLocaleDateString() : "—"}
                  </Td>
                  <Td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {["Pending", "Forwarded to HR"].includes(r.status) && (
                        <>
                          <button style={s.approveBtn} onClick={() => onApprove(r.id)}>Approve</button>
                          <button style={s.rejectBtn}  onClick={() => onReject(r.id)}>Reject</button>
                        </>
                      )}
                      <button style={s.viewBtn} onClick={() => onViewDetails(r)}>View</button>
                    </div>
                  </Td>
                </tr>
              ))}
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
    fontWeight: "600", color: C.muted, whiteSpace: "nowrap"
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
  filterBar:    { display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" },
  filterInput:  { padding: "8px 12px", border: `1.5px solid ${C.borderLight}`, borderRadius: "6px", fontSize: "13px", background: C.card, color: C.text, outline: "none", minWidth: "180px" },
  filterSelect: { padding: "8px 12px", border: `1.5px solid ${C.borderLight}`, borderRadius: "6px", fontSize: "13px", background: C.card, color: C.text, outline: "none", minWidth: "150px" },
  count:        { fontSize: "13px", color: C.muted, marginLeft: "auto" },
  table:        { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  thead:        {},
  empty:        { padding: "60px 20px", textAlign: "center", color: C.muted, fontSize: "14px" },
  approveBtn:   { padding: "5px 12px", background: "#ecfdf5", color: "#065f46", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  rejectBtn:    { padding: "5px 12px", background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  viewBtn:      { padding: "5px 12px", background: "#eff6ff", color: "#1e40af", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
};