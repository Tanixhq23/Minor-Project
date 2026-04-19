import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axiosClient";

export default function AccessPatient() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [qrFile, setQrFile] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/doctor/history");
        setHistory(res.data?.data?.history || []);
      } catch (err) {
        console.error("Failed to fetch history");
      }
    };
    fetchHistory();
  }, []);

  const handleSuccess = (data) => {
    setSuccessMsg(`Connection Established: Securely connected to ${data.data?.patientName || "Patient"}`);
    setTimeout(() => {
      navigate("/doctor/view", { state: { patientId: data.data.patientId } });
    }, 1500);
  };

  const handleOTP = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/doctor/access/otp", { otp });
      handleSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "OTP Access failed");
    }
  };

  const handleQRImage = async (e) => {
    e.preventDefault();
    if (!qrFile) return;
    setError("");
    const formData = new FormData();
    formData.append("qr", qrFile);
    try {
      const res = await api.post("/doctor/access/qr-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      handleSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "QR Image decoding failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-4 text-break">
        <h2 className="fw-bold">Access Patient Records</h2>
        <p className="text-muted">Enter the generated credentials from the patient to temporarily unlock access.</p>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center mb-4 px-3 py-2 small">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          {error}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success d-flex align-items-center mb-4 px-3 py-3 shadow-sm border-0 bg-success bg-opacity-10 text-success">
          <i className="bi bi-check-circle-fill fs-4 me-3"></i>
          <span className="fw-bold">{successMsg}</span>
        </div>
      )}

      <div className="row g-4 mb-5">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center text-primary">
              <i className="bi bi-key-fill me-2"></i>
              OTP Access
            </h5>
            <form onSubmit={handleOTP}>
              <div className="mb-4">
                <label className="form-label small fw-bold">One-Time Password</label>
                <input 
                  type="text"
                  className="form-control form-control-lg text-center fw-bold"
                  style={{ letterSpacing: '4px' }}
                  placeholder="000000" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-3 fw-bold shadow-sm">
                Unlock with OTP
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center text-primary">
              <i className="bi bi-qr-code-scan me-2"></i>
              QR Code Access
            </h5>
            <form onSubmit={handleQRImage}>
              <div className="mb-4">
                <label className="form-label small fw-bold">Upload Patient's QR</label>
                <input 
                  type="file" 
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => setQrFile(e.target.files[0])}
                  required
                />
              </div>
              <button type="submit" className="btn btn-outline-primary w-100 py-3 fw-bold border-2">
                Decode & Unlock
              </button>
            </form>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white py-3 border-0 border-bottom">
            <h5 className="fw-bold mb-1 text-primary">Recent Patient History</h5>
            <p className="small text-muted mb-0">Persistent access granted (Last 3 days).</p>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="small text-uppercase fw-bold text-muted">
                    <th className="border-0 px-4 py-3">Patient Name</th>
                    <th className="border-0 py-3">Details</th>
                    <th className="border-0 py-3">Expires In</th>
                    <th className="border-0 px-4 py-3 text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {history.map((h) => {
                    const hoursLeft = Math.max(0, Math.round((new Date(h.expiresAt) - new Date()) / 3600000));
                    return (
                      <tr key={h.patientId}>
                        <td className="px-4 fw-bold text-dark">{h.name}</td>
                        <td className="small text-muted">{h.age} yrs • {h.gender}</td>
                        <td>
                          <span className={`badge rounded-pill px-3 py-2 ${hoursLeft < 12 ? 'bg-danger bg-opacity-10 text-danger' : 'bg-primary bg-opacity-10 text-primary'}`}>
                            {hoursLeft} hours left
                          </span>
                        </td>
                        <td className="px-4 text-end">
                          <button 
                            className="btn btn-primary btn-sm px-4 fw-bold rounded-pill"
                            onClick={() => navigate("/doctor/view", { state: { patientId: h.patientId } })}
                          >
                            Open Session
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}