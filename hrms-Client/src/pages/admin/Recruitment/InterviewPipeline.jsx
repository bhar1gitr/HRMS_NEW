import React, { useState, useEffect, useCallback, useMemo } from "react";
import { C, RADIUS } from "../../../theme";
import { apiUrl } from "../../../URL";

// ─── Constants ─────────────────────────────────────────────────────────────────

const STAGES = [
  "Applied",
  "Domain Interview",
  "Management Interview",
  "Offer Discussion",
  "Offer Process",
];

const STATUS_STYLE = {
  "Applied":               { bg: "#e3f2fd", color: "#1565c0" },
  "Interview Scheduled":   { bg: "#fff8e1", color: "#ef6c00" },
  "Interview Process":     { bg: "#ede7f6", color: "#6a1b9a" },
  "Interview In Progress": { bg: "#ede7f6", color: "#6a1b9a" },
  "Offer Discussion":      { bg: "#f3e5f5", color: "#7b1fa2" },
  "Offer Process":         { bg: "#e8f5e9", color: "#2e7d32" },
  "Selected":              { bg: "#c8e6c9", color: "#1b5e20" },
  "Rejected":              { bg: "#ffebee", color: "#c62828" },
  "On Hold":               { bg: "#f5f5f5", color: "#616161" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const initials = (c) =>
  `${c.FirstName?.[0] ?? ""}${c.LastName?.[0] ?? ""}`.toUpperCase();

/**
 * What stage column should this candidate appear in?
 */
const getKanbanStage = (c) => {
  const status = c.CandidateStatus;
  const round  = c.CurrentRoundName;

  if (status === "Applied") return "Applied";
  // Waiting for first interview (shortlisted but not yet scheduled)
  if ((status === "Interview Scheduled" || status === "On Hold") && !round) return "Applied";
  if (round === "Offer Discussion" || status === "Offer Discussion") return "Offer Discussion";
  if (round === "Offer Process"    || status === "Offer Process")    return "Offer Process";
  if (round && STAGES.includes(round)) return round;
  return "Applied";
};

/**
 * Derive the next round name from the current one.
 * Used to label the Schedule button.
 */
const getNextRoundName = (currentRoundName) => {
  switch (currentRoundName) {
    case null: case undefined: case "": return "Domain Interview";
    case "Domain Interview":            return "Management Interview";
    case "Management Interview":        return "Offer Discussion";
    case "Offer Discussion":            return "Offer Process";
    default:                            return null;
  }
};

/**
 * Card action logic — the single source of truth for which buttons appear.
 *
 * The backend now sends:
 *   c.CurrentRoundName  – name of the latest (active) round
 *   c.EvaluationResult  – "Pass" | "Fail" | "Hold" | null  (for the active round)
 *   c.NextRoundPending  – true when passed + next round not yet scheduled
 *
 * Flow:
 *   Applied                                → "Review Resume"
 *   Interview Scheduled, no round          → "Schedule Domain Interview"
 *   Active round, result = null            → "Evaluate <Round>"
 *   Active round, result = Hold            → "Re-evaluate <Round>"
 *   Active round, result = Pass            → "Schedule <Next Round>"   (NextRoundPending)
 *   Active round, result = Fail            → nothing (archived)
 *   Offer Process, result = null or Hold   → "Review Checklist"
 */
const getCardActions = (c) => {
  const status       = c.CandidateStatus;
  const round        = c.CurrentRoundName;
  const evalResult   = c.EvaluationResult; // from backend
  const nextPending  = c.NextRoundPending; // from backend

  // ── Applied / not yet scheduled ──────────────────────────────────────────
  if (status === "Applied") {
    return { evaluate: "Review Resume", schedule: null };
  }

  // Shortlisted but no round created yet
  if (!round) {
    return { evaluate: null, schedule: "Schedule Domain Interview" };
  }

  // ── Offer Process ─────────────────────────────────────────────────────────
  if (round === "Offer Process") {
    return { evaluate: "Review Checklist", schedule: null };
  }

  // ── Standard interview rounds ─────────────────────────────────────────────
  const roundShort =
    round === "Domain Interview"     ? "Domain"
    : round === "Management Interview" ? "Management"
    : round === "Offer Discussion"     ? "Discussion"
    : round;

  // Passed → show schedule button for next round
  if (evalResult === "Pass" || nextPending) {
    const nextRound = getNextRoundName(round);
    if (!nextRound) return { evaluate: null, schedule: null };
    const scheduleLabel =
      nextRound === "Management Interview" ? "Schedule Management"
      : nextRound === "Offer Discussion"   ? "Schedule Offer Discussion"
      : nextRound === "Offer Process"      ? "Start Offer Process"
      : `Schedule ${nextRound}`;
    return { evaluate: null, schedule: scheduleLabel };
  }

  // On Hold → Re-evaluate
  if (evalResult === "Hold") {
    return { evaluate: `Evaluate ${roundShort}`, schedule: null };
  }

  // Not yet evaluated (null) → Evaluate
  const evaluateLabel =
    round === "Domain Interview"     ? "Evaluate Domain"
    : round === "Management Interview" ? "Evaluate Management"
    : round === "Offer Discussion"     ? "Save Discussion"
    : `Evaluate ${roundShort}`;

  return { evaluate: evaluateLabel, schedule: null };
};

// ─── Subcomponents ─────────────────────────────────────────────────────────────

const StatCard = React.memo(({ title, value, color, icon }) => (
  <div style={s.statCard}>
    <div style={{ ...s.statIcon, background: color + "18" }}>
      <span style={{ fontSize: "20px" }}>{icon}</span>
    </div>
    <div style={{ ...s.statValue, color }}>{value}</div>
    <div style={s.statTitle}>{title}</div>
  </div>
));

const InfoRow = React.memo(({ label, value }) =>
  value ? (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value}</span>
    </div>
  ) : null
);

const SectionLabel = ({ children }) => (
  <div style={s.sectionLabel}>{children}</div>
);

const ScoreSelect = ({ field, value, onChange }) => (
  <select value={value || ""} onChange={(e) => onChange(field, e.target.value)} style={s.select}>
    <option value="">Select score</option>
    {[1,2,3,4,5,6,7,8,9,10].map((v) => (
      <option key={v} value={v}>{v}/10</option>
    ))}
  </select>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export default function InterviewPipeline() {
  const [candidates, setCandidates]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showProfileModal, setShowProfileModal]   = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [outcomeForm, setOutcomeForm]       = useState({});
  const [scheduleForm, setScheduleForm]     = useState({
    RoundName: "Domain Interview",
    InterviewDate: "", InterviewTime: "",
    InterviewMode: "Online", InterviewerName: "",
    InterviewerDesignation: "", Department: "",
    MeetingLink: "", Location: "",
  });
  const [offerTasks, setOfferTasks] = useState({
    SalaryApproval: false, OfferLetterGenerated: false, OfferLetterSent: false,
    CandidateAccepted: false, BackgroundVerification: false,
    DocumentsReceived: false, JoiningDateConfirmed: false,
  });

  // ── Data ────────────────────────────────────────────────────────────────────

  const refreshCandidates = useCallback(async () => {
    try {
      const res  = await fetch(`${apiUrl}/api/candidates/pipeline?t=${Date.now()}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setCandidates(list);
      return list;
    } catch (err) {
      console.error("Refresh error:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res  = await fetch(`${apiUrl}/api/candidates/pipeline`);
        const data = await res.json();
        setCandidates(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const activeCandidates = useMemo(
    () => candidates.filter((c) => c.CandidateStatus !== "Selected" && c.CandidateStatus !== "Rejected"),
    [candidates]
  );

  const grouped = useMemo(() => {
    const g = {};
    STAGES.forEach((stage) => (g[stage] = []));
    activeCandidates.forEach((c) => {
      const stage = getKanbanStage(c);
      if (g[stage]) g[stage].push(c);
    });
    return g;
  }, [activeCandidates]);

  const pipelineCount = activeCandidates.length;
  const selectedCount = candidates.filter((c) => c.CandidateStatus === "Selected").length;
  const rejectedCount = candidates.filter((c) => c.CandidateStatus === "Rejected").length;

  // ── Score calculation ────────────────────────────────────────────────────────

  const calculateScore = useCallback(() => {
    const scoreFields = [
      "TechnicalKnowledge","ProblemSolving","DomainKnowledge","HandsOnExperience",
      "ProjectExposure","CommunicationSkills","Leadership","Ownership","Teamwork",
      "ConflictHandling","DecisionMaking","CultureFit","Stability",
    ];
    const values = scoreFields
      .map((f) => Number(outcomeForm[f]))
      .filter((v) => !isNaN(v) && v > 0);
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [outcomeForm]);

  const setField = useCallback((key, val) => {
    setOutcomeForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  // ── Open modals ──────────────────────────────────────────────────────────────

  const openProfile = useCallback((candidate) => {
    setSelectedCandidate(candidate);
    const round  = candidate.CurrentRoundName;
    const status = candidate.CandidateStatus;
    let init = {};

    if (status === "Applied") {
      init = {
        ResumeScore: "", RelevantExperience: "",
        CurrentCTC: candidate.CurrentCTC || "", ExpectedCTC: "",
        NoticePeriod: candidate.NoticePeriod || "",
        ScreeningRemarks: "", Result: "Pass",
      };
    } else if (round === "Domain Interview") {
      init = {
        TechnicalKnowledge: "", ProblemSolving: "", DomainKnowledge: "",
        HandsOnExperience: "", ProjectExposure: "", CommunicationSkills: "",
        Strengths: "", Weaknesses: "", Feedback: "", Result: "Pass",
      };
    } else if (round === "Management Interview") {
      init = {
        Leadership: "", Ownership: "", Teamwork: "", ConflictHandling: "",
        DecisionMaking: "", CultureFit: "", Stability: "",
        Feedback: "", Result: "Pass",
      };
    } else if (round === "Offer Discussion") {
      init = {
        CurrentCTC: candidate.CurrentCTC || "", ExpectedCTC: "",
        FinalOfferedCTC: "", NoticePeriod: candidate.NoticePeriod || "",
        ExpectedJoiningDate: "", NegotiationNotes: "", Result: "Pass",
      };
    } else if (round === "Offer Process") {
      init = {
        OfferCTC: "", Designation: candidate.AppliedDesignation || "",
        Department: "", ReportingManager: "", JoiningDate: "",
        WorkLocation: "", EmploymentType: "", Remarks: "",
      };
      setOfferTasks({
        SalaryApproval: false, OfferLetterGenerated: false, OfferLetterSent: false,
        CandidateAccepted: false, BackgroundVerification: false,
        DocumentsReceived: false, JoiningDateConfirmed: false,
      });
    }

    setOutcomeForm(init);
    setShowProfileModal(true);
  }, []);

  const openSchedule = useCallback((candidate) => {
    setSelectedCandidate(candidate);
    const nextRound = getNextRoundName(candidate.CurrentRoundName);
    setScheduleForm({
      RoundName: nextRound || "Domain Interview",
      InterviewDate: "", InterviewTime: "",
      InterviewMode: "Online", InterviewerName: "",
      InterviewerDesignation: "", Department: "",
      MeetingLink: "", Location: "",
    });
    setShowScheduleModal(true);
  }, []);

  // ── Submit: Schedule ─────────────────────────────────────────────────────────

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/candidates/interviews/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CandidateID: selectedCandidate.CandidateID, ...scheduleForm }),
      });
      if (res.ok) {
        setShowScheduleModal(false);
        await refreshCandidates();
        alert("Interview scheduled successfully!");
      } else {
        const err = await res.json();
        alert(err.message || "Failed to schedule interview");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to schedule interview");
    }
  };

  // ── Submit: Outcome ──────────────────────────────────────────────────────────

  const handleOutcomeSubmit = async (e) => {
    e.preventDefault();
    const c      = selectedCandidate;
    const status = c.CandidateStatus;

    // Applied → resume screening only updates status
    if (status === "Applied") {
      try {
        const newStatus = outcomeForm.Result === "Pass" ? "Interview Scheduled" : "Rejected";
        const res = await fetch(`${apiUrl}/api/candidates/update-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ CandidateID: c.CandidateID, CandidateStatus: newStatus }),
        });
        if (res.ok) {
          setShowProfileModal(false);
          await refreshCandidates();
          alert(outcomeForm.Result === "Pass"
            ? "Candidate shortlisted! Now schedule the Domain Interview."
            : "Candidate rejected."
          );
        } else {
          const err = await res.json();
          alert(err.message || "Failed to update status");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to update status");
      }
      return;
    }

    if (!c.LatestRoundID) {
      alert("No active round found. Please schedule the interview first.");
      return;
    }

    const payload = {
      RoundID:              c.LatestRoundID,
      CandidateID:          c.CandidateID,
      RoundResult:          outcomeForm.Result,
      TechnicalScore:       outcomeForm.TechnicalKnowledge   || null,
      CommunicationScore:   outcomeForm.CommunicationSkills  || null,
      DomainKnowledgeScore: outcomeForm.DomainKnowledge      || null,
      InterviewFeedback:    outcomeForm.Feedback || outcomeForm.NegotiationNotes || null,
      OverallScore:         calculateScore(),
      Strengths:            outcomeForm.Strengths   || null,
      Weaknesses:           outcomeForm.Weaknesses  || null,
    };

    try {
      const res = await fetch(`${apiUrl}/api/candidates/interviews/update-outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to save evaluation");
        return;
      }

      setShowProfileModal(false);
      await refreshCandidates();

      if (outcomeForm.Result === "Pass") {
        const nextRound = getNextRoundName(c.CurrentRoundName);
        alert(nextRound
          ? `Evaluation saved! Now schedule the ${nextRound}.`
          : "Evaluation saved!"
        );
      } else if (outcomeForm.Result === "Fail") {
        alert("Candidate rejected.");
      } else {
        alert("Candidate placed on hold. Use Re-evaluate when ready.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save evaluation");
    }
  };

  // ── Submit: Mark Selected ────────────────────────────────────────────────────

  const allTasksDone = useMemo(() => Object.values(offerTasks).every(Boolean), [offerTasks]);

  const handleMarkSelected = async () => {
    if (!allTasksDone) {
      alert("Complete all checklist items first.");
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/candidates/interviews/update-outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          RoundID:          selectedCandidate.LatestRoundID,
          CandidateID:      selectedCandidate.CandidateID,
          CandidateStatus:  "Selected",
          RoundResult:      "Selected",
          OfferCTC:         outcomeForm.OfferCTC,
          Designation:      outcomeForm.Designation,
          Department:       outcomeForm.Department,
          ReportingManager: outcomeForm.ReportingManager,
          JoiningDate:      outcomeForm.JoiningDate,
          Remarks:          outcomeForm.Remarks,
        }),
      });
      if (res.ok) {
        alert("Candidate marked as Selected!");
        setShowProfileModal(false);
        await refreshCandidates();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to mark as Selected");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to mark as Selected");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <h1 style={s.pageTitle}>Interview Pipeline</h1>
        <p style={s.pageSub}>Track and manage candidates across all stages</p>
      </div>

      <div style={s.statsGrid}>
        <StatCard title="Total Candidates" value={candidates.length} color="#1565c0" icon="👥" />
        <StatCard title="In Pipeline"      value={pipelineCount}     color="#ef6c00" icon="🔄" />
        <StatCard title="Selected"         value={selectedCount}     color="#2e7d32" icon="✅" />
        <StatCard title="Rejected"         value={rejectedCount}     color="#c62828" icon="❌" />
      </div>

      {loading ? (
        <div style={s.loading}>Loading pipeline…</div>
      ) : (
        <div style={s.board}>
          {STAGES.map((stage) => (
            <div key={stage} style={s.column}>
              <div style={s.colHead}>
                <span style={s.colName}>{stage}</span>
                <span style={s.colBadge}>{grouped[stage]?.length || 0}</span>
              </div>
              <div style={s.colBody}>
                {!grouped[stage]?.length ? (
                  <div style={s.emptyCol}>No candidates</div>
                ) : (
                  grouped[stage].map((c) => {
                    const st      = STATUS_STYLE[c.CandidateStatus] ?? STATUS_STYLE["On Hold"];
                    const actions = getCardActions(c);
                    const result  = c.EvaluationResult;

                    return (
                      <div key={c.CandidateID} style={s.card}>
                        <div style={s.cardTop}>
                          <div style={s.av}>{initials(c)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={s.cname}>{c.FirstName} {c.LastName}</div>
                            <div style={s.cpos}>{c.AppliedDesignation}</div>
                          </div>
                        </div>

                        <div style={s.tags}>
                          <span style={s.tag}>⏳ {c.TotalExperience || 0} yrs</span>
                          <span style={s.tag}>🏢 {c.CurrentCompany || "—"}</span>
                        </div>

                        <div style={{ margin: "10px 0 8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          <span style={{ ...s.pill, background: st.bg, color: st.color }}>
                            {c.CandidateStatus}
                          </span>
                          {result === "Pass" && (
                            <span style={{ ...s.pill, background: "#c8e6c9", color: "#1b5e20" }}>✓ Passed</span>
                          )}
                          {result === "Hold" && (
                            <span style={{ ...s.pill, background: "#fff3e0", color: "#ef6c00" }}>⏸ On Hold</span>
                          )}
                          {result === "Fail" && (
                            <span style={{ ...s.pill, background: "#ffebee", color: "#c62828" }}>✗ Failed</span>
                          )}
                        </div>

                        <div style={s.cardActions}>
                          {actions.evaluate && (
                            <button style={s.btnPrimary} onClick={() => openProfile(c)}>
                              {actions.evaluate}
                            </button>
                          )}
                          {actions.schedule && (
                            <button style={s.btnOutline} onClick={() => openSchedule(c)}>
                              {actions.schedule}
                            </button>
                          )}
                          {!actions.evaluate && !actions.schedule && (
                            <span style={{ color: C.muted, fontSize: "12px", padding: "8px 0" }}>
                              Waiting for action
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Profile / Evaluation Modal ──────────────────────────────────────── */}
      {showProfileModal && selectedCandidate && (
        <div style={s.overlay}>
          <div style={s.profileModal}>
            <div style={s.modalHead}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={s.bigAv}>{initials(selectedCandidate)}</div>
                <div>
                  <div style={s.modalName}>{selectedCandidate.FirstName} {selectedCandidate.LastName}</div>
                  <div style={s.modalPos}>{selectedCandidate.AppliedDesignation}</div>
                </div>
              </div>
              <button style={s.closeBtn} onClick={() => setShowProfileModal(false)}>✕</button>
            </div>

            <div style={s.modalBody}>
              <SectionLabel>Basic Information</SectionLabel>
              <div style={s.infoGrid}>
                <InfoRow label="Candidate ID"    value={selectedCandidate.CandidateID} />
                <InfoRow label="Email"           value={selectedCandidate.EmailId} />
                <InfoRow label="Mobile"          value={selectedCandidate.MobileNo} />
                <InfoRow label="Experience"      value={`${selectedCandidate.TotalExperience || 0} Years`} />
                <InfoRow label="Current Company" value={selectedCandidate.CurrentCompany} />
                <InfoRow label="Current CTC"     value={selectedCandidate.CurrentCTC} />
                <InfoRow label="Notice Period"   value={selectedCandidate.NoticePeriod} />
                <InfoRow label="Expected CTC"    value={selectedCandidate.ExpectedCTC} />
                <InfoRow label="Location"        value={selectedCandidate.City} />
              </div>

              {selectedCandidate.CandidateStatus === "Applied" && selectedCandidate.ResumeFile && (
                <button
                  style={s.resumeBtn}
                  onClick={() => window.open(`${apiUrl}/uploads/resumes/${selectedCandidate.ResumeFile}`, "_blank")}
                >
                  📄 View Resume
                </button>
              )}

              <SectionLabel>Interview History</SectionLabel>
              {selectedCandidate.RoundHistory?.length > 0 ? (
                <table style={s.historyTable}>
                  <thead>
                    <tr>
                      {["Round","Date","Interviewer","Result","Score"].map((h) => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCandidate.RoundHistory.map((r, i) => (
                      <tr key={i}>
                        <td style={s.td}>{r.RoundName}</td>
                        <td style={s.td}>{r.InterviewDate ? new Date(r.InterviewDate).toLocaleDateString() : "—"}</td>
                        <td style={s.td}>{r.InterviewerName || "—"}</td>
                        <td style={s.td}>{r.RoundResult || "Pending"}</td>
                        <td style={s.td}>{r.OverallScore || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: C.muted, fontSize: "13px" }}>No interview history yet.</p>
              )}

              {/* 1. Applied → Resume Screening */}
              {selectedCandidate.CandidateStatus === "Applied" && (
                <>
                  <SectionLabel>Resume Screening</SectionLabel>
                  <form onSubmit={handleOutcomeSubmit}>
                    <div style={s.scoreGrid}>
                      <div style={s.fieldCol}>
                        <label style={s.scoreLabel}>Resume Score</label>
                        <ScoreSelect field="ResumeScore" value={outcomeForm.ResumeScore} onChange={setField} />
                      </div>
                      <div style={s.fieldCol}>
                        <label style={s.scoreLabel}>Relevant Experience</label>
                        <ScoreSelect field="RelevantExperience" value={outcomeForm.RelevantExperience} onChange={setField} />
                      </div>
                      <div style={s.fieldCol}>
                        <label style={s.scoreLabel}>Current CTC</label>
                        <input type="text" value={outcomeForm.CurrentCTC || ""} onChange={(e) => setField("CurrentCTC", e.target.value)} style={s.scoreInput} />
                      </div>
                      <div style={s.fieldCol}>
                        <label style={s.scoreLabel}>Expected CTC</label>
                        <input type="text" value={outcomeForm.ExpectedCTC || ""} onChange={(e) => setField("ExpectedCTC", e.target.value)} style={s.scoreInput} />
                      </div>
                      <div style={s.fieldCol}>
                        <label style={s.scoreLabel}>Notice Period</label>
                        <input type="text" value={outcomeForm.NoticePeriod || ""} onChange={(e) => setField("NoticePeriod", e.target.value)} style={s.scoreInput} />
                      </div>
                    </div>
                    <div style={{ marginTop: "16px" }}>
                      <label style={s.scoreLabel}>Screening Remarks</label>
                      <textarea
                        placeholder="Notes on the resume…"
                        value={outcomeForm.ScreeningRemarks || ""}
                        onChange={(e) => setField("ScreeningRemarks", e.target.value)}
                        style={{ ...s.textarea, marginTop: "6px" }} rows={3}
                      />
                    </div>
                    <div style={{ marginTop: "16px" }}>
                      <label style={s.scoreLabel}>Decision</label>
                      <select value={outcomeForm.Result || "Pass"} onChange={(e) => setField("Result", e.target.value)} style={{ ...s.select, marginTop: "6px" }}>
                        <option value="Pass">Shortlist — Schedule Domain Interview</option>
                        <option value="Fail">Reject Application</option>
                      </select>
                    </div>
                    <div style={s.modalFoot}>
                      <button type="button" style={s.cancelBtn} onClick={() => setShowProfileModal(false)}>Cancel</button>
                      <button type="submit" style={s.primaryBtn}>Save Evaluation</button>
                    </div>
                  </form>
                </>
              )}

              {/* 2. Domain Interview */}
              {selectedCandidate.CurrentRoundName === "Domain Interview" && (
                <>
                  <SectionLabel>Domain Interview Evaluation</SectionLabel>
                  <form onSubmit={handleOutcomeSubmit}>
                    <div style={s.scoreGrid}>
                      {["TechnicalKnowledge","ProblemSolving","DomainKnowledge","HandsOnExperience","ProjectExposure","CommunicationSkills"].map((f) => (
                        <div key={f} style={s.fieldCol}>
                          <label style={s.scoreLabel}>{f.replace(/([A-Z])/g, " $1").trim()}</label>
                          <ScoreSelect field={f} value={outcomeForm[f]} onChange={setField} />
                        </div>
                      ))}
                      <div style={s.fieldCol}>
                        <label style={s.scoreLabel}>Strengths</label>
                        <input type="text" value={outcomeForm.Strengths || ""} onChange={(e) => setField("Strengths", e.target.value)} style={s.scoreInput} />
                      </div>
                      <div style={s.fieldCol}>
                        <label style={s.scoreLabel}>Weaknesses</label>
                        <input type="text" value={outcomeForm.Weaknesses || ""} onChange={(e) => setField("Weaknesses", e.target.value)} style={s.scoreInput} />
                      </div>
                    </div>
                    <div style={{ marginTop: "16px" }}>
                      <label style={s.scoreLabel}>Technical Feedback</label>
                      <textarea placeholder="Detailed feedback…" value={outcomeForm.Feedback || ""} onChange={(e) => setField("Feedback", e.target.value)} style={{ ...s.textarea, marginTop: "6px" }} rows={3} />
                    </div>
                    <div style={{ marginTop: "16px" }}>
                      <label style={s.scoreLabel}>Decision</label>
                      <select value={outcomeForm.Result || "Pass"} onChange={(e) => setField("Result", e.target.value)} style={{ ...s.select, marginTop: "6px" }}>
                        <option value="Pass">Pass — Schedule Management Interview</option>
                        <option value="Fail">Fail — Reject</option>
                        <option value="Hold">Hold</option>
                      </select>
                    </div>
                    <div style={s.modalFoot}>
                      <button type="button" style={s.cancelBtn} onClick={() => setShowProfileModal(false)}>Cancel</button>
                      <button type="submit" style={s.primaryBtn}>Save Evaluation</button>
                    </div>
                  </form>
                </>
              )}

              {/* 3. Management Interview */}
              {selectedCandidate.CurrentRoundName === "Management Interview" && (
                <>
                  <SectionLabel>Management Interview Evaluation</SectionLabel>
                  <form onSubmit={handleOutcomeSubmit}>
                    <div style={s.scoreGrid}>
                      {["Leadership","Ownership","Teamwork","ConflictHandling","DecisionMaking","CultureFit","Stability"].map((f) => (
                        <div key={f} style={s.fieldCol}>
                          <label style={s.scoreLabel}>{f.replace(/([A-Z])/g, " $1").trim()}</label>
                          <ScoreSelect field={f} value={outcomeForm[f]} onChange={setField} />
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: "16px" }}>
                      <label style={s.scoreLabel}>Management Feedback</label>
                      <textarea placeholder="Detailed feedback…" value={outcomeForm.Feedback || ""} onChange={(e) => setField("Feedback", e.target.value)} style={{ ...s.textarea, marginTop: "6px" }} rows={3} />
                    </div>
                    <div style={{ marginTop: "16px" }}>
                      <label style={s.scoreLabel}>Decision</label>
                      <select value={outcomeForm.Result || "Pass"} onChange={(e) => setField("Result", e.target.value)} style={{ ...s.select, marginTop: "6px" }}>
                        <option value="Pass">Pass — Schedule Offer Discussion</option>
                        <option value="Fail">Fail — Reject</option>
                        <option value="Hold">Hold</option>
                      </select>
                    </div>
                    <div style={s.modalFoot}>
                      <button type="button" style={s.cancelBtn} onClick={() => setShowProfileModal(false)}>Cancel</button>
                      <button type="submit" style={s.primaryBtn}>Save Evaluation</button>
                    </div>
                  </form>
                </>
              )}

              {/* 4. Offer Discussion */}
              {selectedCandidate.CurrentRoundName === "Offer Discussion" && (
                <>
                  <SectionLabel>Offer Discussion</SectionLabel>
                  <form onSubmit={handleOutcomeSubmit}>
                    <div style={s.scoreGrid}>
                      {[
                        { key: "CurrentCTC",         label: "Current CTC",          type: "text" },
                        { key: "ExpectedCTC",        label: "Expected CTC",         type: "text" },
                        { key: "FinalOfferedCTC",    label: "Final Offered CTC",    type: "text" },
                        { key: "NoticePeriod",       label: "Notice Period",        type: "text" },
                        { key: "ExpectedJoiningDate",label: "Expected Joining Date",type: "date" },
                      ].map(({ key, label, type }) => (
                        <div key={key} style={s.fieldCol}>
                          <label style={s.scoreLabel}>{label}</label>
                          <input type={type} value={outcomeForm[key] || ""} onChange={(e) => setField(key, e.target.value)} style={s.scoreInput} />
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: "16px" }}>
                      <label style={s.scoreLabel}>Negotiation Notes</label>
                      <textarea placeholder="Notes…" value={outcomeForm.NegotiationNotes || ""} onChange={(e) => setField("NegotiationNotes", e.target.value)} style={{ ...s.textarea, marginTop: "6px" }} rows={3} />
                    </div>
                    <div style={{ marginTop: "16px" }}>
                      <label style={s.scoreLabel}>Decision</label>
                      <select value={outcomeForm.Result || "Pass"} onChange={(e) => setField("Result", e.target.value)} style={{ ...s.select, marginTop: "6px" }}>
                        <option value="Pass">Agreed — Start Offer Process</option>
                        <option value="Fail">Declined — Reject</option>
                        <option value="Hold">Hold</option>
                      </select>
                    </div>
                    <div style={s.modalFoot}>
                      <button type="button" style={s.cancelBtn} onClick={() => setShowProfileModal(false)}>Cancel</button>
                      <button type="submit" style={s.primaryBtn}>Save Discussion</button>
                    </div>
                  </form>
                </>
              )}

              {/* 5. Offer Process Checklist */}
              {selectedCandidate.CurrentRoundName === "Offer Process" && (
                <>
                  <SectionLabel>Offer Process Checklist</SectionLabel>
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div style={s.checklist}>
                      {Object.keys(offerTasks).map((key) => (
                        <label key={key} style={s.checkRow}>
                          <input
                            type="checkbox"
                            checked={offerTasks[key]}
                            onChange={(e) => setOfferTasks((p) => ({ ...p, [key]: e.target.checked }))}
                          />
                          <span>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ ...s.scoreGrid, marginTop: "20px" }}>
                      {[
                        { key: "OfferCTC",         label: "Offer CTC",         type: "text" },
                        { key: "Designation",      label: "Designation",       type: "text" },
                        { key: "Department",       label: "Department",        type: "text" },
                        { key: "ReportingManager", label: "Reporting Manager", type: "text" },
                        { key: "JoiningDate",      label: "Joining Date",      type: "date" },
                        { key: "WorkLocation",     label: "Work Location",     type: "text" },
                        { key: "EmploymentType",   label: "Employment Type",   type: "text" },
                      ].map(({ key, label, type }) => (
                        <div key={key} style={s.fieldCol}>
                          <label style={s.scoreLabel}>{label}</label>
                          <input type={type} value={outcomeForm[key] || ""} onChange={(e) => setField(key, e.target.value)} style={s.scoreInput} />
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: "16px" }}>
                      <label style={s.scoreLabel}>Final Remarks</label>
                      <textarea placeholder="Final remarks…" value={outcomeForm.Remarks || ""} onChange={(e) => setField("Remarks", e.target.value)} style={{ ...s.textarea, marginTop: "6px" }} rows={3} />
                    </div>
                    {!allTasksDone && (
                      <div style={s.checklistNote}>
                        Complete all checklist items to enable "Mark as Selected"
                      </div>
                    )}
                    <div style={s.modalFoot}>
                      <button type="button" style={s.cancelBtn} onClick={() => setShowProfileModal(false)}>Cancel</button>
                      <button
                        type="button"
                        style={{ ...s.primaryBtn, opacity: allTasksDone ? 1 : 0.5, cursor: allTasksDone ? "pointer" : "not-allowed" }}
                        onClick={handleMarkSelected}
                        disabled={!allTasksDone}
                      >
                        Mark as Selected
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Modal ──────────────────────────────────────────────────── */}
      {showScheduleModal && selectedCandidate && (
        <div style={s.overlay}>
          <div style={s.scheduleModal}>
            <div style={s.modalHead}>
              <div>
                <div style={s.modalName}>Schedule Interview</div>
                <div style={s.modalPos}>{selectedCandidate.FirstName} {selectedCandidate.LastName}</div>
              </div>
              <button style={s.closeBtn} onClick={() => setShowScheduleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleScheduleSubmit} style={s.modalBody}>
              <div style={s.fieldCol}>
                <label style={s.scoreLabel}>Round</label>
                <input type="text" value={scheduleForm.RoundName} readOnly style={{ ...s.scoreInput, background: "#f0f0f0", cursor: "default" }} />
              </div>
              <div style={s.scoreGrid}>
                <div style={s.fieldCol}>
                  <label style={s.scoreLabel}>Date</label>
                  <input type="date" value={scheduleForm.InterviewDate} onChange={(e) => setScheduleForm((p) => ({ ...p, InterviewDate: e.target.value }))} style={s.scoreInput} required />
                </div>
                <div style={s.fieldCol}>
                  <label style={s.scoreLabel}>Time</label>
                  <input type="time" value={scheduleForm.InterviewTime} onChange={(e) => setScheduleForm((p) => ({ ...p, InterviewTime: e.target.value }))} style={s.scoreInput} required />
                </div>
              </div>
              <div style={s.fieldCol}>
                <label style={s.scoreLabel}>Mode</label>
                <select value={scheduleForm.InterviewMode} onChange={(e) => setScheduleForm((p) => ({ ...p, InterviewMode: e.target.value }))} style={s.select}>
                  <option value="Online">Online</option>
                  <option value="In Person">In Person</option>
                  <option value="Telephonic">Telephonic</option>
                </select>
              </div>
              <div style={s.scoreGrid}>
                <div style={s.fieldCol}>
                  <label style={s.scoreLabel}>Interviewer Name</label>
                  <input type="text" placeholder="Full name" value={scheduleForm.InterviewerName} onChange={(e) => setScheduleForm((p) => ({ ...p, InterviewerName: e.target.value }))} style={s.scoreInput} required />
                </div>
                <div style={s.fieldCol}>
                  <label style={s.scoreLabel}>Designation</label>
                  <input type="text" placeholder="e.g. Senior Engineer" value={scheduleForm.InterviewerDesignation} onChange={(e) => setScheduleForm((p) => ({ ...p, InterviewerDesignation: e.target.value }))} style={s.scoreInput} />
                </div>
              </div>
              <div style={s.fieldCol}>
                <label style={s.scoreLabel}>Department</label>
                <input type="text" placeholder="e.g. Engineering" value={scheduleForm.Department} onChange={(e) => setScheduleForm((p) => ({ ...p, Department: e.target.value }))} style={s.scoreInput} />
              </div>
              {scheduleForm.InterviewMode === "Online" && (
                <div style={s.fieldCol}>
                  <label style={s.scoreLabel}>Meeting Link</label>
                  <input type="url" placeholder="https://meet.google.com/…" value={scheduleForm.MeetingLink} onChange={(e) => setScheduleForm((p) => ({ ...p, MeetingLink: e.target.value }))} style={s.scoreInput} />
                </div>
              )}
              {scheduleForm.InterviewMode === "In Person" && (
                <div style={s.fieldCol}>
                  <label style={s.scoreLabel}>Location</label>
                  <input type="text" placeholder="Conference Room / Office" value={scheduleForm.Location} onChange={(e) => setScheduleForm((p) => ({ ...p, Location: e.target.value }))} style={s.scoreInput} />
                </div>
              )}
              <div style={s.modalFoot}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button type="submit" style={s.primaryBtn}>Confirm Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page:      { padding: "28px", background: C.bg, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  pageHead:  { marginBottom: "24px" },
  pageTitle: { fontSize: "24px", fontWeight: "700", color: C.text, margin: 0 },
  pageSub:   { fontSize: "14px", color: C.muted, marginTop: "4px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" },
  statCard:  { background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: RADIUS.card, padding: "20px" },
  statIcon:  { width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" },
  statValue: { fontSize: "28px", fontWeight: "700", lineHeight: 1 },
  statTitle: { fontSize: "13px", color: C.muted, marginTop: "6px" },
  loading:   { padding: "100px 20px", textAlign: "center", color: C.muted, fontSize: "15px" },
  board:     { display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "20px" },
  column:    { minWidth: "280px", width: "280px", background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: RADIUS.card, display: "flex", flexDirection: "column", maxHeight: "78vh", flexShrink: 0 },
  colHead:   { padding: "16px 18px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  colName:   { fontSize: "14px", fontWeight: "600", color: C.text },
  colBadge:  { background: C.inputBg, color: C.primary, border: `1px solid ${C.inputBorder}`, fontSize: "12px", fontWeight: "700", padding: "3px 10px", borderRadius: "999px" },
  colBody:   { padding: "12px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" },
  emptyCol:  { textAlign: "center", padding: "40px 20px", color: C.muted, fontSize: "13px", border: `2px dashed ${C.inputBorder}`, borderRadius: "10px" },
  card:      { background: C.bg, border: `1px solid ${C.borderLight}`, borderRadius: "12px", padding: "16px" },
  cardTop:   { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" },
  av:        { width: "38px", height: "38px", borderRadius: "50%", background: C.inputBg, border: `2px solid ${C.inputBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: C.primary, flexShrink: 0 },
  cname:     { fontSize: "14px", fontWeight: "600", color: C.text },
  cpos:      { fontSize: "12.5px", color: C.muted, marginTop: "2px" },
  tags:      { display: "flex", gap: "6px", flexWrap: "wrap" },
  tag:       { fontSize: "11.5px", padding: "3px 8px", borderRadius: "999px", background: C.inputBg, color: C.primary, border: `1px solid ${C.inputBorder}` },
  pill:      { display: "inline-block", fontSize: "11.5px", fontWeight: "600", padding: "3px 9px", borderRadius: "999px" },
  cardActions:  { display: "flex", gap: "8px", marginTop: "14px" },
  btnPrimary:   { flex: 1, padding: "9px 10px", background: C.primary, color: "#fff", border: "none", borderRadius: RADIUS.button, fontSize: "12.5px", fontWeight: "600", cursor: "pointer" },
  btnOutline:   { flex: 1, padding: "9px 10px", background: "#fff", border: `1px solid ${C.inputBorder}`, color: C.primary, borderRadius: RADIUS.button, fontSize: "12.5px", fontWeight: "600", cursor: "pointer" },
  overlay:      { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  profileModal: { background: C.card, width: "100%", maxWidth: "640px", borderRadius: "16px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" },
  scheduleModal:{ background: C.card, width: "100%", maxWidth: "480px", borderRadius: "16px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" },
  modalHead:    { padding: "18px 24px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalBody:    { padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" },
  modalFoot:    { display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "20px", borderTop: `1px solid ${C.borderLight}`, marginTop: "auto" },
  bigAv:        { width: "52px", height: "52px", borderRadius: "50%", background: C.inputBg, border: `2px solid ${C.primary}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "700", color: C.primary },
  modalName:    { fontSize: "17px", fontWeight: "700", color: C.text },
  modalPos:     { fontSize: "13px", color: C.muted },
  closeBtn:     { background: "none", border: "none", fontSize: "22px", color: C.muted, cursor: "pointer", padding: "4px" },
  sectionLabel: { fontSize: "12px", fontWeight: "700", color: C.primary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", paddingBottom: "8px", borderBottom: `1px solid ${C.borderLight}` },
  infoGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px 28px" },
  infoRow:   { display: "flex", flexDirection: "column", gap: "3px" },
  infoLabel: { fontSize: "11.5px", color: C.muted },
  infoValue: { fontSize: "13.5px", fontWeight: "600", color: C.text },
  scoreGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  fieldCol:   { display: "flex", flexDirection: "column", gap: "6px" },
  scoreLabel: { fontSize: "12.5px", fontWeight: "600", color: C.text },
  scoreInput: { width: "100%", padding: "10px 13px", border: `1px solid ${C.borderLight}`, background: C.inputBg, borderRadius: RADIUS.input, fontSize: "13.5px", outline: "none", color: C.text, boxSizing: "border-box" },
  textarea:   { width: "100%", padding: "11px 13px", border: `1px solid ${C.borderLight}`, borderRadius: RADIUS.input, fontSize: "13.5px", fontFamily: "inherit", resize: "vertical", outline: "none", background: C.inputBg, color: C.text, minHeight: "80px", boxSizing: "border-box" },
  select:     { width: "100%", padding: "10px 13px", border: `1px solid ${C.borderLight}`, borderRadius: RADIUS.input, fontSize: "13.5px", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" },
  historyTable:{ width: "100%", borderCollapse: "collapse", fontSize: "13px", background: C.bg, borderRadius: "8px", overflow: "hidden" },
  th:          { padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: C.muted, background: C.inputBg, borderBottom: `1px solid ${C.borderLight}` },
  td:          { padding: "10px 12px", borderBottom: `1px solid ${C.borderLight}`, color: C.text },
  checklist:     { background: C.inputBg, border: `1px solid ${C.borderLight}`, borderRadius: RADIUS.card, padding: "16px", display: "flex", flexDirection: "column", gap: "12px" },
  checkRow:      { display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "13.5px" },
  checklistNote: { marginTop: "12px", fontSize: "12px", color: "#ef6c00", background: "#fff8e1", border: "1px solid #ffe0b2", borderRadius: "8px", padding: "10px 14px" },
  cancelBtn:  { padding: "10px 20px", background: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.text, borderRadius: RADIUS.button, cursor: "pointer", fontSize: "13.5px", fontWeight: "500" },
  primaryBtn: { padding: "10px 24px", background: C.accent, color: "#fff", border: "none", borderRadius: RADIUS.button, cursor: "pointer", fontSize: "13.5px", fontWeight: "600" },
  resumeBtn:  { padding: "9px 16px", fontSize: "13px", fontWeight: "600", background: C.primary, color: "#fff", border: "none", borderRadius: RADIUS.button, cursor: "pointer" },
};

