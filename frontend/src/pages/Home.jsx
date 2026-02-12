import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <header className="app-navbar">
        <div className="container d-flex align-items-center justify-content-between py-3">
          <h1 className="h4 mb-0 fw-bold">Health-Lock</h1>
        </div>
      </header>

      <div className="container py-4">
        <section className="text-center py-3">
          <span className="badge text-bg-primary text-uppercase mb-3">Secure Medical Sharing</span>
          <h2 className="display-5 fw-semibold">Fast, private report access with QR security</h2>
          <p className="text-secondary lead">
            Built for patients and doctors. Smooth access, strict controls, and transparent activity logs.
          </p>
        </section>

        <section className="row g-4 mt-2">
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-body text-center d-grid gap-2">
                <h3 className="h5 fw-semibold mb-0">Create Account</h3>
                <p className="text-secondary mb-0">New here? Sign up as a patient or doctor.</p>
                <Link className="btn btn-outline-primary" to="/signup">Sign Up</Link>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-body text-center d-grid gap-2">
                <h3 className="h5 fw-semibold mb-0">Sign In</h3>
                <p className="text-secondary mb-0">Already have an account? Sign in to continue.</p>
                <Link className="btn btn-outline-primary" to="/signin">Sign In</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="row g-3 mt-4">
          <div className="col-md-4">
            <div className="h-100 border rounded bg-white shadow-sm p-3 small">
              Patients upload reports and generate time-bound QR links
            </div>
          </div>
          <div className="col-md-4">
            <div className="h-100 border rounded bg-white shadow-sm p-3 small">
              Doctors scan securely from camera or saved image
            </div>
          </div>
          <div className="col-md-4">
            <div className="h-100 border rounded bg-white shadow-sm p-3 small">
              Every report access is logged for full transparency
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
