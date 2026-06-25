import React from "react";
import { C, RADIUS } from "../../theme";

const LEAVE_TYPES = [
  {
    value: "Casual",
    label: "Casual Leave",
    total: 7,
    color: "#0c447c",
  },
  {
    value: "Sick",
    label: "Sick Leave",
    total: 7,
    color: "#993556",
  },
  {
    value: "Earned",
    label: "Earned Leave",
    total: 14,
    color: "#085041",
  },
  {
    value: "Flexi",
    label: "Flexi Holiday",
    total: 2,
    color: "#633806",
  },
  {
    value: "LWP",
    label: "Leave Without Pay",
    total: null,
    color: "#5f5e5a",
  },
  {
    value: "Maternity",
    label: "Maternity Leave",
    total: 180,
    color: "#72243e",
  },
];

export default function BalanceCards({ balances }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
        gap: "12px",
        marginBottom: "24px",
      }}
    >
      {LEAVE_TYPES.filter((lt) => {
        if (lt.value === "Maternity" && balances.Maternity === undefined)
          return false;
        return true;
      }).map((lt) => {
        const remaining = balances[lt.value] ?? 0;

        const used =
          lt.total !== null
            ? Math.max(0, lt.total - remaining)
            : 0;

        const pct =
          lt.total !== null
            ? Math.round((used / lt.total) * 100)
            : 0;

        return (
          <div
            key={lt.value}
            style={{
              background: C.card,
              border: `1px solid ${C.borderLight}`,
              borderRadius: RADIUS.card,
              padding: "16px 14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: C.muted,
                marginBottom: "6px",
              }}
            >
              {lt.label}
            </div>

            <div
              style={{
                fontSize: "30px",
                fontWeight: "700",
                color: lt.color,
              }}
            >
              {lt.total === null ? "—" : remaining}
            </div>

            <div
              style={{
                fontSize: "11px",
                color: C.muted,
                marginTop: "4px",
              }}
            >
              Total: {lt.total ?? "Unlimited"} · Used: {used}
            </div>

            {lt.total && (
              <div
                style={{
                  height: "3px",
                  background: C.borderLight,
                  borderRadius: "4px",
                  marginTop: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: lt.color,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}