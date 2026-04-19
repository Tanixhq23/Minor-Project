import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import { Link } from "react-router-dom";

export default function DashboardLayout({ children }) {
  return (
    <div className="container-fluid p-0">
      {/* Mobile Top Navbar */}
      <nav className="navbar navbar-dark bg-dark d-md-none px-3 sticky-top">
        <Link className="navbar-brand fw-bold" to="/">HealthLock</Link>
        <button 
          className="navbar-toggler border-0 shadow-none" 
          type="button" 
          data-bs-toggle="offcanvas" 
          data-bs-target="#sidebarOffcanvas"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
      </nav>

      <div className="row g-0">
        {/* Desktop Sidebar (Left column) */}
        <div className="col-md-3 col-lg-2 d-none d-md-block bg-dark min-vh-100 sticky-top">
          <Sidebar />
        </div>

        {/* Mobile Offcanvas Sidebar */}
        <div className="offcanvas offcanvas-start bg-dark text-white" tabIndex="-1" id="sidebarOffcanvas" style={{ width: '280px' }}>
          <div className="offcanvas-header border-bottom border-secondary">
            <h5 className="offcanvas-title fw-bold text-primary">HealthLock</h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body p-0">
             <Sidebar isMobile />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="col-md-9 col-lg-10 p-4 p-md-5">
          {children}
        </main>
      </div>
    </div>
  );
}