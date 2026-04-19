import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axiosClient";
import CountdownTimer from "../../components/CountdownTimer";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);
  const [generatingQr, setGeneratingQr] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setStatus("Uploading to secure vault...");
    setError("");
    setUploadedDoc(null);
    setQrDataUrl("");
    setExpiresAt(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/patient/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedDoc(res.data.data);
      setStatus("File uploaded successfully!");
      setFile(null);
      e.target.reset();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Upload failed. Please try again.");
      setStatus("");
    }
  };

  const handleGenerateQR = async () => {
    if (!uploadedDoc) return;
    setGeneratingQr(true);
    setError("");
    try {
      const res = await api.post("/patient/access/qr", { documentId: uploadedDoc.id });
      setQrDataUrl(res.data.data.qrDataUrl);
      setExpiresAt(res.data.data.expiresAt);
      setStatus("QR generated! This code unlocks only this specific document.");
    } catch (err) {
      console.error(err);
      setError("Failed to generate QR code.");
    } finally {
      setGeneratingQr(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h2 className="fw-bold">Upload Document</h2>
        <p className="text-muted text-break">Add new medical records securely to your encrypted vault.</p>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 rounded-4 mb-4">
            <form onSubmit={handleUpload}>
              {error && (
                <div className="alert alert-danger px-3 py-2 small d-flex align-items-center mb-4">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}
              {status && (
                <div className="alert alert-success px-3 py-2 small d-flex align-items-center mb-4">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {status}
                </div>
              )}

              <div className="mb-4 text-center p-5 border border-2 border-dashed rounded-4 bg-light bg-opacity-50">
                <i className="bi bi-cloud-arrow-up display-1 text-primary mb-3"></i>
                <h5 className="fw-bold mb-1">Select Laboratory Report</h5>
                <p className="small text-muted mb-4 px-lg-5">PDF, Photos, or Word Docs (Max 20MB)</p>
                
                <input
                  type="file"
                  className="form-control"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => { 
                    setFile(e.target.files[0]); 
                    setUploadedDoc(null); 
                    setQrDataUrl(""); 
                    setExpiresAt(null); 
                  }}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-100 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center" 
                disabled={!file}
              >
                <i className="bi bi-shield-lock-fill me-2"></i>
                Upload Securely
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-6">
          {/* Post-Upload: Generate QR */}
          {uploadedDoc && !qrDataUrl && (
            <div className="card border-0 shadow-sm p-4 rounded-4 text-center h-100 animate-fade-in">
              <div className="mb-4">
                <i className="bi bi-check2-circle display-1 text-success"></i>
              </div>
              <h3 className="h4 fw-bold mb-2">Upload Successful</h3>
              <p className="text-muted small mb-4 px-md-4">
                <strong>{uploadedDoc.originalName}</strong> is now encrypted. 
                Generate a temporary QR code to share <u>only this specific file</u> with a doctor.
              </p>
              <button
                type="button"
                onClick={handleGenerateQR}
                className="btn btn-primary btn-lg w-100 py-3 rounded-3 shadow-sm"
                disabled={generatingQr}
              >
                {generatingQr ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Generating...
                  </>
                ) : "Create Document QR"}
              </button>
            </div>
          )}

          {/* QR Output */}
          {qrDataUrl && (
            <div className="card border-0 shadow-sm p-4 rounded-4 text-center animate-fade-in h-100 border-primary border-opacity-25" style={{ backgroundColor: "#f0f7ff" }}>
              <h4 className="fw-bold mb-1">Document Secure QR</h4>
              <p className="text-muted small mb-4">Only grants access to <strong>{uploadedDoc.originalName}</strong></p>
              
              {expiresAt && (
                <div className="mb-4">
                  <CountdownTimer expiresAt={expiresAt} onExpire={() => setQrDataUrl("")} />
                </div>
              )}

              <div className="bg-white p-3 rounded-4 shadow-sm d-inline-block mx-auto mb-4 border border-primary border-opacity-10">
                <img
                  src={qrDataUrl}
                  alt="Secure access QR code"
                  className="img-fluid"
                  style={{ width: "200px", height: "200px" }}
                />
              </div>

              <a
                href={qrDataUrl}
                download={`healthlock-qr-${uploadedDoc.id}.png`}
                className="btn btn-outline-primary w-100 py-3 fw-bold rounded-3 bg-white"
              >
                <i className="bi bi-download me-2"></i>
                Save QR to Device
              </a>
            </div>
          )}

          {!uploadedDoc && !qrDataUrl && (
            <div className="card border-0 shadow-sm p-4 rounded-4 text-center h-100 d-flex flex-column justify-content-center opacity-75 grayscale border-dashed border-2">
              <i className="bi bi-qr-code display-1 text-muted opacity-25 mb-4"></i>
              <h3 className="h5 text-muted">Ready for QR Generation</h3>
              <p className="small text-muted">Upload a file first to create a secure sharing code.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}