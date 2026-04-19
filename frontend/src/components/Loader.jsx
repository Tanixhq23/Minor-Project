import React from "react";

const Loader = () => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      width: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(12px)",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 9999,
      transition: "opacity 0.3s ease"
    }}>
      <style>
        {`
          @keyframes pulse-spin {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
          }
          @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .loader-container {
            position: relative;
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
          }
          .loader-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border: 3px solid transparent;
            border-top: 3px solid var(--primary, #2563eb);
            border-right: 3px solid var(--primary, #2563eb);
            border-radius: 50%;
            animation: rotate 0.8s cubic-bezier(0.42, 0, 0.58, 1) infinite;
          }
          .loader-core {
            width: 40px;
            height: 40px;
            background-color: var(--primary, #2563eb);
            border-radius: 50%;
            opacity: 0.1;
            animation: pulse-spin 1.5s ease-in-out infinite;
          }
          .loader-text {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            text-align: center;
          }
          .loader-subtext {
            font-size: 0.8rem;
            color: #64748b;
            margin-top: 8px;
            font-weight: 400;
          }
        `}
      </style>
      <div className="loader-container">
        <div className="loader-ring"></div>
        <div className="loader-core"></div>
      </div>
      <div className="loader-text">HealthLock</div>
      <div className="loader-subtext">Initializing Secure Environment...</div>
    </div>
  );
};

export default Loader;
