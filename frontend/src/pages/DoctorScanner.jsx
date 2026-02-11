import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getSession, logout } from "../lib/api.js";
import NavArrow from "../components/NavArrow.jsx";
import ProfileModal from "../components/ProfileModal.jsx";

const tabs = [
  { key: "scanner", label: "Scanner" },
  { key: "patient", label: "Patient Details" },
  { key: "about", label: "About" },
  { key: "support", label: "Support" }
];

export default function DoctorScanner() {
  const navigate = useNavigate();
  const qrInstanceRef = useRef(null);
  const [activeTab, setActiveTab] = useState("scanner");
  const [scanStatus, setScanStatus] = useState("");
  const [reportError, setReportError] = useState("");
  const [reportFile, setReportFile] = useState("");
  const [patient, setPatient] = useState(null);
  const [recordId, setRecordId] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

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
      setActiveTab("patient");
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

  const fetchReport = async (id, token) => {
    try {
      setReportError("");
      setScanStatus("QR Code scanned! Attempting to fetch report...");
      const res = await apiFetch(`/api/records/${id}?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (res.ok) {
        setRecordId(data.data.recordId);
        setReportFile(data.data.medicalData.file);
        setPatient(data.data.patient || null);
        setActiveTab("patient");
      } else {
        setReportFile("");
        setPatient(null);
        setReportError(data?.error?.message || "Report access failed.");
      }
    } catch {
      setReportFile("");
      setPatient(null);
      setReportError("Network error or server unavailable.");
    }
  };

  const handleDecodedText = async (decodedText) => {
    try {
      const url = new URL(decodedText);
      const id = url.searchParams.get("id");
      const token = url.searchParams.get("token");
      if (!id || !token) {
        setReportError("Error: Invalid QR Code data. Missing record ID or token.");
        return;
      }
      await fetchReport(id, token);
    } catch {
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
    <div className="page">
      <header className="header">
        <div className="header-left">
          <NavArrow />
          <h1 className="header-title">Doctor Scanner</h1>
        </div>
        <div className="header-actions">
          <button
            className="profile-icon-btn"
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Open profile"
            title="Profile"
          >
            P
          </button>
          <button className="btn btn-outline" type="button" onClick={onLogout}>Logout</button>
        </div>
      </header>
      <ProfileModal open={profileOpen} role="doctor" onClose={() => setProfileOpen(false)} />

      <div className="container">
        <h1 className="page-title">Doctor Dashboard</h1>

        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-title">Menu</div>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`sidebar-item ${activeTab === tab.key ? "active" : ""}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </aside>

          <section className="content">
            {activeTab === "scanner" && (
              <>
                <p className="muted">Scan a patient's QR code or upload an image to view their medical report.</p>
                <div className="card">
                  <h2 className="card-title">Scan QR Code (Camera)</h2>
                  <div id="reader" className="scanner-box">Camera feed will appear here</div>
                  <div className="center" style={{ marginTop: 16 }}>
                    <button className="btn" type="button" onClick={startScanner}>Scan with Camera</button>
                    <button className="btn btn-outline" type="button" onClick={stopScanner}>Stop Camera</button>
                  </div>
                  <p className="muted" style={{ marginTop: 8 }}>{scanStatus}</p>
                </div>

                <div className="card">
                  <h2 className="card-title">Upload Saved QR Image</h2>
                  <p className="muted">Already saved the QR code? Upload it from your gallery.</p>
                  <label htmlFor="qr-file-input" className="file-label">
                    <input type="file" id="qr-file-input" accept="image/*" style={{ display: "none" }} onChange={scanFromFile} />
                    Upload QR Image
                  </label>
                </div>
              </>
            )}

            {activeTab === "patient" && (
              <div className="card">
                <h2 className="card-title">Patient Details</h2>
                {!patient && !reportError && (
                  <p className="muted">Scan a QR code to view patient details and report.</p>
                )}
                {reportError && <div className="message error">{reportError}</div>}
                {patient && (
                  <div>
                    <p><strong>Name:</strong> {patient.name || "N/A"}</p>
                    <p><strong>Email:</strong> {patient.email || "N/A"}</p>
                    <p><strong>Phone:</strong> {patient.phone || "N/A"}</p>
                    {recordId && <p><strong>Record ID:</strong> {recordId}</p>}
                  </div>
                )}
                {reportFile && (
                  <div style={{ marginTop: 16 }}>
                    <h3 className="card-title">Medical Report</h3>
                    <iframe title="Medical Report" src={reportFile} className="responsive-iframe" />
                  </div>
                )}
              </div>
            )}

            {activeTab === "about" && (
              <div className="card">
                <h2 className="card-title">About Health-Lock</h2>
                <p className="muted">
                  Health-Lock enables secure, time-bound access to patient reports using QR codes.
                  Doctors can scan or upload QR images to view patient data with explicit consent.
                </p>
              </div>
            )}

            {activeTab === "support" && (
              <div className="card">
                <h2 className="card-title">Support</h2>
                <p className="muted">Need help? Reach out to us at:</p>
                <p><strong>tanishqlokhande2005@gmail.com</strong></p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
