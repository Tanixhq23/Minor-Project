import React from "react";

export default function RouteLoader() {
  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center gap-3" role="status" aria-live="polite" aria-label="Loading page">
      <div className="spinner-border text-primary" role="presentation" />
      <p className="text-secondary mb-0">Loading Health-Lock...</p>
    </div>
  );
}
