import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axiosClient";

export default function AccessPatient() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [qrFile, setQrFile] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

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

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleSuccess = (data) => {
    setSuccessMsg(`Connection Established: Securely connected to ${data.data?.patientName || "Patient"}`);
    setTimeout(() => {
      navigate("/doctor/view", { state: { patientId: data.data.patientId } });
    }, 1500);
  };

  const startScanner = async () => {
    setIsScanning(true);
    setError("");
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner();
          try {
            const res = await api.post("/doctor/access/qr", { token: decodedText });
            handleSuccess(res.data);
          } catch (err) {
            setError(err.response?.data?.message || "QR Access failed");
          }
        },
        (errorMessage) => {
          // ignore scan errors as they happen constantly during scanning
        }
      );
    } catch (err) {
      setError("Camera access denied or error occurred. Please ensure permissions are granted.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setIsScanning(false);
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
        <p className="text-muted">Enter credentials or scan the patient's QR code to temporarily unlock access.</p>
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
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100 transition-hover">
            <h5 className="fw-bold mb-3 d-flex align-items-center text-primary">
              <i className="bi bi-key-fill me-2"></i>
              OTP Access
            </h5>
            <form onSubmit={handleOTP}>
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted">Six-Digit Password</label>
                <input 
                  type="text"
                  className="form-control form-control-lg text-center fw-bold bg-light border-0"
                  style={{ letterSpacing: '8px', fontSize: '1.5rem' }}
                  placeholder="000000" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-3 fw-bold shadow-sm rounded-pill">
                Unlock with OTP
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100 transition-hover">
            <h5 className="fw-bold mb-3 d-flex align-items-center text-primary">
              <i className="bi bi-qr-code-scan me-2"></i>
              QR Code Access
            </h5>
            
            {!isScanning ? (
              <>
                <div className="d-grid gap-2 mb-4">
                  <button 
                    className="btn btn-primary py-3 fw-bold rounded-pill text-uppercase small"
                    onClick={startScanner}
                  >
                    <i className="bi bi-camera-fill me-2"></i>
                    Scan with Camera
                  </button>
                  <div className="text-center position-relative my-2">
                    <hr className="text-muted opacity-25" />
                    <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 small text-muted">OR</span>
                  </div>
                </div>

                <form onSubmit={handleQRImage}>
                  <div className="mb-4 text-center">
                    <label className="form-label small fw-bold text-muted d-block text-start">Upload Image</label>
                    <input 
                      type="file" 
                      className="form-control bg-light border-0 py-2"
                      accept="image/*"
                      onChange={(e) => setQrFile(e.target.files[0])}
                      required={!isScanning}
                    />
                  </div>
                  <button type="submit" className="btn btn-outline-primary w-100 py-2 fw-bold rounded-pill border-2">
                    Decode File
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div id="reader" className="overflow-hidden rounded-3 mb-3 bg-dark" style={{ minHeight: '300px' }}></div>
                <button className="btn btn-danger w-100 py-3 fw-bold rounded-pill" onClick={stopScanner}>
                  <i className="bi bi-x-circle me-2"></i>
                  Stop Scanner
                </button>
              </div>
            )}
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