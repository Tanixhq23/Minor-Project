import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axiosClient";

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [accessCount, setAccessCount] = useState(0);
  const [downloadRequests, setDownloadRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const docRes = await api.get("/patient/documents");
      setDocuments(docRes.data?.data?.documents || []);

      const accessRes = await api.get("/patient/access/active");
      setAccessCount(accessRes.data?.data?.access?.length || 0);

      const reqRes = await api.get("/patient/permissions");
      setDownloadRequests(reqRes.data?.data?.requests || []);
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);

    const interval = setInterval(() => {
      fetchData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRespond = async (requestId, status) => {
    try {
      await api.patch(`/patient/permissions/${requestId}`, { status });
      fetchData();
    } catch (err) {
      alert("Action failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this document?")) return;
    try {
      await api.delete(`/patient/documents/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete document.");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h2 className="fw-bold">Dashboard</h2>
        <p className="text-muted">Overview of your medical records securely stored.</p>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-sm-6 col-lg-4">
          <div className="card border-0 shadow-sm p-4 h-100 bg-white">
            <h3 className="display-5 fw-bold text-primary mb-1">{documents.length}</h3>
            <p className="text-muted mb-0 fw-medium">Total Documents</p>
          </div>
        </div>

        <div className="col-sm-6 col-lg-4">
          <div className="card border-0 shadow-sm p-4 h-100 bg-white">
            <h3 className="display-5 fw-bold text-success mb-1">{accessCount}</h3>
            <p className="text-muted mb-0 fw-medium">Active Access Grants</p>
          </div>
        </div>
      </div>

      {downloadRequests.length > 0 && (
        <div className="card border-0 shadow-sm mb-5 overflow-hidden">
          <div className="card-header bg-primary bg-opacity-10 border-0 py-3">
            <h5 className="card-title fw-bold mb-0 text-primary d-flex align-items-center">
              <i className="bi bi-bell-fill me-2"></i>
              Pending Download Requests
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="list-group list-group-flush">
              {downloadRequests.map((req) => (
                <div key={req._id} className="list-group-item p-3 border-0 border-bottom">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div>
                      <strong className="d-block">{req.doctorId.name}</strong>
                      <span className="small text-muted text-break">Requested access to: {req.documentId.originalName}</span>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        onClick={() => handleRespond(req._id, "approved")}
                        className="btn btn-primary btn-sm px-4 fw-bold shadow-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRespond(req._id, "rejected")}
                        className="btn btn-outline-danger btn-sm px-4 fw-bold"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h3 className="h5 fw-bold mb-4">My Uploaded Reports</h3>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-x fs-1 text-muted opacity-25"></i>
              <p className="text-muted mt-3">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 px-3">Name</th>
                    <th className="border-0">Type</th>
                    <th className="border-0">Date</th>
                    <th className="border-0 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-3 fw-medium text-dark">{doc.originalName}</td>
                      <td>
                        <span className="badge bg-light text-muted fw-normal">{doc.mimeType}</span>
                      </td>
                      <td className="small">{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="btn btn-link link-danger p-1"
                          title="Delete document"
                        >
                          <i className="bi bi-trash3 fs-5"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}