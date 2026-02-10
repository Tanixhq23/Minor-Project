import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getSession, logout } from "../lib/api.js";

export default function DoctorScanner() {
  const navigate = useNavigate();
  const qrInstanceRef = useRef(null);
  const [scanStatus, setScanStatus] = useState("");
  const [reportError, setReportError] = useState("");
  const [reportFile, setReportFile] = useState("");
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      if (!session?.role || session.role !== "doctor") {
        navigate("/signin", { replace: true });
      }
    });
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const token = params.get("token");
    if (id && token) {
      fetchReport(id, token);
    }
  }, []);

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  const getQrInstance = () => {
    if (!qrInstanceRef.current && window.Html5Qrcode) {
      qrInstanceRef.current = new window.Html5Qrcode("reader");
    }
    return qrInstanceRef.current;
  };

  const fetchReport = async (recordId, token) => {
    try {
      setReportError("");
      setScanStatus("QR Code scanned! Attempting to fetch report...");
      const res = await apiFetch(`/api/records/${recordId}?token=${encodeURIComponent(token)}`, {
        method: "GET",
        headers: {}
      });
      const data = await res.json();
      setShowReport(true);
      if (res.ok) {
        setReportFile(data.data.medicalData.file);
      } else {
        setReportFile("");
        setReportError(data?.error?.message || "Report access failed.");
      }
    } catch {
      setShowReport(true);
      setReportFile("");
      setReportError("Network error or server unavailable.");
    }
  };

  const handleDecodedText = async (decodedText) => {
    try {
      const url = new URL(decodedText);
      const recordId = url.searchParams.get("id");
      const token = url.searchParams.get("token");
      if (!recordId || !token) {
        setShowReport(true);
        setReportError("Error: Invalid QR Code data. Missing record ID or token.");
        return;
      }
      await fetchReport(recordId, token);
    } catch {
      setShowReport(true);
      setReportError("Error: Invalid QR Code data (Not a valid URL).");
    }
  };

  const startScanner = async () => {
    const instance = getQrInstance();
    if (!instance) {
      setScanStatus("QR scanner library not loaded.");
      return;
    }
    try {
      const devices = await window.Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setScanStatus("No cameras found.");
        return;
      }
      const cameraId = devices[0].id;
      await instance.start(
        cameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          instance.stop().catch(() => {});
          handleDecodedText(decodedText);
        },
        () => {}
      );
      setScanStatus("Scanning for QR Code...");
    } catch (err) {
      setScanStatus(`Error starting camera: ${err.message || err}`);
    }
  };

  const stopScanner = async () => {
    const instance = getQrInstance();
    if (!instance) return;
    try {
      await instance.stop();
      setScanStatus("Scanner stopped.");
    } catch {
      // ignore
    }
  };

  const scanFromFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const instance = getQrInstance();
    if (!instance) {
      setScanStatus("QR scanner library not loaded.");
      return;
    }
    try {
      setScanStatus("Scanning QR code from image...");
      const decodedText = await instance.scanFile(file, false);
      await handleDecodedText(decodedText);
    } catch {
      setScanStatus("Error: No QR code found in the image.");
    }
  };

  return (
    <div>
      <style>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
            Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
          background: #f4f6f9;
          color: #333;
        }
        .container {
          max-width: 900px;
          margin: 20px auto;
          padding: 0 15px;
        }
        header {
          text-align: center;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        header h1 {
          margin: 0;
          font-size: 1.8rem;
          color: #1976d2;
          flex: 1;
          text-align: left;
        }
        header p {
          color: #555;
          margin-top: 8px;
          font-size: 1rem;
          text-align: left;
        }
        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        .card h2, .card h3 {
          margin-top: 0;
          color: #1976d2;
          font-size: 1.3rem;
        }
        button {
          background: #1976d2;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          margin: 5px;
          transition: 0.3s;
        }
        button:hover { background: #135ca0; }
        .file-label {
          display: inline-block;
          background: #e0e0e0;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          margin-left: 8px;
          transition: 0.3s;
        }
        .file-label:hover { background: #d0d0d0; }
        #reader {
          margin-top: 15px;
          border: 2px dashed #ccc;
          border-radius: 12px;
          padding: 10px;
          min-height: 250px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #fafafa;
        }
        #scan-status-message {
          margin-top: 10px;
          font-size: 0.9rem;
          color: #444;
        }
        #report-display-area iframe {
          border-radius: 8px;
          margin-top: 15px;
          background: #fafafa;
        }
        .message.error {
          margin-top: 12px;
          padding: 10px;
          border-radius: 6px;
          background: #fdecea;
          color: #b71c1c;
          font-weight: 600;
        }
        .icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .icon-btn svg { width: 18px; height: 18px; fill: currentColor; }
        .logout-btn {
          background: #ffffff;
          color: #1976d2;
          border: 1px solid #e0e0e0;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin: 0;
        }
        .logout-btn:hover { background: #eef4ff; }
        @media (max-width: 600px) {
          #reader { min-height: 200px; }
          button, .file-label { width: 100%; margin-top: 10px; }
          header { flex-direction: column; align-items: stretch; text-align: center; }
          header h1, header p { text-align: center; }
        }
      `}</style>

      <div className="container">
        <header>
          <div>
            <h1>Doctor Scanner</h1>
            <p>Scan a patient's QR code or upload an image to view their medical report.</p>
          </div>
          <button className="logout-btn" type="button" onClick={onLogout}>Logout</button>
        </header>

        <main>
          <div className="card scanner-section">
            <h2>Scan QR Code (Camera)</h2>
            <div id="reader" width="400px">Camera feed will appear here</div>
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <button className="icon-btn" type="button" onClick={startScanner}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 3H5a2 2 0 0 0-2 2v2h2V5h2V3zm12 0h-2v2h2v2h2V5a2 2 0 0 0-2-2zM5 19H3v2a2 2 0 0 0 2 2h2v-2H5v-2zm16 0h-2v2h-2v2h2a2 2 0 0 0 2-2v-2zM7 7h10v10H7V7zm2 2v6h6V9H9z"/>
                </svg>
                Scan with Camera
              </button>
              <button type="button" onClick={stopScanner}>Stop Camera</button>
            </div>
            <p id="scan-status-message" style={{ color: scanStatus.includes("Error") ? "#b71c1c" : "#2e7d32" }}>
              {scanStatus}
            </p>
          </div>

          <div className="card upload-section">
            <h2>Upload Saved QR Image</h2>
            <p>Already saved the QR code? Upload it from your gallery.</p>
            <label htmlFor="qr-file-input" className="file-label">
              <input type="file" id="qr-file-input" accept="image/*" style={{ display: "none" }} onChange={scanFromFile} />
              Upload QR Image
            </label>
          </div>

          {showReport && (
            <div id="report-display-area" className="card">
              <h3>Medical Report</h3>
              {reportFile && <iframe title="Medical Report" src={reportFile} width="100%" height="600px" />}
              {reportError && <div className="message error">{reportError}</div>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
