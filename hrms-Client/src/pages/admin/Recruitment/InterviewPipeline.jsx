import React, { useState, useEffect } from "react";
import { C, SHADOW, RADIUS } from "../../../theme";
import { apiUrl } from "../../../URL";

const STAGES = [
  "HR Screening",
  "Technical Round 1",
  "Technical Round 2",
  "Functional Head Round",
  "Quality / Compliance Round",
  "Director / Management Round",
  "Offer Discussion",
  "Joining",
];

export default function InterviewPipeline() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    RoundName: "HR Screening",
    InterviewDate: "",
    InterviewTime: "",
    InterviewMode: "Online",
    InterviewerName: "",
    InterviewerDesignation: "",
    Department: "",
    MeetingLink: "",
    Location: "",
  });

  // Outcome Form State
  const [outcomeForm, setOutcomeForm] = useState({
    TechnicalScore: "",
    CommunicationScore: "",
    AttitudeScore: "",
    DomainKnowledgeScore: "",
    Strengths: "",
    Weaknesses: "",
    InterviewFeedback: "",
    RoundResult: "Pass",
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/candidates/pipeline`);
      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const grouped = {};
  STAGES.forEach(stage => grouped[stage] = []);
  candidates.forEach(candidate => {
    const stage = candidate.CurrentRoundName || "HR Screening";
    if (grouped[stage]) grouped[stage].push(candidate);
    else grouped["HR Screening"].push(candidate);
  });

  const pipelineCount = candidates.filter(c => ["Applied", "Interview Scheduled", "Interview In Progress"].includes(c.CandidateStatus)).length;
  const selectedCount = candidates.filter(c => c.CandidateStatus === "Selected").length;
  const rejectedCount = candidates.filter(c => c.CandidateStatus === "Rejected").length;

  const openProfile = (candidate) => {
    setSelectedCandidate(candidate);
    setOutcomeForm({
      TechnicalScore: "",
      CommunicationScore: "",
      AttitudeScore: "",
      DomainKnowledgeScore: "",
      Strengths: "",
      Weaknesses: "",
      InterviewFeedback: "",
      RoundResult: "Pass",
    });
    setShowProfileModal(true);
  };

  const openSchedule = (candidate) => {
    setSelectedCandidate(candidate);
    setScheduleForm({
      RoundName: candidate.CurrentRoundName || "HR Screening",
      InterviewDate: "",
      InterviewTime: "",
      InterviewMode: "Online",
      InterviewerName: "",
      InterviewerDesignation: "",
      Department: "",
      MeetingLink: "",
      Location: "",
    });
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/api/candidates/interviews/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CandidateID: selectedCandidate.CandidateID,
          ...scheduleForm,
        }),
      });

      if (response.ok) {
        setShowScheduleModal(false);
        fetchCandidates();
      } else {
        alert("Failed to save schedule.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOutcomeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate?.LatestRoundID) {
      alert("Please schedule a round first before evaluating.");
      return;
    }

    const overallScore = (
      Number(outcomeForm.TechnicalScore || 0) +
      Number(outcomeForm.CommunicationScore || 0) +
      Number(outcomeForm.AttitudeScore || 0) +
      Number(outcomeForm.DomainKnowledgeScore || 0)
    ) / 4;

    try {
      const response = await fetch(`${apiUrl}/api/candidates/interviews/update-outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          RoundID: selectedCandidate.LatestRoundID,
          CandidateID: selectedCandidate.CandidateID,
          ...outcomeForm,
          OverallScore: overallScore.toFixed(2),
        }),
      });

      if (response.ok) {
        setShowProfileModal(false);
        fetchCandidates();
      } else {
        alert("Failed to update execution scores.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Internal helper to get matching status token styles from context C
  const getStatusStyle = (status) => {
    switch (status) {
      case "Interview Scheduled": return { bg: C.inputBg, text: C.primary };
      case "Interview In Progress": return { bg: C.warningBg, text: C.warning };
      case "On Hold": return { bg: C.borderLight, text: C.muted };
      case "Pending": return { bg: C.bg, text: C.secondary }; // Styles new automated stages safely
      default: return { bg: C.successBg, text: C.success };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Interview Pipeline</h1>
          <p style={styles.subtitle}>Track candidates with detailed dynamic evaluations</p>
        </div>
      </div>

      {/* Stats Board */}
      <div style={styles.statsGrid}>
        <StatCard title="Total Candidates" value={candidates.length} color={C.primary} />
        <StatCard title="In Pipeline" value={pipelineCount} color={C.warning} />
        <StatCard title="Selected" value={selectedCount} color={C.success} />
        <StatCard title="Rejected" value={rejectedCount} color={C.danger} />
      </div>

      {/* Kanban Scroll Lane */}
      {loading ? (
        <div style={styles.loading}>Processing Application Tracks...</div>
      ) : (
        <div style={styles.board}>
          {STAGES.map((stage) => (
            <div key={stage} style={styles.column}>
              <div style={styles.columnHeader}>
                <span style={styles.stageTitle}>{stage}</span>
                <span style={styles.count}>{grouped[stage].length}</span>
              </div>

              <div style={styles.cardsContainer}>
                {grouped[stage].map((candidate) => {
                  const tagColors = getStatusStyle(candidate.CandidateStatus);
                  return (
                    <div key={candidate.CandidateID} style={styles.card}>
                      <div style={styles.cardHeader}>
                        <div style={styles.avatar}>
                          {candidate.FirstName?.[0]}{candidate.LastName?.[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={styles.name}>{candidate.FirstName} {candidate.LastName}</div>
                          <div style={styles.position}>{candidate.AppliedDesignation}</div>
                        </div>
                      </div>

                      <div style={styles.metaRow}>
                        <span style={styles.metaBadge}>⏳ {candidate.TotalExperience || 0} Yrs</span>
                        <span style={styles.metaCompany}>🏢 {candidate.CurrentCompany || "—"}</span>
                      </div>

                      <div style={{ marginTop: "12px" }}>
                        <span style={{ ...styles.statusTag, backgroundColor: tagColors.bg, color: tagColors.text }}>
                          {candidate.CandidateStatus}
                        </span>
                      </div>

                      <div style={styles.actions}>
                        <button style={styles.viewBtn} onClick={() => openProfile(candidate)}>
                          Evaluate
                        </button>
                        <button style={styles.scheduleBtn} onClick={() => openSchedule(candidate)}>
                          Schedule
                        </button>
                      </div>
                    </div>
                  );
                })}

                {grouped[stage].length === 0 && (
                  <div style={styles.emptyColumn}>No candidates in this stage</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile & Score Assessment Modal */}
      {showProfileModal && selectedCandidate && (
        <div style={styles.modalOverlay}>
          <div style={styles.profileContent}>
            <div style={styles.modalHeaderCustom}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={styles.profileAvatarBig}>
                  {selectedCandidate.FirstName?.[0]}{selectedCandidate.LastName?.[0]}
                </div>  
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", color: C.text }}>{selectedCandidate.FirstName} {selectedCandidate.LastName}</h2>
                  <p style={{ margin: "4px 0 0 0", color: C.primary, fontWeight: "600", fontSize: "14px" }}>{selectedCandidate.AppliedDesignation}</p>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowProfileModal(false)}>✕</button>
            </div>

            <div style={styles.profileBody}>
              <div style={styles.profileSection}>
                <h3 style={styles.sectionTitle}>Basic Information</h3>
                <div style={styles.infoGrid}>
                  <Info label="Email Address" value={selectedCandidate.EmailId} />
                  <Info label="Mobile Number" value={selectedCandidate.MobileNo} />
                  <Info label="Experience Breakdown" value={`${selectedCandidate.TotalExperience || 0} Years`} />
                  <Info label="Current Workspace" value={selectedCandidate.CurrentCompany} />
                </div>
              </div>

              <div style={styles.profileSection}>
                <h3 style={styles.sectionTitle}>Submit Round Evaluation</h3>
                <form onSubmit={handleOutcomeSubmit}>
                  <div style={styles.scoreGrid}>
                    <ScoreInput label="Technical Score" value={outcomeForm.TechnicalScore} onChange={(v) => setOutcomeForm(p => ({ ...p, TechnicalScore: v }))} />
                    <ScoreInput label="Communication Skills" value={outcomeForm.CommunicationScore} onChange={(v) => setOutcomeForm(p => ({ ...p, CommunicationScore: v }))} />
                    <ScoreInput label="Cultural & Attitude" value={outcomeForm.AttitudeScore} onChange={(v) => setOutcomeForm(p => ({ ...p, AttitudeScore: v }))} />
                    <ScoreInput label="Domain Competency" value={outcomeForm.DomainKnowledgeScore} onChange={(v) => setOutcomeForm(p => ({ ...p, DomainKnowledgeScore: v }))} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                    <textarea placeholder="Candidate Strengths..." value={outcomeForm.Strengths} onChange={(e) => setOutcomeForm(p => ({ ...p, Strengths: e.target.value }))} style={styles.textarea} />
                    <textarea placeholder="Candidate Weaknesses..." value={outcomeForm.Weaknesses} onChange={(e) => setOutcomeForm(p => ({ ...p, Weaknesses: e.target.value }))} style={styles.textarea} />
                    <textarea placeholder="Overall Comprehensive Feedback..." value={outcomeForm.InterviewFeedback} onChange={(e) => setOutcomeForm(p => ({ ...p, InterviewFeedback: e.target.value }))} style={styles.textarea} rows={3} />
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    <label style={styles.formGroupLabel}>Final Progress Determination</label>
                    <select value={outcomeForm.RoundResult} onChange={(e) => setOutcomeForm(p => ({ ...p, RoundResult: e.target.value }))} style={styles.select}>
                      <option value="Pass">Pass - Advance Candidate</option>
                      <option value="Fail">Fail - Reject Application</option>
                      <option value="Hold">Place On Hold</option>
                    </select>
                  </div>

                  <div style={styles.modalFooter}>
                    <button type="button" style={styles.cancelBtn} onClick={() => setShowProfileModal(false)}>Cancel</button>
                    <button type="submit" style={styles.confirmBtnPrimary}>Save Evaluation</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduling System Modal */}
      {showScheduleModal && selectedCandidate && (
        <div style={styles.modalOverlay}>
          <div style={styles.scheduleModal}>
            <div style={styles.modalHeaderCustom}>
              <h3 style={{ margin: 0, fontSize: "18px", color: C.text }}>Schedule Interview Round</h3>
              <button style={styles.closeBtn} onClick={() => setShowScheduleModal(false)}>✕</button>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ marginTop: "16px" }}>
              <div style={styles.formGroup}>
                <label style={styles.formGroupLabel}>Round Name</label>
                <select value={scheduleForm.RoundName} onChange={(e) => setScheduleForm({ ...scheduleForm, RoundName: e.target.value })} style={styles.input}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formGroupLabel}>Date</label>
                  <input type="date" value={scheduleForm.InterviewDate} onChange={(e) => setScheduleForm({ ...scheduleForm, InterviewDate: e.target.value })} style={styles.input} required />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formGroupLabel}>Time</label>
                  <input type="time" value={scheduleForm.InterviewTime} onChange={(e) => setScheduleForm({ ...scheduleForm, InterviewTime: e.target.value })} style={styles.input} required />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formGroupLabel}>Interview Mode</label>
                <select value={scheduleForm.InterviewMode} onChange={(e) => setScheduleForm({ ...scheduleForm, InterviewMode: e.target.value })} style={styles.input}>
                  <option value="Online">Online Video Call</option>
                  <option value="In Person">In Person Office Meeting</option>
                  <option value="Telephonic">Telephonic Screening</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formGroupLabel}>Interviewer Name</label>
                  <input type="text" placeholder="Full Name" value={scheduleForm.InterviewerName} onChange={(e) => setScheduleForm({ ...scheduleForm, InterviewerName: e.target.value })} style={styles.input} required />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formGroupLabel}>Interviewer Designation</label>
                  <input type="text" placeholder="e.g. Tech Lead" value={scheduleForm.InterviewerDesignation} onChange={(e) => setScheduleForm({ ...scheduleForm, InterviewerDesignation: e.target.value })} style={styles.input} />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formGroupLabel}>Department</label>
                <input type="text" placeholder="Engineering / HR" value={scheduleForm.Department} onChange={(e) => setScheduleForm({ ...scheduleForm, Department: e.target.value })} style={styles.input} />
              </div>

              {scheduleForm.InterviewMode === "Online" && (
                <div style={styles.formGroup}>
                  <label style={styles.formGroupLabel}>Meeting Link</label>
                  <input type="url" placeholder="https://meet.google.com/..." value={scheduleForm.MeetingLink} onChange={(e) => setScheduleForm({ ...scheduleForm, MeetingLink: e.target.value })} style={styles.input} />
                </div>
              )}

              {scheduleForm.InterviewMode === "In Person" && (
                <div style={styles.formGroup}>
                  <label style={styles.formGroupLabel}>Location Room / Floor</label>
                  <input type="text" placeholder="Conference Room Alpha" value={scheduleForm.Location} onChange={(e) => setScheduleForm({ ...scheduleForm, Location: e.target.value })} style={styles.input} />
                </div>
              )}

              <div style={styles.modalFooter}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button type="submit" style={styles.confirmBtn}>Confirm Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* Structural Atoms Components */
function StatCard({ title, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statTitle}>{title}</div>
    </div>
  );
}

function ScoreInput({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={styles.scoreLabel}>{label}</label>
      <input
        type="number"
        min="0"
        max="10"
        step="0.1"
        placeholder="0.0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.scoreInput}
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value || "—"}</span>
    </div>
  );
}

/* ==================== ALIGNED STYLES (THEME CONTEXT INTEGRATED) ==================== */
const styles = {
  container: { padding: "32px", background: C.bg, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  header: { marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: "700", color: C.text, margin: 0, letterSpacing: "-0.5px" },
  subtitle: { color: C.muted, marginTop: "4px", fontSize: "15px" },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" },
  statCard: { background: C.card, padding: "20px", borderRadius: RADIUS.card, boxShadow: SHADOW.card, border: `1px solid ${C.borderLight}` },
  statValue: { fontSize: "32px", fontWeight: "700" },
  statTitle: { color: C.muted, marginTop: "6px", fontSize: "14px", fontWeight: "500" },

  board: { display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "16px", alignItems: "flex-start" },
  column: { minWidth: "300px", width: "300px", background: C.inputBg, borderRadius: RADIUS.card, display: "flex", flexDirection: "column", maxHeight: "82vh", border: `1px solid ${C.borderLight}` },
  columnHeader: { padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.borderLight}` },
  stageTitle: { fontWeight: "700", color: C.secondary, fontSize: "13.5px", letterSpacing: "0.2px" },
  count: { background: C.primary, color: C.white, padding: "2px 8px", borderRadius: RADIUS.pill, fontSize: "12px", fontWeight: "600" },

  cardsContainer: { padding: "12px", flex: 1, display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" },
  card: { background: C.white, borderRadius: RADIUS.card, padding: "16px", boxShadow: SHADOW.soft, border: `1px solid ${C.borderLight}` },
  cardHeader: { display: "flex", gap: "12px", alignItems: "center" },
  avatar: { width: "38px", height: "38px", borderRadius: RADIUS.input, background: C.inputBg, border: `1px solid ${C.inputBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: C.primary, fontSize: "13px" },
  name: { fontWeight: "600", color: C.text, fontSize: "14.5px" },
  position: { color: C.muted, fontSize: "12.5px", marginTop: "2px" },
  
  metaRow: { display: "flex", gap: "10px", marginTop: "12px", alignItems: "center" },
  metaBadge: { fontSize: "11.5px", color: C.secondary, background: C.inputBg, padding: "2px 6px", borderRadius: "4px" },
  metaCompany: { fontSize: "11.5px", color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  statusTag: { padding: "4px 8px", borderRadius: RADIUS.pill, fontSize: "11px", fontWeight: "600", display: "inline-block" },

  actions: { display: "flex", gap: "8px", marginTop: "14px" },
  viewBtn: { flex: 1, padding: "8px", background: C.primary, color: C.white, border: "none", borderRadius: RADIUS.button, cursor: "pointer", fontWeight: "600", fontSize: "12.5px" },
  scheduleBtn: { flex: 1, padding: "8px", background: C.white, border: `1px solid ${C.primary}`, color: C.primary, borderRadius: RADIUS.button, cursor: "pointer", fontWeight: "600", fontSize: "12.5px" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(13, 45, 61, 0.35)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  profileContent: { background: C.white, width: "100%", maxWidth: "640px", borderRadius: "16px", boxShadow: SHADOW.sidebar, maxHeight: "88vh", overflowY: "auto" },
  modalHeaderCustom: { padding: "20px 24px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  profileAvatarBig: { width: "48px", height: "48px", borderRadius: RADIUS.card, background: C.inputBg, border: `1px solid ${C.inputBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "700", color: C.primary },
  closeBtn: { background: "none", border: "none", fontSize: "18px", color: C.muted, cursor: "pointer" },
  
  profileBody: { padding: "24px" },
  profileSection: { marginBottom: "24px" },
  sectionTitle: { fontSize: "13px", fontWeight: "700", color: C.label, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", margin: 0 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", background: C.bg, padding: "16px", borderRadius: RADIUS.card, border: `1px solid ${C.borderLight}` },
  infoRow: { display: "flex", flexDirection: "column", gap: "2px" },
  infoLabel: { fontSize: "11.5px", color: C.muted },
  infoValue: { fontSize: "13.5px", color: C.text, fontWeight: "600" },

  scoreGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  scoreLabel: { fontSize: "12.5px", color: C.text, fontWeight: "600" },
  scoreInput: { width: "100%", padding: "10px 12px", border: `1px solid ${C.inputBorder}`, background: C.inputBg, borderRadius: RADIUS.input, fontSize: "13.5px", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "10px 12px", border: `1px solid ${C.inputBorder}`, borderRadius: RADIUS.input, minHeight: "64px", fontSize: "13.5px", boxSizing: "border-box", fontFamily: "inherit" },
  select: { width: "100%", padding: "10px 12px", border: `1px solid ${C.inputBorder}`, borderRadius: RADIUS.input, fontSize: "13.5px", background: C.white },

  scheduleModal: { background: C.white, width: "100%", maxWidth: "480px", borderRadius: "16px", padding: "24px", boxShadow: SHADOW.sidebar, boxSizing: "border-box" },
  formGroup: { marginBottom: "14px" },
  formGroupLabel: { display: "block", fontSize: "12.5px", color: C.text, fontWeight: "600", marginBottom: "4px" },
  input: { width: "100%", padding: "10px 12px", border: `1px solid ${C.inputBorder}`, borderRadius: RADIUS.input, fontSize: "13.5px", boxSizing: "border-box" },
  formRow: { display: "flex", gap: "14px" },

  modalFooter: { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" },
  cancelBtn: { padding: "9px 16px", background: C.borderLight, border: "none", color: C.secondary, borderRadius: RADIUS.button, cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  confirmBtn: { padding: "9px 20px", background: C.accent, color: C.white, border: "none", borderRadius: RADIUS.button, cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  confirmBtnPrimary: { padding: "9px 20px", background: C.primary, color: C.white, border: "none", borderRadius: RADIUS.button, cursor: "pointer", fontWeight: "600", fontSize: "13px" },

  emptyColumn: { textAlign: "center", padding: "24px 12px", color: C.muted, border: `1.5px dashed ${C.inputBorder}`, borderRadius: RADIUS.card, fontSize: "12.5px" },
  loading: { textAlign: "center", padding: "80px 0", color: C.muted, fontWeight: "500" },
};