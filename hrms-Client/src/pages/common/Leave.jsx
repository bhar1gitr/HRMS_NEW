import React, { useState, useEffect, useCallback } from "react";
import { C } from "../../theme";
import { apiUrl } from "../../URL";

import BalanceCards     from "../../components/leave/BalanceCards";
import ApplyLeaveTab    from "../../components/leave/ApplyLeaveTab";
import MyRequestsTab    from "../../components/leave/MyRequestsTab";
import TeamRequestsTab  from "../../components/leave/TeamRequestsTab";
import LeaveRequestsTab from "../../components/leave/LeaveRequestsTab";
import HolidaysTab      from "../../components/leave/HolidaysTab";
import LeaveCalendarTab from "../../components/leave/LeaveCalendarTab";
import LeavePoliciesTab from "../../components/leave/LeavePoliciesTab";
import ViewDetailsModal from "../../components/leave/ViewDetailsModal";

// ─── Tab config per role ───────────────────────────────────────────────────────
// Roles: employee | manager | hr | admin
const TABS_BY_ROLE = {
  employee: [
    { key: "apply",    label: "Apply Leave"  },
    { key: "requests", label: "My Requests"  },
    { key: "holidays", label: "Holidays"     },
  ],
  manager: [
    { key: "apply", label: "Apply Leave" },
    { key: "team",     label: "Team Requests" },
    { key: "requests", label: "My Requests"   },
    { key: "holidays", label: "Holidays"      },
  ],
 hr: [
    { key: "apply", label: "Apply Leave" },
    { key: "allreq",   label: "Leave Requests"  },
    { key: "calendar", label: "Leave Calendar"  },
    { key: "holidays", label: "Holidays"        },
  ],
  admin: [
    { key: "allreq",   label: "Leave Requests"  },
    { key: "calendar", label: "Leave Calendar"  },
    { key: "policies", label: "Leave Policies"  },
    { key: "holidays", label: "Holidays"        },
  ],
};

const DEFAULT_TAB = {
  employee: "apply",
  manager:  "team",
  hr:       "allreq",
  admin:    "allreq",
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Leave() {
  const token = localStorage.getItem("token");
  const role  = (localStorage.getItem("role") || "employee").toLowerCase();

  const tabs       = TABS_BY_ROLE[role] ?? TABS_BY_ROLE.employee;
  const defaultTab = DEFAULT_TAB[role]  ?? "apply";

  const [activeTab,     setActiveTab]     = useState(defaultTab);
  const [balances,      setBalances]      = useState({});
  const [gender,        setGender]        = useState("male"); // drives maternity visibility
  const [myRequests,    setMyRequests]    = useState([]);
  const [teamRequests,  setTeamRequests]  = useState([]);
  const [allRequests,   setAllRequests]   = useState([]);
  const [flexiSelected, setFlexiSelected] = useState([]);
  const [viewRequest,   setViewRequest]   = useState(null);
  const [showModal,     setShowModal]     = useState(false);
  const [loading,       setLoading]       = useState(true);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Balance + my requests for all roles
      const [balRes, myRes] = await Promise.all([
        fetch(`${apiUrl}/api/leaves/balance`,      { headers }),
        fetch(`${apiUrl}/api/leaves/my-requests`,  { headers }),
      ]);

      if (balRes.ok) {
        const bal = await balRes.json();
        setBalances(bal);
        // Maternity key only present if backend detected female
        setGender(bal.Maternity !== undefined ? "female" : "male");
      }
      if (myRes.ok) setMyRequests(await myRes.json());

      if (role === "manager") {
        const r = await fetch(`${apiUrl}/api/leaves/pending-approvals`, { headers });
        if (r.ok) setTeamRequests(await r.json());
      }

      if (role === "hr" || role === "admin") {
        const r = await fetch(`${apiUrl}/api/leaves/all-requests`, { headers });
        if (r.ok) setAllRequests(await r.json());
      }
    } catch (err) {
      console.error("Leave fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [role, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSubmit = async (form) => {
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== "attachment" && v !== null && v !== undefined) fd.append(k, v);
      });
      if (form.attachment) fd.append("attachment", form.attachment);

      const res = await fetch(`${apiUrl}/api/leaves/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (res.ok) {
        alert("Leave application submitted successfully!");
        fetchAll();
        setActiveTab("requests");
      } else {
        const err = await res.json();
        alert(err.message || "Failed to submit leave request.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again.");
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/api/leaves/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAll();
      else { const e = await res.json(); alert(e.message || "Failed to approve"); }
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/api/leaves/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAll();
      else { const e = await res.json(); alert(e.message || "Failed to reject"); }
    } catch (err) { console.error(err); }
  };

  const handleFlexiToggle = (option) => {
    setFlexiSelected(prev =>
      prev.includes(option)
        ? prev.filter(x => x !== option)
        : prev.length < 2 ? [...prev, option] : prev
    );
  };

  const handleViewDetails = (req) => { setViewRequest(req); setShowModal(true); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <h1 style={s.pageTitle}>Leave Management</h1>
        <p style={s.pageSub}>Manage your leave balances, applications and approvals</p>
      </div>

      {/* Balance cards — show for all roles so managers/HR can see too */}
      <BalanceCards balances={balances} gender={gender} />

      {/* Tab bar */}
      <div style={s.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            style={{ ...s.tab, ...(activeTab === tab.key ? s.tabActive : {}) }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div style={s.panel}>
        {loading && <div style={s.loading}>Loading…</div>}

        {!loading && activeTab === "apply" && (
          <ApplyLeaveTab onSubmit={handleSubmit} gender={gender} balances={balances} />
        )}

        {!loading && activeTab === "requests" && (
          <MyRequestsTab requests={myRequests} onViewDetails={handleViewDetails} />
        )}

        {!loading && activeTab === "team" && (
          <TeamRequestsTab
            requests={teamRequests}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={handleViewDetails}
          />
        )}

        {!loading && activeTab === "allreq" && (
          <LeaveRequestsTab
            requests={allRequests}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={handleViewDetails}
          />
        )}

        {!loading && activeTab === "calendar" && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: C.muted }}>
            <LeaveCalendarTab />
          </div>
        )}

        {!loading && activeTab === "holidays" && (
          <HolidaysTab flexiSelected={flexiSelected} onFlexiToggle={handleFlexiToggle} />
        )}

        {!loading && activeTab === "policies" && <LeavePoliciesTab />}
      </div>

      {showModal && (
        <ViewDetailsModal
          request={viewRequest}
          onClose={() => { setShowModal(false); setViewRequest(null); }}
        />
      )}
    </div>
  );
}

const s = {
  page:      { padding: "32px", background: C.bg, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  pageHead:  { marginBottom: "24px" },
  pageTitle: { fontSize: "24px", fontWeight: "700", color: C.text, margin: 0 },
  pageSub:   { fontSize: "14px", color: C.muted, marginTop: "6px" },
  tabs:      { display: "flex", border: `1px solid ${C.borderLight}`, borderRadius: "12px", overflow: "hidden", marginBottom: "20px", background: C.inputBg },
  tab:       { flex: 1, padding: "12px 16px", fontSize: "14px", color: C.muted, background: "transparent", border: "none", borderRight: `1px solid ${C.borderLight}`, cursor: "pointer", fontWeight: "500", transition: "all 0.2s" },
  tabActive: { background: C.card, color: C.primary, fontWeight: "600", boxShadow: `inset 0 -2px 0 ${C.primary}` },
  panel:     { background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: "12px", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  loading:   { padding: "60px 20px", textAlign: "center", color: C.muted, fontSize: "14px" },
};