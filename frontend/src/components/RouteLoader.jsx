import React from "react";

export default function RouteLoader() {
  return (
    <div className="route-loader" role="status" aria-live="polite" aria-label="Loading page">
      <div className="loader-orb" />
      <p className="loader-text">Loading Health-Lock...</p>
    </div>
  );
}
