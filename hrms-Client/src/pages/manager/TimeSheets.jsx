import React, { useState, useEffect } from 'react';

const C = {
  primary: '#0369a1',
  secondary: '#334155',
  muted: '#64748b',
  accent: '#2b7da1',
  card: '#ffffff',
  text: '#0f172a',
  borderLight: '#e2e8f0',
  danger: '#ef4444',
  success: '#0f6e56'
};

const ManagerTimesheetReview = () => {
  const [teamLogs, setTeamLogs] = useState([]);
  const [userContext, setUserContext] = useState({ id: null, name: '', role: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [weekOffset, setWeekOffset] = useState(0); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchTeamLogs = async (userId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/manager/timesheets?supervisorId=${userId}`);
      if (response.ok) {
        setTeamLogs(await response.json());
      }
    } catch (err) {
      console.error("Error accessing supervisor team data payload:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser && storedUser.id) {
      setUserContext({ id: storedUser.id, name: storedUser.name, role: storedUser.role });
      fetchTeamLogs(storedUser.id);
    }
  }, []);

  const getDaysInWeek = (offset) => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); 
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek + (offset * 7));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      days.push(dayDate);
    }
    return days;
  };

  const currentWeekDays = getDaysInWeek(weekOffset);
  const weekMonthLabel = currentWeekDays[0].toLocaleString('default', { month: 'short', year: 'numeric' });

  const getPendingAlertCount = (dateStr) => {
    return teamLogs.filter(t => t.timesheetdate && t.timesheetdate.split('T')[0] === dateStr && t.status === 0).length;
  };

  const handleReviewAction = async (timesheetid, targetStatus) => {
    setActionError(null);
    let rejectionComment = null;

    // IF REJECTING: Require management justification text string input
    if (targetStatus === 2) {
      rejectionComment = window.prompt("Provide the operational reason for rejecting this entry row block:");
      if (rejectionComment === null) return; 
      if (rejectionComment.trim() === "") {
        alert("A comment is mandatory to let employees know what needs correction.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/manager/timesheets/review/${timesheetid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: targetStatus, 
          supervisorId: userContext.id,
          rejection_comment: rejectionComment
        })
      });

      if (!response.ok) throw new Error("Could not update authorization tracking parameters.");
      fetchTeamLogs(userContext.id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDayEntries = teamLogs.filter(ts => ts.timesheetdate && ts.timesheetdate.split('T')[0] === selectedDate);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={styles.topHeader}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', color: C.secondary, fontSize: '22px' }}>Time Sheet Approvals Workspace</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Select daily blocks to inspect team member log timelines
          </p>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={styles.infoBadge}>
            <span style={styles.infoLabel}>Month</span>
            <strong>{weekMonthLabel}</strong>
          </div>
          <div style={styles.infoBadge}>
            <span style={styles.infoLabel}>Role Scope</span>
            <strong style={{ color: C.accent, textTransform: 'uppercase' }}>{userContext.role || 'Supervisor'}</strong>
          </div>
        </div>
      </div>

      <div style={styles.weekContainer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setWeekOffset(o => o - 1)} style={styles.navBtn}>◀ Prev</button>
          <div style={{ fontSize: '14px', fontWeight: 'bold', width: '60px', textAlign: 'center' }}>WEEK</div>
        </div>
        
        <div style={styles.daysRow}>
          {currentWeekDays.map((dateObj) => {
            const dateStr = dateObj.toISOString().split('T')[0];
            const isSelected = selectedDate === dateStr;
            const dayName = dateObj.toLocaleString('default', { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const pendingTasks = getPendingAlertCount(dateStr);

            return (
              <div 
                key={dateStr} 
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  ...styles.dayBlock,
                  borderColor: isSelected ? '#2b7da1' : '#e2e8f0',
                  backgroundColor: isSelected ? '#f0f9ff' : '#fff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '12px', color: isSelected ? '#0284c7' : C.muted, fontWeight: '600' }}>{dayName}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: isSelected ? '#0369a1' : C.text, margin: '2px 0' }}>{dayNum}</div>
                <div style={{ minHeight: '16px' }}>
                  {pendingTasks > 0 ? (
                    <span style={styles.pendingIndicator}>⚡ {pendingTasks} Action</span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#16a34a' }}>{isSelected ? 'Viewing' : ''}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => setWeekOffset(o => o + 1)} style={styles.navBtn}>Next ▶</button>
      </div>

      <div style={styles.entryContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#334155', fontSize: '16px' }}>
            Team Activity Logs for <span style={{ color: '#2b7da1' }}>{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </h3>
        </div>

        {actionError && <div style={styles.errorBanner}>{actionError}</div>}

        <div style={styles.rowHeader}>
          <div style={{ flex: 1.2 }}>Employee</div>
          <div style={{ flex: 1 }}>Relationship</div>
          <div style={{ flex: 1.2 }}>Project / Context</div>
          <div style={{ flex: 0.6, textAlign: 'center' }}>Time</div>
          <div style={{ flex: 2.2 }}>Task Story Details</div>
          <div style={{ flex: 1.3, textAlign: 'center' }}>Approval Operations</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeDayEntries.map((row) => {
            const isDirect = String(row.DirectSupervisor) === String(userContext.id);
            const isBillable = row.projectid && row.projectid !== 0;

            return (
              <div key={row.timesheetid} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
                <div style={styles.entryRow}>
                  
                  {/* Employee Info */}
                  <div style={{ flex: 1.2, fontWeight: '700', color: C.secondary }}>
                    {row.FirstName} {row.LastName}
                    <div style={{ fontSize: '11px', color: C.muted, fontWeight: 'normal' }}>{row.DepartmentName || 'Operations'}</div>
                  </div>

                  {/* Context Assignment Block */}
                  <div style={{ flex: 1 }}>
                    {isDirect ? (
                      <span style={{ ...styles.roleBadge, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>Direct Manager</span>
                    ) : (
                      <span style={{ ...styles.roleBadge, background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>HR Oversight</span>
                    )}
                  </div>

                  {/* Project Alignment Column */}
                  <div style={{ flex: 1.2 }}>
                    {isBillable ? (
                      <span style={styles.projectTag}>Project ID: #{row.projectid}</span>
                    ) : (
                      <span style={{ ...styles.projectTag, background: '#f1f5f9', color: '#475569' }}>Internal Work</span>
                    )}
                  </div>

                  {/* Tracked Units */}
                  <div style={{ flex: 0.6, textAlign: 'center', fontWeight: 'bold', color: C.primary }}>
                    {row.tothrs}h {row.totmin}m
                  </div>

                  {/* Task Story */}
                  <div style={{ flex: 2.2, fontSize: '13px', color: '#475569', paddingRight: '10px', lineHeight: '1.4' }}>
                    "{row.comments}"
                  </div>

                  {/* Verification Pipeline CTA Buttons */}
                  <div style={{ flex: 1.3, display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    {row.status === 0 ? (
                      <>
                        <button disabled={isSubmitting} onClick={() => handleReviewAction(row.timesheetid, 1)} style={styles.actionBtn.approve}>Approve</button>
                        <button disabled={isSubmitting} onClick={() => handleReviewAction(row.timesheetid, 2)} style={styles.actionBtn.reject}>Reject</button>
                      </>
                    ) : (
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: row.status === 1 ? '#e1f5ee' : '#ffe6e6',
                        color: row.status === 1 ? C.success : C.danger
                      }}>
                        {row.status === 1 ? '✓ Approved' : '✗ Rejected'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline confirmation banner tracking past manager rejection notes */}
                {row.status === 2 && row.rejection_comment && (
                  <div style={styles.managerNoteAttachment}>
                    📋 **Submitted Rejection Reason:** "{row.rejection_comment}"
                  </div>
                )}
              </div>
            );
          })}

          {activeDayEntries.length === 0 && !isLoading && (
            <div style={{ padding: '30px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>
              No team member effort logs tracked for this specific calendar date.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' },
  infoBadge: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  infoLabel: { fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' },
  weekContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' },
  navBtn: { background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: '6px', color: '#475569', fontWeight: '600', cursor: 'pointer' },
  daysRow: { display: 'flex', gap: '10px', flex: 1, justifyContent: 'center' },
  dayBlock: { width: '85px', height: '85px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px solid', borderRadius: '12px', transition: 'all 0.2s' },
  pendingIndicator: { fontSize: '10px', color: '#b45309', background: '#fff3cd', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' },
  entryContainer: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  rowHeader: { display: 'flex', gap: '12px', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '12px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  entryRow: { display: 'flex', gap: '12px', alignItems: 'center' },
  roleBadge: { padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' },
  projectTag: { padding: '4px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', background: '#e0f2fe', color: '#0369a1', display: 'inline-block' },
  statusBadge: { padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', width: '100%', textAlign: 'center', boxSizing: 'border-box' },
  errorBanner: { color: '#ef4444', background: '#fef2f2', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' },
  actionBtn: {
    approve: { background: '#0f6e56', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', flex: 1 },
    reject: { background: 'transparent', color: '#b91c1c', border: '1px solid #fee2e2', backgroundColor: '#fff5f5', padding: '7px 14px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', flex: 1 }
  },
  managerNoteAttachment: {
    fontSize: '12px',
    color: '#475569',
    background: '#f8fafc',
    padding: '6px 12px',
    borderRadius: '6px',
    marginTop: '6px',
    border: '1px dashed #cbd5e1',
    width: 'fit-content'
  }
};

export default ManagerTimesheetReview;