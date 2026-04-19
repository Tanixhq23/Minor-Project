import React from "react";

const Loader = () => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      width: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(10px)",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .loader-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e1e8ed;
            border-top: 4px solid var(--primary, #2563eb);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          .loader-text {
            font-family: 'Inter', sans-serif;
            color: #475569;
            font-size: 1.1rem;
            font-weight: 500;
            letter-spacing: -0.01em;
          }
        `}
      </style>
      <div className="loader-spinner"></div>
      <div className="loader-text">Securing your health vault...</div>
    </div>
  );
};

export default Loader;
