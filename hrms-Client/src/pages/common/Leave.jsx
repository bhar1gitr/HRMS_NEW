import React, { useState, useEffect, useContext } from "react";
import { C } from "../../theme";
import { apiUrl } from "../../URL";


// Components
import BalanceCards from "../../components/leave/BalanceCards";
import ApplyLeaveTab from "../../components/leave/ApplyLeaveTab";
import MyRequestsTab from "../../components/leave/MyRequestsTab";
import TeamRequestsTab from "../../components/leave/TeamRequestsTab";
import LeaveRequestsTab from "../../components/leave/LeaveRequestsTab";
import HolidaysTab from "../../components/leave/HolidaysTab";
import LeavePoliciesTab from "../../components/leave/LeavePoliciesTab";
import ViewDetailsModal from "../../components/leave/ViewDetailsModal";

export default function Leave() {
  const token = localStorage.getItem("token");
const role = localStorage.getItem("role") || "employee";
  const [activeTab, setActiveTab] = useState("apply");

  const [balances, setBalances] = useState({
  Casual: 7,
  Sick: 7,
  Earned: 0,
  Flexi: 2,
  LWP: 0,
});

  const [myRequests, setMyRequests] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  const [flexiSelected, setFlexiSelected] = useState([]);

  const [viewRequest, setViewRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  

  useEffect(() => {
    fetchLeaveData();
  }, [role]);

  const fetchLeaveData = async () => {
    try {

      const token = localStorage.getItem("token");

console.log("TOKEN =", token);

      const requests = [
        fetch(`${apiUrl}/api/leaves/balance`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
}),
        fetch(`${apiUrl}/api/leaves/my-requests`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
}),
        fetch(`${apiUrl}/api/leaves/pending-approvals`),
      ];

      if (role === "hr" || role === "admin") {
        requests.push(fetch(`${apiUrl}/api/leaves/all-requests`));
      }

      const responses = await Promise.all(requests);

      const [balRes, myRes, approvalRes, allRes] = responses;

      if (balRes?.ok) {
        setBalances(await balRes.json());
      }

      if (myRes?.ok) {
        setMyRequests(await myRes.json());
      }

      if (approvalRes?.ok) {
        setPendingApprovals(await approvalRes.json());
      }

      if (allRes?.ok) {
        setLeaveRequests(await allRes.json());
      }
    } catch (err) {
      console.error("Leave fetch error:", err);
    }
  };

  const handleSubmit = async (form) => {
    try {
      const fd = new FormData();

      Object.keys(form).forEach((key) => {
        if (key !== "attachment") {
          fd.append(key, form[key]);
        }
      });

      if (form.attachment) {
        fd.append("attachment", form.attachment);
      }

      const token = localStorage.getItem("token");

const res = await fetch(`${apiUrl}/api/leaves/apply`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: fd,
});

      if (res.ok) {
        alert("Leave application submitted!");
        fetchLeaveData();
        setActiveTab("requests");
      } else {
        alert("Failed to submit leave request.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  };

  const handleApprove = async (id) => {
    try {
      await fetch(`${apiUrl}/api/leaves/${id}/approve`, {
        method: "POST",
      });

      fetchLeaveData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await fetch(`${apiUrl}/api/leaves/${id}/reject`, {
        method: "POST",
      });

      fetchLeaveData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFlexiToggle = (option) => {
    setFlexiSelected((prev) =>
      prev.includes(option)
        ? prev.filter((x) => x !== option)
        : prev.length < 2
        ? [...prev, option]
        : prev
    );
  };

  const handleViewDetails = (request) => {
    setViewRequest(request);
    setShowModal(true);
  };

  const getTabs = () => {
    switch (role) {
      case "employee":
        return [
          { key: "apply", label: "Apply Leave" },
          { key: "requests", label: "My Requests" },
          { key: "holidays", label: "Holidays" },
        ];

      case "manager":
        return [
          { key: "team", label: "Team Requests" },
          { key: "requests", label: "My Requests" },
          { key: "holidays", label: "Holidays" },
        ];

      case "hr":
        return [
          { key: "requests", label: "Leave Requests" },
          { key: "calendar", label: "Leave Calendar" },
          { key: "holidays", label: "Holidays" },
        ];

      case "admin":
        return [
          { key: "requests", label: "Leave Requests" },
          { key: "policies", label: "Leave Policies" },
          { key: "holidays", label: "Holidays" },
        ];

      default:
        return [
          { key: "apply", label: "Apply Leave" },
          { key: "requests", label: "My Requests" },
          { key: "holidays", label: "Holidays" },
        ];
    }
  };

  const tabs = getTabs();

  useEffect(() => {
  if (role === "manager") {
    setActiveTab("team");
  } else if (role === "hr" || role === "admin") {
    setActiveTab("requests");
  } else {
    setActiveTab("apply");
  }
}, [role]);

  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <h1 style={s.pageTitle}>Leave Management</h1>
        <p style={s.pageSub}>
          Manage your leave balances, applications and approvals
        </p>
      </div>

      <BalanceCards balances={balances} />

      <div style={s.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={{
              ...s.tab,
              ...(activeTab === tab.key ? s.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={s.panel}>
        {activeTab === "apply" && (
          <ApplyLeaveTab onSubmit={handleSubmit} />
        )}

        {activeTab === "requests" &&
          (role === "employee" || role === "manager") && (
            <MyRequestsTab
              requests={myRequests}
              onViewDetails={handleViewDetails}
            />
          )}

        {activeTab === "team" && (
          <TeamRequestsTab
            requests={pendingApprovals}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={handleViewDetails}
          />
        )}

        {activeTab === "requests" &&
          (role === "hr" || role === "admin") && (
            <LeaveRequestsTab
              requests={leaveRequests}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewDetails={handleViewDetails}
            />
          )}

        {activeTab === "calendar" && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: C.muted,
            }}
          >
            Leave Calendar feature coming soon...
          </div>
        )}

        {activeTab === "holidays" && (
          <HolidaysTab
            flexiSelected={flexiSelected}
            onFlexiToggle={handleFlexiToggle}
          />
        )}

        {activeTab === "policies" && (
          <LeavePoliciesTab />
        )}
      </div>

      {showModal && (
        <ViewDetailsModal
          request={viewRequest}
          onClose={() => {
            setShowModal(false);
            setViewRequest(null);
          }}
        />
      )}
    </div>
  );
}

const s = {
  page: {
    padding: "32px",
    background: C.bg,
    minHeight: "100vh",
    fontFamily: "'Inter', system-ui, sans-serif",
  },

  pageHead: {
    marginBottom: "24px",
  },

  pageTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: C.text,
    margin: 0,
  },

  pageSub: {
    fontSize: "14px",
    color: C.muted,
    marginTop: "6px",
  },

  tabs: {
    display: "flex",
    border: `1px solid ${C.borderLight}`,
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "20px",
    background: C.inputBg,
  },

  tab: {
    flex: 1,
    padding: "12px 16px",
    fontSize: "14px",
    color: C.muted,
    background: "transparent",
    border: "none",
    borderRight: `1px solid ${C.borderLight}`,
    cursor: "pointer",
    fontWeight: "500",
  },

  tabActive: {
    background: C.card,
    color: C.primary,
    fontWeight: "600",
    boxShadow: `inset 0 -2px 0 ${C.primary}`,
  },

  panel: {
    background: C.card,
    border: `1px solid ${C.borderLight}`,
    borderRadius: "12px",
    padding: "28px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
};