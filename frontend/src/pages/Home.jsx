import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="page">
      <header className="header">
        <h1 className="header-title">Health-Lock</h1>
      </header>

      <div className="container">
        <section className="hero">
          <p className="hero-badge">Secure Medical Sharing</p>
          <h2 className="hero-title">Fast, private report access with QR security</h2>
          <p className="hero-sub">Built for patients and doctors. Smooth access, strict controls, and transparent activity logs.</p>
        </section>

        <section className="grid grid-2" style={{ marginTop: 24 }}>
          <div className="card center landing-auth-card">
            <h3 className="card-title auth-mini-title">Create Account</h3>
            <p className="muted">New here? Sign up as a patient or doctor.</p>
            <Link className="btn auth-action-btn" to="/signup">Sign Up</Link>
          </div>

          <div className="card center landing-auth-card">
            <h3 className="card-title auth-mini-title">Sign In</h3>
            <p className="muted">Already have an account? Sign in to continue.</p>
            <Link className="btn auth-action-btn" to="/signin">Sign In</Link>
          </div>
        </section>

        <section className="pill-grid">
          <div className="pill">Patients upload reports and generate time-bound QR links</div>
          <div className="pill">Doctors scan securely from camera or saved image</div>
          <div className="pill">Every report access is logged for full transparency</div>
        </section>
      </div>
    </div>
  );
}
