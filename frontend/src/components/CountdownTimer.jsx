import { useState, useEffect } from "react";

export default function CountdownTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const expiry = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        clearInterval(timer);
        if (onExpire) onExpire();
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "0.9rem",
      fontWeight: '600',
      color: timeLeft === "00:00" ? "#ef4444" : "var(--primary)",
      backgroundColor: timeLeft === "00:00" ? "#fee2e2" : "#f0f9ff",
      padding: "4px 12px",
      borderRadius: "20px",
      border: `1px solid ${timeLeft === "00:00" ? "#fecaca" : "#bae6fd"}`
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      {timeLeft === "00:00" ? "Expired" : `Expires in: ${timeLeft}`}
    </div>
  );
}
