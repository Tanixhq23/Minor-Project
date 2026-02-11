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
      className="nav-arrow-btn"
      onClick={handleBack}
      aria-label="Go back"
      title="Go back"
    >
      ←
    </button>
  );
}
