import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg sticky-top bg-white border-bottom py-3">
      <div className="container">
        <Link to="/" className="navbar-brand fw-bold text-primary fs-3" style={{ letterSpacing: '-1px' }}>
          HealthLock
        </Link>
        
        <button 
          className="navbar-toggler border-0 shadow-none" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#landingNavbar" 
          aria-controls="landingNavbar" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="landingNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link fw-medium px-lg-3" href="#features">Features</a>
            </li>
            <li className="nav-item">
              <a className="nav-link fw-medium px-lg-3" href="#how">How it Works</a>
            </li>
          </ul>
          
          <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
            <Link to="/login" className="text-decoration-none text-dark fw-semibold px-2">Log in</Link>
            <Link to="/register" className="btn btn-primary px-4 rounded-pill fw-bold">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}