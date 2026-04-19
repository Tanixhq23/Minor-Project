import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axiosClient";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(15);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (currentLimit) => {
    try {
      const res = await api.get(`/patient/logs?limit=${currentLimit}`);
      const fetchedLogs = res.data?.data?.logs || [];
      setLogs(fetchedLogs);
      
      // If we got fewer than the limit, we probably reached the end
      if (fetchedLogs.length < currentLimit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(limit);
  }, [limit]);

  const handleLoadMore = () => {
    setLimit(prev => prev + 15);
  };

  const getActionLabel = (action) => {
    switch (action) {
      case "VIEW_PROFILE": return "Viewed Profile";
      case "LIST_DOCS": return "Listed Documents";
      case "STREAM_DOC": return "Accessed Document";
      default: return action;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-4 text-break">
        <h2 className="fw-bold">Access Logs</h2>
        <p className="text-muted small">A transparent audit trail of who accessed your medical records and when.</p>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
        <div className="card-body p-0">
          {loading && logs.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3 mb-0">Loading audit trails...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5 opacity-50">
              <i className="bi bi-journal-x display-3 text-muted"></i>
              <p className="mt-3">No access logs recorded yet.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr className="small text-uppercase fw-bold text-muted">
                      <th className="border-0 px-4 py-3">Doctor</th>
                      <th className="border-0 py-3">Action</th>
                      <th className="border-0 py-3">Resource</th>
                      <th className="border-0 py-3">Timestamp</th>
                      <th className="border-0 px-4 py-3 text-end">Identity</th>
                    </tr>
                  </thead>
                  <tbody className="border-top-0">
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px' }}>
                              <i className="bi bi-person-fill small"></i>
                            </div>
                            <span className="fw-bold text-dark">{log.doctorName}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge rounded-pill fw-medium py-2 px-3 ${
                            log.action === 'STREAM_DOC' ? 'bg-primary bg-opacity-10 text-primary' : 
                            'bg-secondary bg-opacity-10 text-secondary'
                          }`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {log.documentName ? (
                            <div className="d-flex align-items-center">
                              <i className="bi bi-file-earmark-text me-2 opacity-50"></i>
                              <span className="text-truncate" style={{ maxWidth: '150px' }}>{log.documentName}</span>
                            </div>
                          ) : (
                            <span className="opacity-50">Full Profile</span>
                          )}
                        </td>
                        <td className="small text-muted">
                          <div className="lh-sm">
                             {new Date(log.timestamp).toLocaleDateString()} <br/>
                             <span className="opacity-50" style={{ fontSize: '0.7rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </td>
                        <td className="px-4 text-end">
                          <code className="small text-muted opacity-75" style={{ fontSize: '0.65rem' }}>IP: {log.ip || "..."}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasMore && (
                <div className="p-4 text-center border-top">
                  <button 
                    className="btn btn-outline-primary px-5 rounded-pill fw-bold" 
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-arrow-down-circle me-2"></i>
                    )}
                    Load More Activity
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}