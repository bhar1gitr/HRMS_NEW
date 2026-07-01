import React, { useState, useEffect, useMemo } from "react";
import { C, SHADOW, RADIUS } from "../../../theme";
import { apiUrl } from "../../../URL";

export default function SelectedCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchSelected();
  }, []);

  const fetchSelected = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/candidates/selected-list`);
      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching onboarding queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (candidateId) => {
    if (!window.confirm("Are you sure you want to create employee record for this candidate?")) return;
    
    setActionInProgress(candidateId);
    try {
      const res = await fetch(`${apiUrl}/api/candidates/convert-employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CandidateID: candidateId }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Employee created successfully! Employee ID: ${data.EmployeeID}`);
        fetchSelected();
      } else {
        alert(data.message || "Action failed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to convert candidate");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSendAppointmentLetter = async (candidateId) => {
    if (!window.confirm("Are you sure you want to send the appointment letter to this candidate?")) return;
    
    setActionInProgress(candidateId);
    try {
      const res = await fetch(`${apiUrl}/api/candidates/send-appointment-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          CandidateID: candidateId,
          AppointmentLetterContent: "Dear Candidate,\n\nWe are pleased to offer you the position...",
          AppointmentLetterFile: null
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Appointment letter sent successfully");
        fetchSelected();
      } else {
        alert(data.message || "Action failed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send appointment letter");
    } finally {
      setActionInProgress(null);
    }
  };

  const getActionButton = (candidate) => {
    const isDisabled = actionInProgress === candidate.CandidateID;
    
    switch(candidate.CandidateStatus) {
      case 'Selected':
        return (
          <button 
            style={styles.createButton} 
            onClick={() => handleCreateEmployee(candidate.CandidateID)}
            disabled={isDisabled}
          >
            {isDisabled ? 'Creating...' : 'Create Employee'}
          </button>
        );
      
      case 'Employee Created':
        return (
          <button 
            style={styles.letterButton} 
            onClick={() => handleSendAppointmentLetter(candidate.CandidateID)}
            disabled={isDisabled}
          >
            {isDisabled ? 'Sending...' : 'Send Appointment Letter'}
          </button>
        );
      
      case 'Appointment Letter Sent':
        return (
          <span style={styles.completedBadge}>✓ Letter Sent</span>
        );
      
      case 'Appointment Letter Accepted':
        return (
          <span style={styles.completedBadge}>✓ Accepted</span>
        );
      
      default:
        return (
          <span style={styles.statusText}>{candidate.CandidateStatus}</span>
        );
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Selected': { bg: '#c8e6c9', color: '#1b5e20', label: 'Selected' },
      'Employee Created': { bg: '#f3e5f5', color: '#6a1b9a', label: 'Employee Created' },
      'Appointment Letter Sent': { bg: '#e0f7fa', color: '#006064', label: 'Letter Sent' },
      'Appointment Letter Accepted': { bg: '#f1f8e9', color: '#33691e', label: 'Accepted' },
    };
    
    const style = statusStyles[status] || { bg: '#f5f5f5', color: '#616161', label: status };
    return { ...styles.statusBadge, background: style.bg, color: style.color };
  };

  // Filter candidates based on search term and status filter
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      // Search filter
      const searchMatch = searchTerm === "" || 
        candidate.FirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.LastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.EmailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.AppliedDesignation?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const statusMatch = statusFilter === "all" || candidate.CandidateStatus === statusFilter;
      
      return searchMatch && statusMatch;
    });
  }, [candidates, searchTerm, statusFilter]);

  // Get status counts for stats
  const getStatusCount = (statuses) => {
    return candidates.filter(c => statuses.includes(c.CandidateStatus)).length;
  };

  // Get unique statuses for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = candidates.map(c => c.CandidateStatus);
    return [...new Set(statuses)];
  }, [candidates]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>   
        <div>
          <h1 style={styles.title}>Selected Candidates</h1>
          <p style={styles.subtitle}>
            Manage employee creation and appointment letters for selected candidates
          </p>
        </div>
      </div>

      {/* Stats Board */}
      <div style={styles.statsGrid}>
        <StatCard 
          title="Ready for Employee Creation" 
          value={getStatusCount(['Selected'])}
          color="#2e7d32"
        />
        <StatCard 
          title="Awaiting Appointment Letter" 
          value={getStatusCount(['Employee Created'])}
          color="#6a1b9a"
        />
        <StatCard 
          title="Letters Sent" 
          value={getStatusCount(['Appointment Letter Sent', 'Appointment Letter Accepted'])}
          color="#006064"
        />
        <StatCard 
          title="Total Selected" 
          value={candidates.length}
          color={C.primary}
        />
      </div>

      {/* Search and Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search by name, email, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <span style={styles.searchIcon}>🔍</span>
        </div>
        <div style={styles.filterWrapper}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <button 
          style={styles.clearFilterBtn}
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("all");
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={styles.loadingText}>Loading selected candidates...</div>
      ) : (
        <div style={styles.tableWrapper}>
          <div style={styles.tableHeader}>
            <span style={styles.resultCount}>
              Showing {filteredCandidates.length} of {candidates.length} candidates
            </span>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Candidate</th>
                <th style={styles.th}>Designation</th>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.CandidateID} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>
                      {candidate.FirstName} {candidate.LastName}
                    </strong>
                    <div style={{ fontSize: "12px", color: C.muted, marginTop: "4px" }}>
                      {candidate.EmailId}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {candidate.AppliedDesignation || "-"}
                  </td>
                  <td style={styles.td}>
                    {candidate.AppliedDepartment || "-"}
                  </td>
                  <td style={styles.td}>
                    <span style={getStatusBadge(candidate.CandidateStatus)}>
                      {getStatusBadge(candidate.CandidateStatus).label || candidate.CandidateStatus}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {getActionButton(candidate)}
                  </td>
                </tr>
              ))}
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={5} style={styles.emptyCell}>
                    {searchTerm || statusFilter !== "all" 
                      ? "No candidates match your search criteria" 
                      : "No candidates in the selected pipeline"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statValue, color: color || C.primary }}>{value}</div>
      <div style={styles.statTitle}>{title}</div>
    </div>
  );
}

// ==================== STYLES ====================
const styles = {
  container: { 
    padding: "28px", 
    background: C.bg, 
    minHeight: "100vh", 
    fontFamily: "'Inter', system-ui, sans-serif" 
  },
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: "20px" 
  },
  title: { 
    margin: 0, 
    fontSize: "20px", 
    fontWeight: "700", 
    color: C.text 
  },
  subtitle: { 
    color: C.muted, 
    marginTop: "4px", 
    fontSize: "13px" 
  },
  statsGrid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(4, 1fr)", 
    gap: "12px", 
    marginBottom: "20px" 
  },
  statCard: { 
    background: C.card, 
    border: `1px solid ${C.borderLight}`, 
    borderRadius: RADIUS.card, 
    padding: "16px 18px" 
  },
  statValue: { 
    fontSize: "26px", 
    fontWeight: "700" 
  },
  statTitle: { 
    fontSize: "12px", 
    color: C.muted, 
    marginTop: "3px" 
  },
  filterBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    alignItems: "center",
    flexWrap: "wrap"
  },
  searchWrapper: {
    flex: 1,
    minWidth: "200px",
    position: "relative"
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px 10px 40px",
    border: `1px solid ${C.borderLight}`,
    borderRadius: RADIUS.input || "8px",
    fontSize: "13px",
    background: C.card,
    color: C.text,
    outline: "none",
    transition: "border-color 0.2s",
    '&:focus': {
      borderColor: C.primary
    }
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: C.muted,
    fontSize: "14px"
  },
  filterWrapper: {
    minWidth: "150px"
  },
  filterSelect: {
    width: "100%",
    padding: "10px 16px",
    border: `1px solid ${C.borderLight}`,
    borderRadius: RADIUS.input || "8px",
    fontSize: "13px",
    background: C.card,
    color: C.text,
    outline: "none",
    cursor: "pointer"
  },
  clearFilterBtn: {
    padding: "10px 20px",
    background: "transparent",
    border: `1px solid ${C.borderLight}`,
    borderRadius: RADIUS.input || "8px",
    fontSize: "13px",
    color: C.muted,
    cursor: "pointer",
    transition: "all 0.2s",
    '&:hover': {
      background: C.inputBg,
      borderColor: C.text
    }
  },
  tableWrapper: { 
    background: C.card, 
    borderRadius: RADIUS.card, 
    overflow: "hidden", 
    border: `1px solid ${C.borderLight}` 
  },
  tableHeader: {
    padding: "12px 18px",
    borderBottom: `1px solid ${C.borderLight}`,
    display: "flex",
    justifyContent: "flex-end"
  },
  resultCount: {
    fontSize: "12px",
    color: C.muted
  },
  table: { 
    width: "100%", 
    borderCollapse: "collapse" 
  },
  th: { 
    background: "#f8fafc", 
    padding: "14px 18px", 
    textAlign: "left", 
    fontWeight: "600", 
    color: C.muted, 
    fontSize: "12px", 
    borderBottom: `2px solid ${C.border}` 
  },
  tr: { 
    transition: "background 0.2s",
    '&:hover': { background: '#f8fafc' }
  },
  td: { 
    padding: "14px 18px", 
    borderBottom: `1px solid ${C.border}`, 
    color: C.text, 
    fontSize: "13px" 
  },
  statusBadge: { 
    padding: "4px 12px", 
    borderRadius: "999px", 
    fontSize: "11px", 
    fontWeight: "600",
    display: "inline-block"
  },
  createButton: { 
    background: "#2e7d32", 
    color: "#fff", 
    border: "none", 
    padding: "8px 16px", 
    borderRadius: "8px", 
    cursor: "pointer", 
    fontWeight: "600",
    fontSize: "12px",
    transition: "all 0.2s ease",
    '&:hover': { background: "#1b5e20" },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' }
  },
  letterButton: { 
    background: "#6a1b9a", 
    color: "#fff", 
    border: "none", 
    padding: "8px 16px", 
    borderRadius: "8px", 
    cursor: "pointer", 
    fontWeight: "600",
    fontSize: "12px",
    transition: "all 0.2s ease",
    '&:hover': { background: "#4a148c" },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' }
  },
  completedBadge: { 
    background: "#e8f5e9", 
    color: "#1b5e20", 
    padding: "4px 12px", 
    borderRadius: "999px", 
    fontSize: "12px", 
    fontWeight: "600",
    display: "inline-block"
  },
  statusText: {
    fontSize: "12px",
    color: C.muted
  },
  emptyCell: { 
    padding: "40px", 
    textAlign: "center", 
    color: C.muted,
    fontSize: "13px"
  },
  loadingText: { 
    textAlign: "center", 
    padding: "40px", 
    color: C.muted, 
    fontWeight: "500",
    fontSize: "13px"
  }
};