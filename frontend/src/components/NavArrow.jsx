import React from "react";
import { useNavigate } from "react-router-dom";

export default function NavArrow({ fallback = "/" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  };

  return (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm rounded-circle btn-icon d-inline-flex align-items-center justify-content-center"
      onClick={handleBack}
      aria-label="Go back"
      title="Go back"
    >
      ←
    </button>
  );
}
