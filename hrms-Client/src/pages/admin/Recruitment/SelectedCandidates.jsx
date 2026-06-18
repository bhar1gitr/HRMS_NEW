import React, { useState, useEffect } from "react";
import { C, SHADOW, RADIUS } from "../../../theme";
import { apiUrl } from "../../../URL";

export default function SelectedCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleConvert = async (candidateId) => {
    if (!window.confirm("Are you sure you want to transition this candidate to active employee payroll status?")) return;
    
    try {
      const res = await fetch(`${apiUrl}/api/candidates/convert-employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CandidateID: candidateId }),
      });

      if (res.ok) {
        // Refresh local array view automatically
        fetchSelected();
      } else {
        alert("Action failed parsing infrastructure payroll registers.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>   
        <div>
          <h1 style={styles.title}>Selected Candidates</h1>
          <p style={styles.subtitle}>
            Candidates who have accepted offers and are ready for onboarding
          </p>
        </div>
        <button style={styles.addButton}>
          + New Offer Letter
        </button>
      </div>

      {/* Stats Board */}
      <div style={styles.statsGrid}>
        <StatCard title="Selected Total" value={candidates.length} />
        <StatCard title="Pending Onboarding" value={candidates.length} />
        <StatCard title="Status Tracking" value="Active Queue" />
      </div>

      {/* Table Content Lane */}
      {loading ? (
        <div style={styles.loadingText}>Syncing onboarding matrices...</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Candidate Name</th>
                <th style={styles.th}>Position</th>
                <th style={styles.th}>Joining Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.CandidateID} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{candidate.FirstName} {candidate.LastName}</strong>
                  </td>
                  <td style={styles.td}>{candidate.AppliedDesignation}</td>
                  <td style={styles.td}>{candidate.JoiningDate || "Not Specified"}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge}>Offer Accepted</span>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.convertButton} onClick={() => handleConvert(candidate.CandidateID)}>
                      Convert to Employee
                    </button>
                  </td>
                </tr>
              ))}
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={5} style={styles.emptyCell}>
                    No candidates awaiting final employee transition workspace setup.
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

function StatCard({ title, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statTitle}>{title}</div>
    </div>
  );
}

// ==================== STYLES ====================
const styles = {
  container: { padding: "32px", background: C.bg, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
  title: { margin: 0, fontSize: "32px", fontWeight: "700", color: C.text },
  subtitle: { color: C.muted, marginTop: "6px", fontSize: "15.5px" },
  addButton: { background: C.accent, color: "#fff", border: "none", padding: "13px 24px", borderRadius: RADIUS.button || "12px", cursor: "pointer", fontWeight: "600", boxShadow: "0 8px 20px rgba(214,58,110,0.25)" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" },
  statCard: { background: C.card, padding: "24px", borderRadius: RADIUS.card, boxShadow: SHADOW.card },
  statValue: { fontSize: "32px", fontWeight: "700", color: C.primary, marginBottom: "6px" },
  statTitle: { color: C.muted, fontSize: "14.5px" },
  tableWrapper: { background: C.card, borderRadius: RADIUS.card, overflow: "hidden", boxShadow: SHADOW.card, border: `1px solid ${C.borderLight || "#e2ecf3"}` },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#f8fafc", padding: "18px 20px", textAlign: "left", fontWeight: "600", color: C.muted, fontSize: "14px", borderBottom: `2px solid ${C.border}` },
  tr: { transition: "background 0.2s" },
  td: { padding: "18px 20px", borderBottom: `1px solid ${C.border}`, color: C.text, fontSize: "14.5px" },
  statusBadge: { background: C.successBg || "#e1f5ee", color: C.success || "#0f6e56", padding: "7px 16px", borderRadius: "999px", fontSize: "13.5px", fontWeight: "600" },
  convertButton: { background: C.primary, color: "#fff", border: "none", padding: "10px 20px", borderRadius: RADIUS.button || "10px", cursor: "pointer", fontWeight: "600" },
  emptyCell: { padding: "40px", textTransform: "center", textAlign: "center", color: C.muted },
  loadingText: { textAlign: "center", padding: "40px", color: C.muted, fontWeight: "500" }
};