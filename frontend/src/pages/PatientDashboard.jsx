import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getSession, logout } from "../lib/api.js";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState(null);
  const [logMessage, setLogMessage] = useState(null);
  const [logsHtml, setLogsHtml] = useState("<p>No logs to display yet.</p>");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrLink, setQrLink] = useState("#");
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      if (!session?.role || session.role !== "patient") {
        navigate("/signin", { replace: true });
      }
    });
  }, [navigate]);

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setStatusMessage({ type: "info", text: "Reading file and generating QR code..." });
    setShowQr(false);

    const name = event.target.patientName.value;
    const email = event.target.patientEmail.value;
    const doctorEmail = event.target.doctorEmail.value;
    const file = event.target.medicalData.files[0];

    if (!file) {
      setStatusMessage({ type: "error", text: "Please select a PDF file to upload." });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const res = await apiFetch("/api/patient/records", {
          method: "POST",
          body: JSON.stringify({
            patient: { name, email },
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

  const handleViewLogs = async (event) => {
    event.preventDefault();
    const email = event.target.patientLogEmail.value;
    if (!email) {
      setLogMessage({ type: "error", text: "Please enter your email to view logs." });
      return;
    }
    setLogMessage(null);
    setLogsHtml("<p>Fetching logs...</p>");

    try {
      const patientRes = await apiFetch(`/api/patient/find?email=${encodeURIComponent(email)}`);
      const patientData = await patientRes.json();
      if (!patientRes.ok || !patientData.data?._id) {
        setLogMessage({ type: "error", text: "Patient not found or no records associated with this email." });
        setLogsHtml("<p>No logs to display.</p>");
        return;
      }

      const logsRes = await apiFetch(`/api/logs/patient/${patientData.data._id}`);
      const logsData = await logsRes.json();
      if (logsRes.ok && logsData.data && logsData.data.length > 0) {
        const list = logsData.data
          .map(
            (log) => `
              <li>
                <strong>Record ID:</strong> ${log.record._id}<br>
                <strong>Accessed By:</strong> ${log.doctor ? log.doctor.name : "Unknown Doctor"}<br>
                <strong>When:</strong> ${new Date(log.createdAt).toLocaleString()}<br>
                <strong>IP:</strong> ${log.ip || "N/A"}<br>
                <strong>User Agent:</strong> ${log.userAgent || "N/A"}
              </li>`
          )
          .join("");
        setLogsHtml(`<h3>Recent Accesses:</h3><ul>${list}</ul>`);
      } else {
        setLogMessage({ type: "info", text: "No access logs found for this patient." });
        setLogsHtml("<p>No logs to display.</p>");
      }
    } catch {
      setLogMessage({ type: "error", text: "Failed to fetch logs. Please try again." });
      setLogsHtml("<p>Error loading logs.</p>");
    }
  };

  return (
    <div>
      <style>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
          background: #f4f6f9;
          color: #333;
        }
        header {
          background: #1976d2;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 30px;
        }
        header h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        header button {
          background: #ffffff;
          color: #1976d2;
          border: 1px solid #e0e0e0;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 0;
        }
        header button:hover {
          background: #eef4ff;
        }
        h1 {
          text-align: center;
          margin-top: 20px;
          font-size: 1.8rem;
          color: #222;
        }
        .container {
          max-width: 900px;
          margin: 20px auto;
          padding: 0 15px;
        }
        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        .card h2 {
          margin-top: 0;
          font-size: 1.3rem;
          color: #1976d2;
        }
        label {
          display: block;
          margin: 12px 0 6px;
          font-weight: 600;
        }
        input[type="text"],
        input[type="email"],
        input[type="file"] {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 0.95rem;
        }
        button {
          background: #1976d2;
          color: white;
          border: none;
          padding: 10px 18px;
          margin-top: 15px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          transition: 0.3s;
        }
        button:hover {
          background: #135ca0;
        }
        #qr-code-display {
          text-align: center;
          margin-top: 20px;
        }
        #qr-code-img {
          margin: 15px 0;
          max-width: 200px;
        }
        #access-logs {
          margin-top: 15px;
          background: #f9f9f9;
          border-radius: 6px;
          padding: 12px;
          font-size: 0.9rem;
        }
        .message { padding: 10px; border-radius: 6px; margin-bottom: 12px; }
        .message.info { background: #e8f0ff; color: #0b4ea2; font-weight: 600; }
        .message.success { background: #e6f4ea; color: #19692e; font-weight: 600; }
        .message.error { background: #fdecea; color: #b71c1c; font-weight: 600; }
        @media (max-width: 600px) {
          header {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>

      <header>
        <h1>Health-Lock</h1>
        <button type="button" onClick={onLogout}>Logout</button>
      </header>

      <h1>Patient Dashboard</h1>

      <main>
        <div className="container">
          <div className="card upload-form">
            <h2>Upload New Report</h2>
            <p>Upload your medical report and generate a secure QR code for your doctor.</p>
            <form id="upload-form" onSubmit={handleUpload}>
              <label htmlFor="patientName">Your Name</label>
              <input type="text" id="patientName" name="name" placeholder="John Doe" required />

              <label htmlFor="patientEmail">Your Email (for notifications)</label>
              <input type="email" id="patientEmail" name="email" placeholder="john.doe@example.com" />

              <label htmlFor="doctorEmail">Doctor Email (optional)</label>
              <input type="email" id="doctorEmail" name="doctorEmail" placeholder="doctor@example.com" />

              <label htmlFor="medicalData">Medical Report (PDF)</label>
              <input type="file" id="medicalData" name="medicalData" accept="application/pdf" required />

              <button type="submit">Generate QR Code</button>
            </form>
          </div>

          {statusMessage && <div className={`message ${statusMessage.type}`}>{statusMessage.text}</div>}

          {showQr && (
            <div id="qr-code-display" className="card">
              <h2>Your QR Code</h2>
              <p>Scan this QR code to grant a doctor access to your medical report.</p>
              <img id="qr-code-img" alt="QR Code" src={qrDataUrl} />
              <div>
                <a id="qr-link" href={qrLink} target="_blank" rel="noreferrer">View Report Link</a>
              </div>
              <button id="downloadQrBtn" type="button" onClick={handleDownload}>Download QR Code</button>
            </div>
          )}

          <div className="card access-logs-section">
            <h2>Your Record Access History</h2>
            <form onSubmit={handleViewLogs}>
              <label htmlFor="patientLogEmail">Enter your email to view logs:</label>
              <input type="email" id="patientLogEmail" placeholder="john.doe@example.com" />
              <button id="viewLogsBtn" type="submit">View Logs</button>
            </form>
            {logMessage && <div className={`message ${logMessage.type}`}>{logMessage.text}</div>}
            <div id="access-logs" dangerouslySetInnerHTML={{ __html: logsHtml }} />
          </div>
        </div>
      </main>
    </div>
  );
}
