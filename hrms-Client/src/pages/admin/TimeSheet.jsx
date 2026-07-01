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
  success: '#0f6e56',
  warning: '#b45309',
  warningBg: '#fff3cd'
};

// Reusable Select Component for Edit Mode
const SelectGroup = ({ value, onChange, options, defaultLabel = "Select..." }) => (
  <select value={value} onChange={onChange} style={styles.inlineSelect}>
    <option value="">{defaultLabel}</option>
    {options.map(opt => (
      <option key={opt.id} value={opt.id}>{opt.name}</option>
    ))}
  </select>
);

const ManagerTimesheetReview = () => {
  const [teamLogs, setTeamLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  const [userContext, setUserContext] = useState({ id: null, name: '', role: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [weekOffset, setWeekOffset] = useState(0); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Inline Edit State
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchMasterData = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/projects'),
        fetch('http://localhost:5000/api/admin/tasks')
      ]);
      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.map(p => ({ id: p.projectid || p.id, name: p.projectcode || p.name })));
      }
      if (taskRes.ok) {
        const tData = await taskRes.json();
        setTasks(tData.map(t => ({ id: t.taskid || t.id, name: t.taskname || t.name })));
      }
    } catch (err) {
      console.error("Error loading master data:", err);
    }
  };

  const fetchTeamLogs = async (userId, role) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/manager/timesheets?supervisorId=${userId}&role=${role}`);
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
      fetchMasterData();
      fetchTeamLogs(storedUser.id, storedUser.role);
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

  // --- MANAGER ACTIONS ---
  const handleReviewAction = async (timesheetid, targetStatus) => {
    setActionError(null);
    let rejectionComment = null;

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
        body: JSON.stringify({ status: targetStatus, supervisorId: userContext.id, rejection_comment: rejectionComment })
      });
      if (!response.ok) throw new Error("Could not update authorization tracking parameters.");
      fetchTeamLogs(userContext.id, userContext.role);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HR INLINE EDIT ACTIONS ---
  const handleEditClick = (row) => {
    setEditingRow(row.timesheetid);
    setEditForm({
      billingType: row.projectid && row.projectid !== 0 ? 'billable' : 'non-billable',
      projectid: row.projectid || '',
      taskid: row.taskid || '',
      tothrs: row.tothrs || '0',
      totmin: row.totmin || '0',
      comments: row.comments || ''
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'billingType' && value === 'non-billable') {
        updated.projectid = '0';
        updated.taskid = '0';
      }
      return updated;
    });
  };

  const handleSaveEdit = async (timesheetid) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...editForm,
        activitytypeid: editForm.billingType === 'billable' ? 1 : 0,
        nonprojectactivityid: editForm.billingType === 'non-billable' ? 1 : 0,
        projectid: editForm.billingType === 'billable' ? editForm.projectid : 0,
        taskid: editForm.billingType === 'billable' ? editForm.taskid : 0,
        role: userContext.role // Let backend know it's HR
      };

      const response = await fetch(`http://localhost:5000/api/employee/timesheets/${timesheetid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save HR modifications.");
      
      setEditingRow(null);
      fetchTeamLogs(userContext.id, userContext.role);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDayEntries = teamLogs.filter(ts => ts.timesheetdate && ts.timesheetdate.split('T')[0] === selectedDate);
  const isGlobalRole = userContext.role === 'admin' || userContext.role === 'hr';
  const isHrRole = userContext.role === 'hr';

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={styles.topHeader}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', color: C.secondary, fontSize: '22px' }}>Time Sheet Approvals Workspace</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isGlobalRole ? "Global Oversight Mode" : "Select daily blocks to inspect team member log timelines"}
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
                    <span style={styles.pendingIndicator}>⚡ {pendingTasks} {isGlobalRole ? 'Pending' : 'Action'}</span>
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
          <div style={{ flex: 1 }}>Context</div>
          <div style={{ flex: 1.2 }}>Project / Task</div>
          <div style={{ flex: 0.8, textAlign: 'center' }}>Time</div>
          <div style={{ flex: 2 }}>Details</div>
          <div style={{ flex: 1.5, textAlign: 'center' }}>Action / Status</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeDayEntries.map((row) => {
            const isDirect = String(row.DirectSupervisor) === String(userContext.id);
            const isIndirect = String(row.IndirectSupervisor) === String(userContext.id);
            const isBillable = row.projectid && row.projectid !== 0;
            const isEditing = editingRow === row.timesheetid;

            return (
              <div key={row.timesheetid} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
                
                {/* ----------------- INLINE EDIT MODE (HR ONLY) ----------------- */}
                {isEditing ? (
                  <div style={styles.entryRow}>
                    <div style={{ flex: 1.2, fontWeight: '700', color: C.secondary }}>
                      {row.FirstName} {row.LastName}
                    </div>

                    <div style={{ flex: 1 }}>
                      <select 
                        value={editForm.billingType} 
                        onChange={(e) => handleEditChange('billingType', e.target.value)} 
                        style={styles.inlineSelect}
                      >
                        <option value="billable">Billable</option>
                        <option value="non-billable">Non-Bill</option>
                      </select>
                    </div>

                    <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {editForm.billingType === 'billable' ? (
                        <>
                          <SelectGroup value={editForm.projectid} options={projects} onChange={(e) => handleEditChange('projectid', e.target.value)} defaultLabel="Project..." />
                          <SelectGroup value={editForm.taskid} options={tasks} onChange={(e) => handleEditChange('taskid', e.target.value)} defaultLabel="Task..." />
                        </>
                      ) : (
                        <div style={styles.disabledCell}>Internal Task</div>
                      )}
                    </div>

                    <div style={{ flex: 0.8, display: 'flex', gap: '4px' }}>
                      <input type="number" value={editForm.tothrs} onChange={(e) => handleEditChange('tothrs', e.target.value)} style={styles.inlineInput} placeholder="Hrs" />
                      <input type="number" value={editForm.totmin} onChange={(e) => handleEditChange('totmin', e.target.value)} style={styles.inlineInput} placeholder="Min" />
                    </div>

                    <div style={{ flex: 2 }}>
                      <input type="text" value={editForm.comments} onChange={(e) => handleEditChange('comments', e.target.value)} style={styles.inlineInput} />
                    </div>

                    <div style={{ flex: 1.5, display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => handleSaveEdit(row.timesheetid)} disabled={isSubmitting} style={styles.actionBtn.approve}>Save</button>
                      <button onClick={() => setEditingRow(null)} disabled={isSubmitting} style={styles.actionBtn.cancel}>Cancel</button>
                    </div>
                  </div>

                ) : (

                /* ----------------- STANDARD DISPLAY MODE ----------------- */
                  <div style={styles.entryRow}>
                    
                    {/* Employee Info */}
                    <div style={{ flex: 1.2, fontWeight: '700', color: C.secondary }}>
                      {row.FirstName} {row.LastName}
                      <div style={{ fontSize: '11px', color: C.muted, fontWeight: 'normal' }}>{row.DepartmentName || 'Operations'}</div>
                    </div>

                    {/* Context Badge */}
                    <div style={{ flex: 1 }}>
                      {isDirect ? (
                        <span style={{ ...styles.roleBadge, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>Direct Manager</span>
                      ) : isIndirect ? (
                        <span style={{ ...styles.roleBadge, background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>HR Oversight</span>
                      ) : isGlobalRole ? (
                        <span style={{ ...styles.roleBadge, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>Global Admin</span>
                      ) : (
                        <span style={{ ...styles.roleBadge, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>Unassigned</span>
                      )}
                    </div>

                    {/* Project Column */}
                    <div style={{ flex: 1.2 }}>
                      {isBillable ? (
                        <span style={styles.projectTag}>Project ID: #{row.projectid}</span>
                      ) : (
                        <span style={{ ...styles.projectTag, background: '#f1f5f9', color: '#475569' }}>Internal Work</span>
                      )}
                    </div>

                    {/* Tracked Time */}
                    <div style={{ flex: 0.8, textAlign: 'center', fontWeight: 'bold', color: C.primary }}>
                      {row.tothrs}h {row.totmin}m
                    </div>

                    {/* Task Story */}
                    <div style={{ flex: 2, fontSize: '13px', color: '#475569', paddingRight: '10px', lineHeight: '1.4' }}>
                      "{row.comments}"
                    </div>

                    {/* Action & Status Logic */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                      
                      {/* STATUS DISPLAY */}
                      {row.status === 0 ? (
                        <span style={{ ...styles.statusBadge, backgroundColor: C.warningBg, color: C.warning }}>⏳ Pending Manager</span>
                      ) : row.status === 1 ? (
                        <span style={{ ...styles.statusBadge, backgroundColor: '#e1f5ee', color: C.success }}>✓ Approved</span>
                      ) : (
                        <span style={{ ...styles.statusBadge, backgroundColor: '#ffe6e6', color: C.danger }}>✗ Rejected</span>
                      )}

                      <div style={{ display: 'flex', gap: '6px', width: '100%', justifyContent: 'center' }}>
                        
                        {/* MANAGER: Can Approve/Reject ONLY if Pending */}
                        {!isGlobalRole && row.status === 0 && (
                          <>
                            <button disabled={isSubmitting} onClick={() => handleReviewAction(row.timesheetid, 1)} style={styles.actionBtn.approve}>Approve</button>
                            <button disabled={isSubmitting} onClick={() => handleReviewAction(row.timesheetid, 2)} style={styles.actionBtn.reject}>Reject</button>
                          </>
                        )}

                        {/* HR ONLY: Can Edit at ANY stage. Admin does NOT see this button. */}
                        {isHrRole && (
                          <button onClick={() => handleEditClick(row)} style={styles.actionBtn.hrEdit} title="HR Override Edit">
                            ✏️ Edit Record
                          </button>
                        )}

                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection Note Display */}
                {row.status === 2 && row.rejection_comment && !isEditing && (
                  <div style={styles.managerNoteAttachment}>
                    📋 **Manager Rejection Reason:** "{row.rejection_comment}"
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
  pendingIndicator: { fontSize: '10px', color: '#b45309', background: '#fff3cd', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', textAlign: 'center' },
  entryContainer: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  rowHeader: { display: 'flex', gap: '12px', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '12px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  entryRow: { display: 'flex', gap: '12px', alignItems: 'center' },
  
  inlineInput: { width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' },
  inlineSelect: { width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' },
  disabledCell: { width: '100%', padding: '6px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#94a3b8', fontSize: '12px', textAlign: 'center', boxSizing: 'border-box' },

  roleBadge: { padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' },
  projectTag: { padding: '4px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', background: '#e0f2fe', color: '#0369a1', display: 'inline-block' },
  statusBadge: { padding: '5px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', width: '100%', textAlign: 'center', boxSizing: 'border-box' },
  errorBanner: { color: '#ef4444', background: '#fef2f2', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' },
  
  actionBtn: {
    approve: { background: '#0f6e56', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '11px', flex: 1 },
    reject: { background: 'transparent', color: '#b91c1c', border: '1px solid #fee2e2', backgroundColor: '#fff5f5', padding: '5px 12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '11px', flex: 1 },
    hrEdit: { background: '#f8fafc', color: '#2b7da1', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '11px', width: '100%' },
    cancel: { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '11px', flex: 1 }
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