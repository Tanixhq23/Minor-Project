import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getSession, logout } from "../lib/api.js";
import NavArrow from "../components/NavArrow.jsx";
import ProfileModal from "../components/ProfileModal.jsx";

const tabs = [
  { key: "upload", label: "Upload Report" },
  { key: "uploads", label: "See Uploads" },
  { key: "about", label: "About" },
  { key: "support", label: "Support" }
];

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upload");
  const [statusMessage, setStatusMessage] = useState(null);
  const [logMessage, setLogMessage] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrLink, setQrLink] = useState("#");
  const [showQr, setShowQr] = useState(false);
  const [uploadsQrMessage, setUploadsQrMessage] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      if (!session?.role || session.role !== "patient") {
        navigate("/signin", { replace: true });
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (activeTab === "uploads") {
      fetchUploads();
    }
  }, [activeTab]);

  const fetchUploads = async () => {
    setUploadsLoading(true);
    try {
      const res = await apiFetch("/api/patient/records");
      const data = await res.json();
      if (res.ok) {
        setUploads(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setUploadsLoading(false);
    }
  };

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setStatusMessage({ type: "info", text: "Reading file and generating QR code..." });
    setShowQr(false);

    const doctorEmail = event.target.doctorEmail.value;
    const file = event.target.medicalData.files[0];

    if (!file) {
      setStatusMessage({ type: "error", text: "Please select a PDF file to upload." });
      return;
    }
    if (file.type !== "application/pdf") {
      setStatusMessage({ type: "error", text: "Only PDF files are allowed." });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const res = await apiFetch("/api/patient/records", {
          method: "POST",
          body: JSON.stringify({
            doctorEmail,
            medicalData: { file: reader.result, fileName: file.name, fileType: file.type }
          })
        });
        const data = await res.json();
        if (res.ok) {
          setStatusMessage({ type: "success", text: "QR Code successfully generated! Share it with your doctor." });
          setQrDataUrl(data.data.qrCodeDataUrl);
          setQrLink(data.data.accessUrl);
          setShowQr(true);
          fetchUploads();
        } else {
          setStatusMessage({ type: "error", text: data?.error?.message || "Unknown error" });
        }
      } catch {
        setStatusMessage({ type: "error", text: "Failed to connect to the server or process request." });
      }
    };
    reader.onerror = () => {
      setStatusMessage({ type: "error", text: "Failed to read the PDF file." });
    };
  };

  const handleDownload = () => {
    if (!qrDataUrl) {
      alert("QR code is not available to download.");
      return;
    }
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `QR-Code-${new Date().toISOString().split("T")[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateQrForUpload = async (recordId) => {
    setUploadsQrMessage({ type: "info", text: "Generating QR code for selected upload..." });
    try {
      const res = await apiFetch(`/api/patient/records/${recordId}/qr`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setQrDataUrl(data.data.qrCodeDataUrl);
        setQrLink(data.data.accessUrl);
        setShowQr(true);
        setActiveTab("upload");
        setUploadsQrMessage({ type: "success", text: "QR generated for previous upload." });
        fetchUploads();
      } else {
        setUploadsQrMessage({ type: "error", text: data?.error?.message || "Failed to generate QR." });
      }
    } catch {
      setUploadsQrMessage({ type: "error", text: "Failed to connect to server." });
    }
  };

  const handleViewLogs = async () => {
    setLogsLoading(true);
    setLogMessage(null);

    try {
      const logsRes = await apiFetch("/api/logs/me");
      const logsData = await logsRes.json();
      if (logsRes.ok && logsData.data && logsData.data.length > 0) {
        setLogs(logsData.data);
      } else {
        setLogMessage({ type: "info", text: "No access logs found for this patient." });
        setLogs([]);
      }
    } catch {
      setLogMessage({ type: "error", text: "Failed to fetch logs. Please try again." });
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header-left">
          <NavArrow />
          <h1 className="header-title">Health-Lock</h1>
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
      <ProfileModal open={profileOpen} role="patient" onClose={() => setProfileOpen(false)} />

      <div className="container">
        <h1 className="page-title">Patient Dashboard</h1>

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
            {activeTab === "upload" && (
              <div className="card">
                <h2 className="card-title">Upload New Report</h2>
                <p className="muted">Upload your medical report from your signed-in patient account and generate a secure QR code.</p>
                <form className="form" onSubmit={handleUpload}>
                  <label className="label" htmlFor="doctorEmail">Doctor Email (optional)</label>
                  <input className="input" type="email" id="doctorEmail" name="doctorEmail" placeholder="doctor@example.com" />

                  <label className="label" htmlFor="medicalData">Medical Report (PDF)</label>
                  <input className="input" type="file" id="medicalData" name="medicalData" accept="application/pdf" required />

                  <button className="btn" type="submit">Generate QR Code</button>
                </form>

                {statusMessage && <div className={`message ${statusMessage.type}`} style={{ marginTop: 12 }}>{statusMessage.text}</div>}

                {showQr && (
                  <div className="center" style={{ marginTop: 16 }}>
                    <h3 className="card-title">Your QR Code</h3>
                    <p className="muted">Scan this QR code to grant a doctor access to your medical report.</p>
                    <img className="qr-img" alt="QR Code" src={qrDataUrl} />
                    <div>
                      <a href={qrLink} target="_blank" rel="noreferrer">View Report Link</a>
                    </div>
                    <button className="btn" type="button" onClick={handleDownload}>Download QR Code</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "uploads" && (
              <div className="card">
                <h2 className="card-title">Your Uploads</h2>
                <p className="muted">All reports uploaded by you.</p>
                {uploadsQrMessage && (
                  <div className={`message ${uploadsQrMessage.type}`} style={{ marginBottom: 12 }}>
                    {uploadsQrMessage.text}
                  </div>
                )}
                {uploadsLoading ? (
                  <p className="muted">Loading uploads...</p>
                ) : uploads.length === 0 ? (
                  <p className="muted">No uploads found yet.</p>
                ) : (
                  <div className="grid">
                    {uploads.map((record) => (
                      <div key={record._id} className="card" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
                        <strong>{record.medicalData?.fileName || "Medical Report"}</strong>
                        <p className="muted" style={{ margin: "6px 0" }}>
                          Uploaded: {new Date(record.createdAt).toLocaleString()}
                        </p>
                        <p className="muted">Status: {record.status}</p>
                        {record.accessUrl && (
                          <a href={record.accessUrl} target="_blank" rel="noreferrer">
                            Open Access Link
                          </a>
                        )}
                        <div style={{ marginTop: 10 }}>
                          <button
                            className="btn"
                            type="button"
                            onClick={() => handleGenerateQrForUpload(record._id)}
                          >
                            Generate QR
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "about" && (
              <div className="card">
                <h2 className="card-title">About Health-Lock</h2>
                <p className="muted">
                  Health-Lock is a secure QR-based medical record sharing system. Patients can upload
                  reports and generate QR codes for controlled doctor access. The system logs every
                  access to ensure transparency and safety.
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

            <div className="card" style={{ marginTop: 16 }}>
              <h2 className="card-title">Record Access History</h2>
              <button className="btn" type="button" onClick={handleViewLogs} disabled={logsLoading}>
                {logsLoading ? "Loading..." : "Refresh Logs"}
              </button>
              {logMessage && <div className={`message ${logMessage.type}`} style={{ marginTop: 12 }}>{logMessage.text}</div>}
              {logs.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h3 className="card-title">Recent Accesses</h3>
                  <ul>
                    {logs.map((log) => (
                      <li key={log._id} style={{ marginBottom: 10 }}>
                        <strong>Record ID:</strong> {log.record._id}<br />
                        <strong>Accessed By:</strong> {log.doctor ? log.doctor.name : "Unknown Doctor"}<br />
                        <strong>When:</strong> {new Date(log.createdAt).toLocaleString()}<br />
                        <strong>IP:</strong> {log.ip || "N/A"}<br />
                        <strong>User Agent:</strong> {log.userAgent || "N/A"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
