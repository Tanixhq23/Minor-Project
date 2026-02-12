import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getSession, logout } from "../lib/api.js";
import ProfileModal from "../components/ProfileModal.jsx";
import AppNavbar from "../components/AppNavbar.jsx";

const tabs = [
  { key: "upload", label: "Upload Report" },
  { key: "uploads", label: "See Uploads" },
  { key: "analyzer", label: "Report Analyzer" },
  { key: "requests", label: "Profile Requests" }
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
  const [deletingRecordId, setDeletingRecordId] = useState("");
  const [analyzerLoading, setAnalyzerLoading] = useState(false);
  const [analyzerProgress, setAnalyzerProgress] = useState(0);
  const [analyzerMessage, setAnalyzerMessage] = useState(null);
  const [analyzerResult, setAnalyzerResult] = useState(null);
  const [profileRequests, setProfileRequests] = useState([]);
  const [profileRequestsLoading, setProfileRequestsLoading] = useState(false);
  const [profileRequestsMessage, setProfileRequestsMessage] = useState(null);
  const [approvingRequestId, setApprovingRequestId] = useState("");
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
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const allowedTabs = ["upload", "uploads", "analyzer", "requests", "about", "support"];
    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "uploads") {
      fetchUploads();
    }
    if (activeTab === "requests") {
      fetchProfileRequests();
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

  const fetchProfileRequests = async () => {
    setProfileRequestsLoading(true);
    setProfileRequestsMessage(null);
    try {
      const res = await apiFetch("/api/profile-access/requests/patient");
      const data = await res.json();
      if (res.ok) {
        setProfileRequests(data?.data || []);
      } else {
        setProfileRequests([]);
        setProfileRequestsMessage({ type: "error", text: data?.error?.message || "Failed to load requests." });
      }
    } catch {
      setProfileRequests([]);
      setProfileRequestsMessage({ type: "error", text: "Failed to connect to server." });
    } finally {
      setProfileRequestsLoading(false);
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

  const handleDeleteUpload = async (recordId) => {
    const confirmed = window.confirm("Delete this uploaded report? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingRecordId(recordId);
    setUploadsQrMessage({ type: "info", text: "Deleting selected upload..." });
    try {
      const res = await apiFetch(`/api/patient/records/${recordId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setUploads((prev) => prev.filter((record) => record._id !== recordId));
        setUploadsQrMessage({ type: "success", text: "Upload deleted successfully." });
      } else {
        setUploadsQrMessage({ type: "error", text: data?.error?.message || "Failed to delete upload." });
      }
    } catch {
      setUploadsQrMessage({ type: "error", text: "Failed to connect to server." });
    } finally {
      setDeletingRecordId("");
    }
  };

  const handleAnalyzeReport = async (event) => {
    event.preventDefault();
    setAnalyzerMessage(null);
    setAnalyzerResult(null);
    setAnalyzerProgress(8);
    setAnalyzerLoading(true);

    const file = event.target.analyzerFile.files[0];
    if (!file) {
      setAnalyzerLoading(false);
      setAnalyzerProgress(0);
      setAnalyzerMessage({ type: "error", text: "Please select a PDF report to analyze." });
      return;
    }
    if (file.type !== "application/pdf") {
      setAnalyzerLoading(false);
      setAnalyzerProgress(0);
      setAnalyzerMessage({ type: "error", text: "Only PDF files are supported for analysis." });
      return;
    }

    const progressTimer = setInterval(() => {
      setAnalyzerProgress((prev) => (prev >= 90 ? prev : prev + 6));
    }, 220);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const res = await apiFetch("/api/patient/report-analyzer", {
          method: "POST",
          body: JSON.stringify({
            medicalData: { file: reader.result, fileName: file.name, fileType: file.type }
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setAnalyzerResult(data?.data || null);
          setAnalyzerMessage({ type: "success", text: "Report analyzed. Profile values were updated." });
          event.target.reset();
          setAnalyzerProgress(100);
        } else {
          setAnalyzerMessage({
            type: "error",
            text: data?.error?.message || "Unable to analyze this file. Please upload a valid health report PDF.",
          });
          setAnalyzerProgress(0);
        }
      } catch {
        setAnalyzerMessage({ type: "error", text: "Failed to connect to server." });
        setAnalyzerProgress(0);
      } finally {
        clearInterval(progressTimer);
        setTimeout(() => {
          setAnalyzerLoading(false);
          setAnalyzerProgress((prev) => (prev === 100 ? 100 : 0));
        }, 300);
      }
    };
    reader.onerror = () => {
      clearInterval(progressTimer);
      setAnalyzerLoading(false);
      setAnalyzerProgress(0);
      setAnalyzerMessage({ type: "error", text: "Failed to read the selected PDF." });
    };
  };

  const handleApproveProfileRequest = async (requestId) => {
    setApprovingRequestId(requestId);
    setProfileRequestsMessage(null);
    try {
      const res = await apiFetch(`/api/profile-access/requests/${requestId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setProfileRequestsMessage({ type: "success", text: "Profile access approved for doctor." });
        setProfileRequests((prev) => prev.filter((item) => item.requestId !== requestId));
      } else {
        setProfileRequestsMessage({ type: "error", text: data?.error?.message || "Failed to approve request." });
      }
    } catch {
      setProfileRequestsMessage({ type: "error", text: "Failed to connect to server." });
    } finally {
      setApprovingRequestId("");
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
      <AppNavbar
        showBack
        title="Health-Lock"
        aboutTo="/patient?tab=about"
        supportTo="/patient?tab=support"
        showProfile
        onProfileClick={() => setProfileOpen(true)}
        onLogout={onLogout}
      />
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
                                <button
                                  className="btn btn-outline-danger btn-sm ms-2"
                                  type="button"
                                  onClick={() => handleDeleteUpload(record._id)}
                                  disabled={deletingRecordId === record._id}
                                >
                                  {deletingRecordId === record._id ? "Deleting..." : "Delete"}
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

            {activeTab === "analyzer" && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h2 className="h5 fw-semibold">Report Analyzer</h2>
                  <p className="text-secondary">
                    Upload a medical report PDF. The analyzer will detect health values and update your profile.
                  </p>

                  <form onSubmit={handleAnalyzeReport}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="analyzerFile">Medical Report (PDF)</label>
                      <input
                        className="form-control"
                        type="file"
                        id="analyzerFile"
                        name="analyzerFile"
                        accept="application/pdf"
                        disabled={analyzerLoading}
                        required
                      />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={analyzerLoading}>
                      {analyzerLoading ? "Analyzing..." : "Analyze Report"}
                    </button>
                  </form>

                  {(analyzerLoading || analyzerProgress > 0) && (
                    <div className="mt-3">
                      <div className="progress" role="progressbar" aria-label="Report analyzer progress" aria-valuenow={analyzerProgress} aria-valuemin="0" aria-valuemax="100">
                        <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${analyzerProgress}%` }}>
                          {analyzerProgress}%
                        </div>
                      </div>
                    </div>
                  )}

                  {analyzerMessage && (
                    <div className={`alert alert-${toAlert(analyzerMessage.type)} mt-3`} role="alert">
                      {analyzerMessage.text}
                    </div>
                  )}

                  {analyzerResult?.metrics && (
                    <div className="mt-3">
                      {Array.isArray(analyzerResult.reportTypes) && analyzerResult.reportTypes.length > 0 && (
                        <div className="mb-3">
                          <h3 className="h6 fw-semibold mb-2">Detected Report Type</h3>
                          <div className="d-flex flex-wrap gap-2">
                            {analyzerResult.reportTypes.map((type) => (
                              <span key={type} className="badge text-bg-primary">{type}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <h3 className="h6 fw-semibold mb-2">Detected Values</h3>
                      {Object.keys(analyzerResult.metrics).length === 0 ? (
                        <p className="text-secondary mb-0">No numeric metrics detected in this report.</p>
                      ) : (
                        <div className="row g-2">
                          {Object.entries(analyzerResult.metrics).map(([key, value]) => (
                            <div className="col-sm-6 col-lg-4" key={key}>
                              <div className="border rounded p-2 bg-light h-100">
                                <div className="small text-secondary text-capitalize">
                                  {key.replace(/([A-Z])/g, " $1")}
                                </div>
                                <div className="fw-semibold">{value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {Array.isArray(analyzerResult.findings) && analyzerResult.findings.length > 0 && (
                        <div className="alert alert-warning mt-3 mb-0">
                          <strong>Insights:</strong>
                          <ul className="mb-0 mt-1">
                            {analyzerResult.findings.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analyzerResult.extractedText && (
                        <div className="mt-3">
                          <h3 className="h6 fw-semibold mb-2">Extracted Text</h3>
                          <div className="border rounded p-3 bg-light small analyzer-text-box">
                            {analyzerResult.extractedText}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "requests" && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h2 className="h5 fw-semibold">Profile Access Requests</h2>
                  <p className="text-secondary">
                    Approve a doctor request to share your profile details. Each request expires in 10 minutes.
                  </p>

                  <button
                    className="btn btn-outline-primary btn-sm mb-3"
                    type="button"
                    onClick={fetchProfileRequests}
                    disabled={profileRequestsLoading}
                  >
                    {profileRequestsLoading ? "Refreshing..." : "Refresh Requests"}
                  </button>

                  {profileRequestsMessage && (
                    <div className={`alert alert-${toAlert(profileRequestsMessage.type)}`} role="alert">
                      {profileRequestsMessage.text}
                    </div>
                  )}

                  {profileRequestsLoading ? (
                    <p className="text-secondary mb-0">Loading requests...</p>
                  ) : profileRequests.length === 0 ? (
                    <p className="text-secondary mb-0">No pending profile access requests.</p>
                  ) : (
                    <div className="d-grid gap-2">
                      {profileRequests.map((request) => (
                        <div className="border rounded p-3 bg-light" key={request.requestId}>
                          <div className="fw-semibold">{request.doctor?.name || "Doctor"}</div>
                          <div className="small text-secondary">Email: {request.doctor?.email || "N/A"}</div>
                          <div className="small text-secondary">Specialization: {request.doctor?.specialization || "N/A"}</div>
                          <div className="small text-secondary">Expires: {new Date(request.expiresAt).toLocaleString()}</div>
                          <button
                            className="btn btn-primary btn-sm mt-2"
                            type="button"
                            disabled={approvingRequestId === request.requestId}
                            onClick={() => handleApproveProfileRequest(request.requestId)}
                          >
                            {approvingRequestId === request.requestId ? "Approving..." : "Approve Request"}
                          </button>
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
