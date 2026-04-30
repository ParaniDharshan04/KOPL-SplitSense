// client/src/components/LoadingSpinner.js
import React from "react";

const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
};

export default LoadingSpinner;
