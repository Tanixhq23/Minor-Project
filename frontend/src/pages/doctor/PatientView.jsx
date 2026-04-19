import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axiosClient";

export default function PatientView() {
  const location = useLocation();
  const navigate = useNavigate();
  const patientId = location.state?.patientId;

  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) {
      navigate("/doctor/access");
      return;
    }

    const loadData = async () => {
      try {
        const profRes = await api.get(`/doctor/patient/${patientId}`);
        setProfile(profRes.data?.data?.profile);

        const docRes = await api.get(`/doctor/patient/${patientId}/documents`);
        setDocuments(docRes.data?.data?.documents || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch patient data. Consent session may have expired.");
      }
    };
    loadData();
  }, [patientId, navigate]);

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h2 className="fw-bold text-dark">Patient Records</h2>
        <p className="text-muted small">View securely shared documents for {profile ? profile.name : "..."}</p>
      </div>

      {error ? (
        <div className="alert alert-danger px-3 py-2 small d-flex align-items-center mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      ) : (
        <>
          {profile && (
            <div className="card border-0 shadow-sm mb-4 border-start border-primary border-4 rounded-4 overflow-hidden">
              <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <small className="text-uppercase text-muted fw-bold lh-1 d-block mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Secure Patient Session</small>
                  <h3 className="h2 fw-bold text-primary mb-0">{profile.name}</h3>
                </div>
                <div className="text-md-end">
                  <span className="d-block fw-bold text-dark">{profile.age || "N/A"} Years • {profile.gender}</span>
                  <span className="badge rounded-pill bg-success bg-opacity-10 text-success fw-bold p-2 small mt-2">
                    <i className="bi bi-patch-check-fill me-1"></i>
                    Verified Identity
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 border-0 border-bottom">
              <h5 className="fw-bold mb-0">Shared Documents ({documents.length})</h5>
            </div>
            <div className="card-body p-0">
              {documents.length === 0 ? (
                <div className="text-center py-5 opacity-50">
                   <i className="bi bi-file-earmark-medical display-4 text-muted"></i>
                   <p className="mt-3">No documents shared with this access code.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {documents.map((doc) => (
                    <div key={doc.id} className="list-group-item p-3 p-md-4 border-0 border-bottom">
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 text-break">
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-light p-2 rounded-3 text-primary">
                            <i className="bi bi-file-earmark-text fs-4"></i>
                          </div>
                          <div>
                            <p className="mb-0 fw-bold text-dark">{doc.originalName || "Unnamed Document"}</p>
                            <small className="text-muted">
                              {doc.mimeType} &bull; {(doc.size / 1024).toFixed(2)} KB
                            </small>
                          </div>
                        </div>

                        <div className="d-flex gap-2 w-100 w-md-auto ms-auto ms-md-0">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm px-3 flex-fill shadow-sm fw-bold"
                          >
                            Open (View)
                          </a>

                          {doc.approvalStatus === "approved" ? (
                            <a
                              href={`${doc.fileUrl}?download=true`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary btn-sm px-3 flex-fill fw-bold shadow-sm"
                              download
                            >
                              Download
                            </a>
                          ) : doc.approvalStatus === "pending" ? (
                            <button className="btn btn-secondary btn-sm px-3 flex-fill fw-bold opacity-75" disabled>
                               Pending...
                            </button>
                          ) : (
                            <button 
                              className="btn btn-primary btn-sm px-3 flex-fill fw-bold shadow-sm" 
                              onClick={async () => {
                                try {
                                  await api.post(`/doctor/patient/${patientId}/documents/${doc.id}/request`);
                                  const docRes = await api.get(`/doctor/patient/${patientId}/documents`);
                                  setDocuments(docRes.data?.data?.documents || []);
                                } catch (err) {
                                  alert("Failed to send request.");
                                }
                              }}
                            >
                              Request Download
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}