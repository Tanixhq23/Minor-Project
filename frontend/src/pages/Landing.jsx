import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";

export default function Landing() {
  return (
    <div className="mesh-gradient-bg min-vh-100">
      <Navbar />

      {/* Hero Section */}
      <section className="py-5 py-lg-5 overflow-hidden position-relative">
        <div className="container py-lg-5 mt-4">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <div className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2 fw-bold mb-4 animate__animated animate__fadeInDown">
                <i className="bi bi-shield-lock-fill me-2"></i>
                HIPAA Compliant Security
              </div>
              <h1 className="display-3 fw-bold mb-3 text-dark animate__animated animate__fadeIn animate__delay-1s" style={{ letterSpacing: '-2px', lineHeight: '1.2' }}>
                Your Health Records. <br className="d-none d-md-block" />
                <span className="text-primary">Your Control.</span>
              </h1>
              <p className="lead text-muted mb-5 px-md-5 animate__animated animate__fadeIn animate__delay-1s">
                Securely store and share your medical data with doctors using seamless, encrypted QR and OTP-based access. Say goodbye to manual paperwork.
              </p>

              <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 animate__animated animate__fadeInUp animate__delay-1s">
                <Link to="/register" className="btn btn-primary btn-lg px-5 rounded-pill shadow-lg py-3">
                  Get Started for Free
                </Link>
                <Link to="/login" className="btn btn-outline-dark btn-lg px-5 rounded-pill py-3">
                  Log In
                </Link>
              </div>

              <div className="mt-5 d-flex justify-content-center align-items-center gap-4 text-muted small opacity-75 animate__animated animate__fadeIn animate__delay-2s">
                 <div className="d-flex align-items-center"><i className="bi bi-check-circle-fill text-success me-2"></i> Encrypted Storage</div>
                 <div className="d-flex align-items-center"><i className="bi bi-check-circle-fill text-success me-2"></i> Universal Access</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5 bg-white position-relative">
        <div className="container py-5">
          <div className="text-center mb-5 mx-auto" style={{ maxWidth: '600px' }}>
             <h2 className="display-5 fw-bold mb-3">Why Choose HealthLock?</h2>
             <p className="lead text-muted">A modern ecosystem built for security, patient privacy, and clinical speed.</p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 glass-card p-4 text-center transition hover-lift">
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-4 mx-auto shadow-sm" style={{ width: '80px', height: '80px' }}>
                   <i className="bi bi-shield-lock-fill fs-1"></i>
                </div>
                <h3 className="h4 fw-bold mb-3 text-dark">Secure Storage</h3>
                <p className="text-muted mb-0 lh-base">Your records are safely stored on our encrypted servers, ensuring your medical history is private and protected over time.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 glass-card p-4 text-center transition hover-lift">
                <div className="bg-info bg-opacity-10 text-info rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-4 mx-auto shadow-sm" style={{ width: '80px', height: '80px' }}>
                   <i className="bi bi-qr-code-scan fs-1"></i>
                </div>
                <h3 className="h4 fw-bold mb-3 text-dark">QR Access</h3>
                <p className="text-muted mb-0 lh-base">Share access instantly and seamlessly with medical professionals via automatically generated, time-sensitive QR codes.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 glass-card p-4 text-center transition hover-lift">
                <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-4 mx-auto shadow-sm" style={{ width: '80px', height: '80px' }}>
                   <i className="bi bi-key-fill fs-1"></i>
                </div>
                <h3 className="h4 fw-bold mb-3 text-dark">OTP Sharing</h3>
                <p className="text-muted mb-0 lh-base">Provide temporary, secure access to your documents using One-Time Passwords tailored specifically for your remote consultations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="py-5 bg-light position-relative overflow-hidden">
        <div className="container py-5 text-center position-relative z-1">
          <h2 className="display-5 fw-bold mb-5">How It Works</h2>

          <div className="row g-5">
            <div className="col-lg-4 step-wrapper">
              <div className="p-4 bg-white rounded-5 shadow-sm h-100 position-relative">
                <div className="bg-primary text-white rounded-circle fs-3 fw-bold d-flex align-items-center justify-content-center mx-auto mb-4 border border-5 border-light shadow-md" style={{ width: '80px', height: '80px' }}>01</div>
                <h3 className="h4 fw-bold mb-3 text-dark">Upload Documents</h3>
                <p className="text-muted mb-0">Sign up and securely upload your medical records into your private locked vault.</p>
              </div>
            </div>

            <div className="col-lg-4 step-wrapper">
              <div className="p-4 bg-white rounded-5 shadow-sm h-100 position-relative">
                <div className="bg-primary text-white rounded-circle fs-3 fw-bold d-flex align-items-center justify-content-center mx-auto mb-4 border border-5 border-light shadow-md" style={{ width: '80px', height: '80px' }}>02</div>
                <h3 className="h4 fw-bold mb-3 text-dark">Grant Access</h3>
                <p className="text-muted mb-0">Generate a secure QR code or OTP to grant a specific doctor temporary view access.</p>
              </div>
            </div>

            <div className="col-lg-4 step-wrapper">
              <div className="p-4 bg-white rounded-5 shadow-sm h-100 position-relative">
                <div className="bg-primary text-white rounded-circle fs-3 fw-bold d-flex align-items-center justify-content-center mx-auto mb-4 border border-5 border-light shadow-md" style={{ width: '80px', height: '80px' }}>03</div>
                <h3 className="h4 fw-bold mb-3 text-dark">Doctor Reviews</h3>
                <p className="text-muted mb-0">The chosen doctor securely views your digital records instantly for better care.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 px-3">
        <div className="container rounded-5 bg-light shadow-sm text-center py-5 px-4 border">
          <div className="mx-auto" style={{ maxWidth: '800px' }}>
            <h2 className="display-5 fw-bold mb-3 text-dark">
              Ready to Take Control?
            </h2>
            <p className="lead text-muted mb-5 mx-auto px-lg-5">
              Join thousands of users who trust HealthLock to manage their medical history with military-grade encryption and 100% patient autonomy.
            </p>
            <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3">
              <Link to="/register" className="btn btn-primary btn-lg px-5 rounded-pill fw-bold py-3 shadow-sm">
                Create Your Free Account
              </Link>
              <Link to="/login" className="btn btn-outline-primary btn-lg px-5 rounded-pill py-3">
                Sign In to Vault
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-5 border-top bg-white">
        <div className="container text-center text-muted small">
          <p className="mb-0">&copy; {new Date().getFullYear()} HealthLock. All rights reserved Secure Medical Vault.</p>
        </div>
      </footer>
    </div>
  );
}