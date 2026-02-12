import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getSession, logout } from "../lib/api.js";
import ProfileModal from "../components/ProfileModal.jsx";
import AppNavbar from "../components/AppNavbar.jsx";

const tabs = [
  { key: "scanner", label: "Scanner" },
  { key: "patient", label: "Patient Details" }
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
  const [profileAccessRequest, setProfileAccessRequest] = useState(null);
  const [profileAccessMessage, setProfileAccessMessage] = useState(null);
  const [profileAccessLoading, setProfileAccessLoading] = useState(false);
  const [approvedProfile, setApprovedProfile] = useState(null);
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
    const tab = params.get("tab");
    const allowedTabs = ["scanner", "patient", "about", "support"];
    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab);
      return;
    }

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

  useEffect(() => {
    if (!profileAccessRequest?.requestId || profileAccessRequest?.status !== "pending") return;
    const intervalId = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/profile-access/requests/${profileAccessRequest.requestId}`);
        const data = await res.json();
        if (!res.ok) return;
        setProfileAccessRequest((prev) => ({
          ...(prev || {}),
          ...data.data,
          requestId: data.data.requestId,
        }));
        if (data.data.status === "approved" && data.data.profile) {
          setApprovedProfile(data.data.profile);
          setProfileAccessMessage({ type: "success", text: "Profile access approved by patient." });
        }
        if (data.data.status === "expired") {
          setApprovedProfile(null);
          setProfileAccessMessage({ type: "error", text: "Request expired. Send a new request." });
        }
      } catch {
        // silent polling failure
      }
    }, 7000);

    return () => clearInterval(intervalId);
  }, [profileAccessRequest?.requestId, profileAccessRequest?.status]);

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
        setProfileAccessRequest(null);
        setProfileAccessMessage(null);
        setApprovedProfile(null);
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

  const requestProfileAccess = async () => {
    if (!patient?.id || !recordId) {
      setProfileAccessMessage({ type: "error", text: "Scan a valid report first." });
      return;
    }
    setProfileAccessLoading(true);
    setProfileAccessMessage(null);
    try {
      const res = await apiFetch("/api/profile-access/requests", {
        method: "POST",
        body: JSON.stringify({ patientId: patient.id, recordId }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileAccessRequest(data.data);
        setProfileAccessMessage({
          type: "success",
          text: "Request sent. Waiting for patient approval (valid for 10 minutes).",
        });
      } else {
        setProfileAccessMessage({ type: "error", text: data?.error?.message || "Failed to request access." });
      }
    } catch {
      setProfileAccessMessage({ type: "error", text: "Failed to connect to server." });
    } finally {
      setProfileAccessLoading(false);
    }
  };

  const refreshProfileAccessStatus = async () => {
    if (!profileAccessRequest?.requestId) return;
    setProfileAccessLoading(true);
    try {
      const res = await apiFetch(`/api/profile-access/requests/${profileAccessRequest.requestId}`);
      const data = await res.json();
      if (res.ok) {
        setProfileAccessRequest((prev) => ({
          ...(prev || {}),
          ...data.data,
          requestId: data.data.requestId,
        }));
        if (data.data.status === "approved" && data.data.profile) {
          setApprovedProfile(data.data.profile);
          setProfileAccessMessage({ type: "success", text: "Profile access approved by patient." });
        } else if (data.data.status === "expired") {
          setProfileAccessMessage({ type: "error", text: "Request expired. Send a new request." });
          setApprovedProfile(null);
        } else {
          setProfileAccessMessage({ type: "info", text: `Request status: ${data.data.status}` });
        }
      } else {
        setProfileAccessMessage({ type: "error", text: data?.error?.message || "Failed to fetch status." });
      }
    } catch {
      setProfileAccessMessage({ type: "error", text: "Failed to connect to server." });
    } finally {
      setProfileAccessLoading(false);
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
      <AppNavbar
        showBack
        title="Doctor Scanner"
        aboutTo="/doctor?tab=about"
        supportTo="/doctor?tab=support"
        showProfile
        onProfileClick={() => setProfileOpen(true)}
        onLogout={onLogout}
      />
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
                  {patient && (
                    <div className="mt-3">
                      <h3 className="h6 fw-semibold">Profile Access</h3>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          type="button"
                          onClick={requestProfileAccess}
                          disabled={profileAccessLoading}
                        >
                          {profileAccessLoading ? "Sending..." : "Request Profile Access"}
                        </button>
                        {profileAccessRequest?.requestId && (
                          <button
                            className="btn btn-outline-primary btn-sm"
                            type="button"
                            onClick={refreshProfileAccessStatus}
                            disabled={profileAccessLoading}
                          >
                            Refresh Access Status
                          </button>
                        )}
                      </div>
                      {profileAccessRequest?.expiresAt && (
                        <p className="small text-secondary mt-2 mb-0">
                          Request expires at {new Date(profileAccessRequest.expiresAt).toLocaleString()}
                        </p>
                      )}
                      {profileAccessMessage && (
                        <div className={`alert alert-${profileAccessMessage.type === "error" ? "danger" : profileAccessMessage.type} mt-2 mb-0`}>
                          {profileAccessMessage.text}
                        </div>
                      )}
                    </div>
                  )}

                  {approvedProfile && (
                    <div className="mt-3 border rounded p-3 bg-light">
                      <h3 className="h6 fw-semibold mb-2">Approved Profile Details</h3>
                      <div><strong>Name:</strong> {approvedProfile.name || "N/A"}</div>
                      <div><strong>Email:</strong> {approvedProfile.email || "N/A"}</div>
                      <div><strong>Phone:</strong> {approvedProfile.phone || "N/A"}</div>
                      <div className="mt-2"><strong>Health Values:</strong></div>
                      <div className="row g-2 mt-1">
                        {[
                          ["Hemoglobin", approvedProfile.healthProfile?.hemoglobin],
                          ["Glucose", approvedProfile.healthProfile?.glucose],
                          ["Cholesterol", approvedProfile.healthProfile?.cholesterol],
                          ["BMI", approvedProfile.healthProfile?.bmi],
                          ["Heart Rate", approvedProfile.healthProfile?.heartRate],
                          [
                            "Blood Pressure",
                            approvedProfile.healthProfile?.bloodPressureSystolic &&
                            approvedProfile.healthProfile?.bloodPressureDiastolic
                              ? `${approvedProfile.healthProfile.bloodPressureSystolic}/${approvedProfile.healthProfile.bloodPressureDiastolic}`
                              : null,
                          ],
                        ].map(([label, value]) => (
                          <div className="col-sm-6" key={label}>
                            <div className="border rounded p-2 bg-white">
                              <div className="small text-secondary">{label}</div>
                              <div className="fw-semibold">{value ?? "N/A"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
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
