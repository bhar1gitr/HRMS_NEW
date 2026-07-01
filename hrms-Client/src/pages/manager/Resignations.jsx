import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../URL';

export default function ManagerResignations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionForm, setActionForm] = useState({ comments: '', proposedLWD: '' });

  const fetchResignations = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const res = await fetch(`${apiUrl}/api/employee/all-resignations?role=manager&supervisorId=${storedUser?.id || ''}`);
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResignations(); }, []);

  const handleAction = async (nextStatus) => {
    if (!window.confirm(`Are you sure you want to transition this request to "${nextStatus}"?`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/employee/update-resignation-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resignationId: selectedReq.id,
          nextStatus: nextStatus,
          managerComments: actionForm.comments,
          confirmedLWD: actionForm.proposedLWD || null
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Workflow updated successfully!");
        setSelectedReq(null);
        setActionForm({ comments: '', proposedLWD: '' });
        fetchResignations();
      }
    } catch (err) {
      alert("Processing error occurred.");
    }
  };

  if (loading) return <div style={styles.loader}>Accessing management separation queues...</div>;

  return (
    <div style={styles.container}>
      <h2>Team Resignation Operations</h2>
      <div style={styles.splitLayout}>
        <div style={styles.listSide}>
          {requests.map(req => (
            <div key={req.id} onClick={() => setSelectedReq(req)} style={{...styles.reqCard, borderColor: selectedReq?.id === req.id ? '#3b82f6' : '#e2e8f0'}}>
              <strong>{req.FirstName} {req.LastName}</strong>
              <div style={styles.mutedText}>Submitted: {new Date(req.ResignationDate).toLocaleDateString('en-GB')}</div>
              <span style={styles.badge}>{req.Status}</span>
            </div>
          ))}
          {requests.length === 0 && <p>No departure requests recorded in your immediate reporting chain.</p>}
        </div>

        {selectedReq && (
          <div style={styles.detailSide}>
            <h3>Review Departure Request</h3>
            <p><strong>Employee:</strong> {selectedReq.FirstName} {selectedReq.LastName}</p>
            <p><strong>Primary Trigger Reason:</strong> {selectedReq.PrimaryReason}</p>
            <p><strong>Employee Comments:</strong> "{selectedReq.AdditionalComments || 'No details provided'}"</p>
            <p><strong>Calculated Notice Target LWD:</strong> {new Date(selectedReq.SystemLastWorkingDate).toLocaleDateString('en-GB')}</p>
            
            <hr style={styles.hr}/>
            
            <label style={styles.label}>Manager Feedback/Notes</label>
            <textarea style={styles.textarea} value={actionForm.comments} onChange={e => setActionForm({...actionForm, comments: e.target.value})} placeholder="Provide separation assessment parameters..."/>
            
            <label style={styles.label}>Recommend Alternative LWD (Optional)</label>
            <input type="date" style={styles.input} value={actionForm.proposedLWD} onChange={e => setActionForm({...actionForm, proposedLWD: e.target.value})}/>

            <div style={styles.btnRow}>
              <button onClick={() => handleAction("Manager LWD Propose")} style={styles.warnBtn}>Propose LWD Extension</button>
              <button onClick={() => handleAction("HR Review")} style={styles.successBtn}>Approve & Escalate to HR</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', fontFamily: 'system-ui, sans-serif' },
  splitLayout: { display: 'flex', gap: '24px', marginTop: '20px' },
  listSide: { flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' },
  detailSide: { flex: 1.5, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  reqCard: { padding: '16px', background: '#fff', border: '2px solid', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' },
  mutedText: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  badge: { display: 'inline-block', marginTop: '8px', padding: '3px 8px', background: '#f1f5f9', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px' },
  label: { display: 'block', margin: '14px 0 6px 0', fontSize: '13px', fontWeight: '600' },
  textarea: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px', outline: 'none' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' },
  btnRow: { display: 'flex', gap: '12px', marginTop: '20px' },
  successBtn: { background: '#16a34a', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', flex: 1 },
  warnBtn: { background: '#b45309', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', flex: 1 },
  hr: { border: '0', borderTop: '1px solid #e2e8f0', margin: '20px 0' },
  loader: { padding: '40px', textAlign: 'center', color: '#64748b' }
};