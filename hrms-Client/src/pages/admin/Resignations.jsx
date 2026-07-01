import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../URL';

export default function HrResignations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [finalLWD, setFinalLWD] = useState('');

  const fetchHrQueue = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/employee/all-resignations?role=hr`);
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } catch (err) {
      console.error(err);
    } { setLoading(false); }
  };

  useEffect(() => { fetchHrQueue(); }, []);

  const handleStatusTransition = async (targetStatus) => {
    try {
      const res = await fetch(`${apiUrl}/api/employee/update-resignation-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resignationId: selectedReq.id,
          nextStatus: targetStatus,
          confirmedLWD: targetStatus === "HR LWD Confirmed" ? finalLWD : null
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Status updated to: ${targetStatus}`);
        setSelectedReq(null);
        fetchHrQueue();
      }
    } catch (err) {
      alert("Error handling state adjustment workflow step.");
    }
  };

  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>Loading Corporate Separation Queues...</div>;

  return (
    <div style={styles.container}>
      <h2>HR Exit & Separation Management</h2>
      <div style={styles.splitLayout}>
        <div style={styles.listSide}>
          {requests.map(req => (
            <div key={req.id} onClick={() => { setSelectedReq(req); setFinalLWD(req.SystemLastWorkingDate ? req.SystemLastWorkingDate.split('T')[0] : ''); }} style={{...styles.reqCard, borderColor: selectedReq?.id === req.id ? '#d63a6e' : '#e2e8f0'}}>
              <strong>{req.FirstName} {req.LastName} ({req.DepartmentName})</strong>
              <div style={styles.mutedText}>Workflow Position: <strong style={{color:'#dc2626'}}>{req.Status}</strong></div>
            </div>
          ))}
        </div>

        {selectedReq && (
          <div style={styles.detailSide}>
            <h3>Executive Operations Board</h3>
            <p><strong>Employee profile:</strong> {selectedReq.FirstName} {selectedReq.LastName}</p>
            <p><strong>Current Active Step Location:</strong> {selectedReq.Status}</p>
            
            <label style={styles.label}>Confirm Final Last Working Date (LWD)</label>
            <input type="date" style={styles.input} value={finalLWD} onChange={e => setFinalLWD(e.target.value)}/>

            <div style={{...styles.btnRow, flexDirection:'column', gap: '10px', marginTop: '24px'}}>
              <button onClick={() => handleStatusTransition("Negotiation")} style={{...styles.actionStepBtn, background:'#f8fafc', color:'#334155', border:'1px solid #cbd5e1'}}>Move to Retentive Negotiation</button>
              <button onClick={() => handleStatusTransition("HR LWD Confirmed")} style={{...styles.actionStepBtn, background:'#0284c7', color:'#fff'}}>Lock Confirmed LWD</button>
              <button onClick={() => handleStatusTransition("Exit Interview")} style={{...styles.actionStepBtn, background:'#7c3aed', color:'#fff'}}>Trigger Exit Interview Stage</button>
              <button onClick={() => handleStatusTransition("Asset Clearance")} style={{...styles.actionStepBtn, background:'#ea580c', color:'#fff'}}>Initiate Asset Clearance NOC</button>
              <button onClick={() => handleStatusTransition("Closed")} style={{...styles.actionStepBtn, background:'#16a34a', color:'#fff'}}>Process Full & Final (Close File)</button>
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
  detailSide: { flex: 1.2, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' },
  reqCard: { padding: '16px', background: '#fff', border: '2px solid', borderRadius: '10px', cursor: 'pointer' },
  mutedText: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  label: { display: 'block', margin: '14px 0 6px 0', fontSize: '13px', fontWeight: '600' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' },
  btnRow: { display: 'flex' },
  actionStepBtn: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', textAlign: 'center' }
};