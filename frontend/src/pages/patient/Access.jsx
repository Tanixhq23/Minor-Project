import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axiosClient";
import CountdownTimer from "../../components/CountdownTimer";

export default function Access() {
  const [accessList, setAccessList] = useState([]);
  const [docsList, setDocsList] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [generated, setGenerated] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);

  const loadAccess = async () => {
    try {
      const res = await api.get("/patient/access/active");
      setAccessList(res.data?.data?.access || []);
    } catch (err) {
      console.error("Failed to load access list", err);
    }
  };

  const loadDocs = async () => {
    try {
      const docRes = await api.get("/patient/documents");
      setDocsList(docRes.data?.data?.documents || []);
    } catch (err) {
      console.error("Failed to load docs list", err);
    }
  };

  useEffect(() => {
    loadAccess();
    loadDocs();

    // Set up polling to check if doctor has connected
    const interval = setInterval(() => {
      loadAccess();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleGenerateOTP = async () => {
    try {
      setQrDataUrl("");
      setExpiresAt(null);
      const res = await api.post("/patient/access/otp");
      const { otp, expiresAt } = res.data.data;
      setGenerated(`OTP Code: ${otp}`);
      setExpiresAt(expiresAt);
      loadAccess();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQR = async () => {
    try {
      setGenerated("");
      setExpiresAt(null);
      const res = await api.post("/patient/access/qr", {
        documentId: selectedDocId || null
      });
      const qrData = res.data.data;
      setQrDataUrl(qrData.qrDataUrl);
      setExpiresAt(qrData.expiresAt);
      loadAccess();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevoke = async (consentId) => {
    try {
      await api.delete(`/patient/access/${consentId}`);
      loadAccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h2 className="fw-bold">Generate Access</h2>
        <p className="text-muted">Share records securely with doctors, generate secure one-time credentials.</p>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center">
              <i className="bi bi-shield-plus me-2 text-primary"></i>
              Create New Access Route
            </h5>

            <div className="mb-4">
              <label className="form-label small fw-bold">Target Document (Optional)</label>
              <select 
                className="form-select border-0 bg-light"
                value={selectedDocId} 
                onChange={(e) => setSelectedDocId(e.target.value)}
              >
                <option value="">Grant Access to ALL Documents</option>
                {docsList.map(d => (
                  <option key={d.id} value={d.id}>{d.originalName}</option>
                ))}
              </select>
              <div className="form-text mt-2 small">
                {selectedDocId ? "Only the selected document will be shared." : "All your reports will be visible to the doctor."}
              </div>
            </div>

            <div className="row g-2 mt-auto">
              <div className="col-12 col-sm-6">
                <button className="btn btn-primary w-100 py-2 fw-bold d-flex align-items-center justify-content-center" onClick={handleGenerateQR}>
                  <i className="bi bi-qr-code me-2"></i>
                  Generate QR
                </button>
              </div>
              <div className="col-12 col-sm-6">
                <button className="btn btn-outline-primary w-100 py-2 fw-bold d-flex align-items-center justify-content-center" onClick={handleGenerateOTP}>
                  <i className="bi bi-key-fill me-2"></i>
                  Generate OTP
                </button>
              </div>
            </div>

            {generated && (
              <div className="mt-4 p-3 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 animate-fade-in">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="small text-muted d-block lh-1 mb-1">Active OTP Code</span>
                    <span className="h3 fw-bold text-primary mb-0" style={{ letterSpacing: '2px' }}>{generated.split(': ')[1]}</span>
                  </div>
                  <div className="text-end">
                    <button 
                      className="btn btn-primary btn-sm rounded-pill px-3 mb-2"
                      onClick={() => {
                        navigator.clipboard.writeText(generated.split(': ')[1]);
                        alert("Copied to clipboard!");
                      }}
                    >
                      Copy Code
                    </button>
                    {expiresAt && <CountdownTimer expiresAt={expiresAt} onExpire={() => setGenerated("")} />}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          {qrDataUrl ? (
            <div className="card border-0 shadow-sm p-4 rounded-4 text-center h-100 border-primary border-opacity-25" style={{ backgroundColor: "#f0f7ff" }}>
              <h4 className="fw-bold mb-1">Ready to Scan</h4>
              <p className="text-muted small mb-4">{selectedDocId ? "Specific Document Access" : "Full Profile Access"}</p>
              
              {expiresAt && (
                <div className="mb-4">
                  <CountdownTimer expiresAt={expiresAt} onExpire={() => setQrDataUrl("")} />
                </div>
              )}

              <div className="bg-white p-3 rounded-4 shadow-sm d-inline-block mx-auto mb-4 border border-primary border-opacity-10">
                <img
                  src={qrDataUrl}
                  alt="Secure access QR"
                  className="img-fluid"
                  style={{ width: "200px", height: "200px" }}
                />
              </div>

              <a 
                href={qrDataUrl} 
                download={`access-qr.png`}
                className="btn btn-outline-primary w-100 py-3 fw-bold rounded-3 bg-white"
              >
                <i className="bi bi-download me-2"></i>
                Download QR
              </a>
            </div>
          ) : (
            <div className="card border-0 shadow-sm p-4 rounded-4 text-center h-100 d-flex flex-column justify-content-center opacity-75 border-dashed border-2">
               <i className="bi bi-qr-code display-3 text-muted opacity-25 mb-3"></i>
               <h3 className="h5 text-muted">Awaiting QR Generation</h3>
               <p className="small text-muted mb-0 px-md-5">Specify the access level and generate a code to see it here.</p>
            </div>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white py-3 border-0">
          <h3 className="h6 fw-bold mb-0">Active Access Grants</h3>
        </div>
        <div className="card-body p-0">
          {accessList.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-safe fs-1 text-muted opacity-25"></i>
              <p className="text-muted mt-3 mb-0">No active access grants open.</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {accessList.map(a => (
                <div key={a._id || a.id} className="list-group-item p-3 p-md-4 border-0 border-bottom">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div className="d-flex gap-3 align-items-center">
                      <div className={`p-2 rounded-3 ${a.doctorName ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}>
                        <i className={`bi fs-4 ${a.type === 'qr' ? 'bi-qr-code' : 'bi-key-fill'}`}></i>
                      </div>
                      <div>
                        {a.doctorName ? (
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="fw-bold text-dark">{a.doctorName}</span>
                            <span className="badge rounded-pill bg-success small" style={{ fontSize: '0.65rem' }}>CONNECTED</span>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="fw-bold text-muted small text-uppercase fw-bold opacity-75">{a.type} ACCESS</span>
                            <span className="badge rounded-pill bg-warning text-dark small" style={{ fontSize: '0.65rem' }}>WAITING</span>
                          </div>
                        )}
                        <p className="mb-0 small text-muted">
                           {a.documentName ? `Restricted to Document: ${a.documentName}` : "Full Profile Access"}
                        </p>
                        <p className="mb-0 mt-1" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                          Expires: {new Date(a.expiresAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(a._id || a.id)}
                      className="btn btn-sm btn-outline-danger px-4 rounded-pill fw-bold border-2"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}