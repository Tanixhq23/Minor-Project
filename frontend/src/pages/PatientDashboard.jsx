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
  const toAlert = (type) => {
    if (type === "error") return "danger";
    if (type === "success") return "success";
    return "info";
  };

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
    <div className="min-vh-100 d-flex flex-column">
      <header className="app-navbar">
        <div className="container d-flex align-items-center justify-content-between py-3">
          <div className="d-flex align-items-center gap-2">
            <NavArrow />
            <h1 className="h5 mb-0 fw-bold">Health-Lock</h1>
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
      <ProfileModal open={profileOpen} role="patient" onClose={() => setProfileOpen(false)} />

      <div className="container py-4">
        <h1 className="h3 fw-semibold mb-3">Patient Dashboard</h1>

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
            {activeTab === "upload" && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h2 className="h5 fw-semibold">Upload New Report</h2>
                  <p className="text-secondary">
                    Upload your medical report from your signed-in patient account and generate a secure QR code.
                  </p>
                  <form onSubmit={handleUpload}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="doctorEmail">Doctor Email (optional)</label>
                      <input className="form-control" type="email" id="doctorEmail" name="doctorEmail" placeholder="doctor@example.com" />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" htmlFor="medicalData">Medical Report (PDF)</label>
                      <input className="form-control" type="file" id="medicalData" name="medicalData" accept="application/pdf" required />
                    </div>

                    <button className="btn btn-primary" type="submit">Generate QR Code</button>
                  </form>

                  {statusMessage && (
                    <div className={`alert alert-${toAlert(statusMessage.type)} mt-3`} role="alert">
                      {statusMessage.text}
                    </div>
                  )}

                  {showQr && (
                    <div className="text-center mt-3">
                      <h3 className="h6 fw-semibold">Your QR Code</h3>
                      <p className="text-secondary">Scan this QR code to grant a doctor access to your medical report.</p>
                      <img className="img-fluid rounded border p-2 bg-white qr-img" alt="QR Code" src={qrDataUrl} />
                      <div className="mt-2">
                        <a href={qrLink} target="_blank" rel="noreferrer">View Report Link</a>
                      </div>
                      <button className="btn btn-outline-primary mt-2" type="button" onClick={handleDownload}>
                        Download QR Code
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "uploads" && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h2 className="h5 fw-semibold">Your Uploads</h2>
                  <p className="text-secondary">All reports uploaded by you.</p>
                  {uploadsQrMessage && (
                    <div className={`alert alert-${toAlert(uploadsQrMessage.type)}`} role="alert">
                      {uploadsQrMessage.text}
                    </div>
                  )}
                  {uploadsLoading ? (
                    <p className="text-secondary">Loading uploads...</p>
                  ) : uploads.length === 0 ? (
                    <p className="text-secondary">No uploads found yet.</p>
                  ) : (
                    <div className="row g-3">
                      {uploads.map((record) => (
                        <div key={record._id} className="col-md-6">
                          <div className="card border h-100">
                            <div className="card-body d-grid gap-2">
                              <strong>{record.medicalData?.fileName || "Medical Report"}</strong>
                              <p className="text-secondary mb-0">
                                Uploaded: {new Date(record.createdAt).toLocaleString()}
                              </p>
                              <p className="text-secondary mb-0">Status: {record.status}</p>
                              {record.accessUrl && (
                                <a href={record.accessUrl} target="_blank" rel="noreferrer">
                                  Open Access Link
                                </a>
                              )}
                              <div>
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  type="button"
                                  onClick={() => handleGenerateQrForUpload(record._id)}
                                >
                                  Generate QR
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
                    Health-Lock is a secure QR-based medical record sharing system. Patients can upload
                    reports and generate QR codes for controlled doctor access. The system logs every
                    access to ensure transparency and safety.
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

            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="h5 fw-semibold">Record Access History</h2>
                <button className="btn btn-outline-primary" type="button" onClick={handleViewLogs} disabled={logsLoading}>
                  {logsLoading ? "Loading..." : "Refresh Logs"}
                </button>
                {logMessage && (
                  <div className={`alert alert-${toAlert(logMessage.type)} mt-3`} role="alert">
                    {logMessage.text}
                  </div>
                )}
                {logs.length > 0 && (
                  <div className="mt-3">
                    <h3 className="h6 fw-semibold">Recent Accesses</h3>
                    <ul className="list-group">
                      {logs.map((log) => (
                        <li key={log._id} className="list-group-item">
                          <div><strong>Record ID:</strong> {log.record._id}</div>
                          <div><strong>Accessed By:</strong> {log.doctor ? log.doctor.name : "Unknown Doctor"}</div>
                          <div><strong>When:</strong> {new Date(log.createdAt).toLocaleString()}</div>
                          <div><strong>IP:</strong> {log.ip || "N/A"}</div>
                          <div><strong>User Agent:</strong> {log.userAgent || "N/A"}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
