// client/src/components/EmptyState.js
import React from "react";

const EmptyState = ({ title = "No data found", subtitle = "Try adding records to get started." }) => {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
};

export default EmptyState;
