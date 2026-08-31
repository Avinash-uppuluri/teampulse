import React from "react";

const LABELS = {
  GREEN: "On track",
  YELLOW: "At risk",
  RED: "Critical",
};

export default function HealthIndicator({ health }) {
  if (!health) return null;
  return (
    <span className={`tp-badge tp-health--${health}`}>
      <span className="tp-health-dot" />
      {LABELS[health] || health}
    </span>
  );
}
