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
  const scanningRef = useRef(false);
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

  useEffect(() => {
    return () => {
      const instance = qrInstanceRef.current;
      if (!instance) return;
      instance.stop().catch(() => {});
      scanningRef.current = false;
    };
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

  const extractIdAndToken = (decodedText) => {
    const text = String(decodedText || "").trim();
    if (!text) return null;
    try {
      const url = new URL(text);
      const id = url.searchParams.get("id");
      const token = url.searchParams.get("token");
      if (id && token) return { id, token };
    } catch {
      // continue to regex fallback
    }

    const idMatch = text.match(/[?&]id=([^&]+)/i);
    const tokenMatch = text.match(/[?&]token=([^&]+)/i);
    if (idMatch?.[1] && tokenMatch?.[1]) {
      return {
        id: decodeURIComponent(idMatch[1]),
        token: decodeURIComponent(tokenMatch[1]),
      };
    }
    return null;
  };

  const handleDecodedText = async (decodedText) => {
    try {
      const parsed = extractIdAndToken(decodedText);
      if (!parsed?.id || !parsed?.token) {
        setReportError("Error: Invalid QR Code data. Missing record ID or token.");
        return;
      }
      await fetchReport(parsed.id, parsed.token);
    } catch {
      setReportError("Error: Invalid QR Code data (Not a valid URL).");
    }
  };

  const pickPreferredCamera = (devices) => {
    if (!Array.isArray(devices) || devices.length === 0) return null;
    const rearRegex = /(back|rear|environment|world|traseira|trasera|hind)/i;
    const rear = devices.find((device) => rearRegex.test(device?.label || ""));
    return rear || devices[0];
  };

  const qrScannerConfig = {
    fps: 12,
    qrbox: (viewfinderWidth, viewfinderHeight) => {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
      const size = Math.floor(minEdge * 0.75);
      return { width: size, height: size };
    },
    rememberLastUsedCamera: true,
  };

  const startScanner = async () => {
    const instance = getQrInstance();
    if (!instance) {
      setScanStatus("QR scanner library not loaded.");
      return;
    }
    if (scanningRef.current) {
      setScanStatus("Scanner is already running.");
      return;
    }
    try {
      const devices = await window.Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setScanStatus("No cameras found.");
        return;
      }

      const preferred = pickPreferredCamera(devices);

      const onSuccess = (decodedText) => {
        instance.stop().catch(() => {});
        scanningRef.current = false;
        handleDecodedText(decodedText);
      };

      let startedWith = preferred?.label || "camera";
      try {
        await instance.start({ facingMode: { exact: "environment" } }, qrScannerConfig, onSuccess, () => {});
        startedWith = "back camera";
      } catch {
        try {
          await instance.start({ facingMode: "environment" }, qrScannerConfig, onSuccess, () => {});
          startedWith = "back camera";
        } catch {
          await instance.start(preferred.id, qrScannerConfig, onSuccess, () => {});
        }
      }

      scanningRef.current = true;
      setScanStatus(`Scanning for QR Code using ${startedWith}...`);
    } catch (err) {
      scanningRef.current = false;
      setScanStatus(`Error starting camera: ${err.message || err}`);
    }
  };

  const stopScanner = async () => {
    const instance = getQrInstance();
    if (!instance) return;
    try {
      await instance.stop();
      scanningRef.current = false;
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
    <div className="min-vh-100 d-flex flex-column">
      <header className="app-navbar">
        <div className="container d-flex align-items-center justify-content-between py-3">
          <div className="d-flex align-items-center gap-2">
            <NavArrow />
            <h1 className="h5 mb-0 fw-bold">Doctor Scanner</h1>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-primary btn-icon rounded-circle d-inline-flex align-items-center justify-content-center"
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Open profile"
              title="Profile"
            >
              P
            </button>
            <button className="btn btn-outline-secondary" type="button" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>
      <ProfileModal open={profileOpen} role="doctor" onClose={() => setProfileOpen(false)} />

      <div className="container py-4">
        <h1 className="h3 fw-semibold mb-3">Doctor Dashboard</h1>

        <div className="row g-4">
          <aside className="col-lg-3">
            <div className="card shadow-sm position-sticky app-sidebar">
              <div className="card-body">
                <div className="text-uppercase small text-secondary fw-semibold mb-2">Menu</div>
                <div className="list-group">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      className={`list-group-item list-group-item-action ${activeTab === tab.key ? "active" : ""}`}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="col-lg-9 d-grid gap-3">
            {activeTab === "scanner" && (
              <>
                <p className="text-secondary mb-0">
                  Scan a patient's QR code or upload an image to view their medical report.
                </p>
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h2 className="h5 fw-semibold">Scan QR Code (Camera)</h2>
                    <div id="reader" className="scanner-box">Camera feed will appear here</div>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      <button className="btn btn-primary" type="button" onClick={startScanner}>Scan with Camera</button>
                      <button className="btn btn-outline-secondary" type="button" onClick={stopScanner}>Stop Camera</button>
                    </div>
                    {scanStatus && <p className="text-secondary mt-2 mb-0">{scanStatus}</p>}
                  </div>
                </div>

                <div className="card shadow-sm">
                  <div className="card-body">
                    <h2 className="h5 fw-semibold">Upload Saved QR Image</h2>
                    <p className="text-secondary">Already saved the QR code? Upload it from your gallery.</p>
                    <input type="file" className="form-control" id="qr-file-input" accept="image/*" onChange={scanFromFile} />
                  </div>
                </div>
              </>
            )}

            {activeTab === "patient" && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h2 className="h5 fw-semibold">Patient Details</h2>
                  {!patient && !reportError && (
                    <p className="text-secondary">Scan a QR code to view patient details and report.</p>
                  )}
                  {reportError && <div className="alert alert-danger">{reportError}</div>}
                  {patient && (
                    <div className="d-grid gap-1">
                      <div><strong>Name:</strong> {patient.name || "N/A"}</div>
                      <div><strong>Email:</strong> {patient.email || "N/A"}</div>
                      <div><strong>Phone:</strong> {patient.phone || "N/A"}</div>
                      {recordId && <div><strong>Record ID:</strong> {recordId}</div>}
                    </div>
                  )}
                  {reportFile && (
                    <div className="mt-3">
                      <h3 className="h6 fw-semibold">Medical Report</h3>
                      <iframe title="Medical Report" src={reportFile} className="responsive-iframe" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h2 className="h5 fw-semibold">About Health-Lock</h2>
                  <p className="text-secondary mb-0">
                    Health-Lock enables secure, time-bound access to patient reports using QR codes.
                    Doctors can scan or upload QR images to view patient data with explicit consent.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "support" && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h2 className="h5 fw-semibold">Support</h2>
                  <p className="text-secondary">Need help? Reach out to us at:</p>
                  <p className="mb-0 fw-semibold">tanishqlokhande2005@gmail.com</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
