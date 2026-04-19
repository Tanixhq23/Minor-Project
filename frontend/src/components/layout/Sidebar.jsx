import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ isMobile }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  // Helper to close offcanvas on mobile
  const closeOffcanvas = () => {
    if (isMobile) {
      const offcanvasElement = document.getElementById('sidebarOffcanvas');
      const bsOffcanvas = window.bootstrap?.Offcanvas.getInstance(offcanvasElement);
      bsOffcanvas?.hide();
    }
  };

  return (
    <div className={`d-flex flex-column p-4 h-100 bg-dark text-white shadow`}>
      {!isMobile && (
        <h2 className="text-primary fw-bold fs-3 mb-4" style={{ letterSpacing: "-1px" }}>HealthLock</h2>
      )}

      <nav className="nav nav-pills flex-column mb-auto gap-2">
        {user?.role === "patient" && (
          <>
            <Link 
              className={`nav-link text-white ${isActive("/patient/dashboard") ? "active bg-primary" : "opacity-75"}`} 
              to="/patient/dashboard"
              onClick={closeOffcanvas}
            >
              <i className="bi bi-speedometer2 me-2"></i> Dashboard
            </Link>
            <Link 
              className={`nav-link text-white ${isActive("/patient/upload") ? "active bg-primary" : "opacity-75"}`} 
              to="/patient/upload"
              onClick={closeOffcanvas}
            >
              <i className="bi bi-cloud-upload me-2"></i> Upload Data
            </Link>
            <Link 
              className={`nav-link text-white ${isActive("/patient/access") ? "active bg-primary" : "opacity-75"}`} 
              to="/patient/access"
              onClick={closeOffcanvas}
            >
              <i className="bi bi-person-check me-2"></i> Manage Access
            </Link>
            <Link 
              className={`nav-link text-white ${isActive("/patient/logs") ? "active bg-primary" : "opacity-75"}`} 
              to="/patient/logs"
              onClick={closeOffcanvas}
            >
              <i className="bi bi-journal-text me-2"></i> Audit Logs
            </Link>
            <Link 
              className={`nav-link text-white ${isActive("/profile") ? "active bg-primary" : "opacity-75"}`} 
              to="/profile"
              onClick={closeOffcanvas}
            >
              <i className="bi bi-person-circle me-2"></i> My Profile
            </Link>
          </>
        )}

        {user?.role === "doctor" && (
          <>
            <Link 
              className={`nav-link text-white ${isActive("/doctor/access") ? "active bg-primary" : "opacity-75"}`} 
              to="/doctor/access"
              onClick={closeOffcanvas}
            >
              <i className="bi bi-camera me-2"></i> Access Patient
            </Link>
            <Link 
              className={`nav-link text-white ${isActive("/doctor/view") ? "active bg-primary" : "opacity-75"}`} 
              to="/doctor/view"
              onClick={closeOffcanvas}
            >
              <i className="bi bi-file-earmark-medical me-2"></i> Active Session
            </Link>
            <Link 
              className={`nav-link text-white ${isActive("/profile") ? "active bg-primary" : "opacity-75"}`} 
              to="/profile"
              onClick={closeOffcanvas}
            >
              <i className="bi bi-person-circle me-2"></i> My Profile
            </Link>
          </>
        )}
      </nav>

      <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
        {user && (
          <div className="mb-3">
            <div className="small opacity-50 text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
              Logged in as {user.role}
            </div>
            <div className="text-white fw-bold text-truncate">{user.name}</div>
          </div>
        )}
        <button 
          onClick={logout} 
          className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center py-2"
        >
          <i className="bi bi-box-arrow-right me-2"></i>
          Sign Out
        </button>
      </div>
    </div>
  );
}