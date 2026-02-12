import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppNavbar from "../components/AppNavbar.jsx";
import { getSession, logout } from "../lib/api.js";

const patientActions = [
  { label: "Upload Report", to: "/patient?tab=upload", icon: "fa-file-arrow-up" },
  { label: "See Uploads", to: "/patient?tab=uploads", icon: "fa-folder-open" },
  { label: "Report Analyzer", to: "/patient?tab=analyzer", icon: "fa-magnifying-glass-chart" },
  { label: "Profile Requests", to: "/patient?tab=requests", icon: "fa-user-check" },
  { label: "About", to: "/patient?tab=about", icon: "fa-circle-info" },
  { label: "Support", to: "/patient?tab=support", icon: "fa-headset" },
];

const doctorActions = [
  { label: "Scanner", to: "/doctor?tab=scanner", icon: "fa-qrcode" },
  { label: "Patient Details", to: "/doctor?tab=patient", icon: "fa-user-doctor" },
  { label: "About", to: "/doctor?tab=about", icon: "fa-circle-info" },
  { label: "Support", to: "/doctor?tab=support", icon: "fa-headset" },
];

const featureCards = [
  {
    icon: "fa-lock",
    title: "Role-based Access",
    text: "Only authorized patient and doctor roles can enter the record flow.",
  },
  {
    icon: "fa-shield-heart",
    title: "Consent-first Sharing",
    text: "Patients control who gets report access through generated QR links.",
  },
  {
    icon: "fa-clock-rotate-left",
    title: "Audit Trail",
    text: "Every access event is recorded to maintain transparency.",
  },
  {
    icon: "fa-mobile-screen-button",
    title: "Mobile Friendly",
    text: "Scan with camera or upload image without leaving the dashboard.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    getSession()
      .then((data) => setSession(data || null))
      .finally(() => setCheckingSession(false));
  }, []);

  const isLoggedIn = !!session?.role;
  const profileTo = session?.role === "doctor" ? "/doctor" : "/patient";

  const quickActions = useMemo(() => {
    if (session?.role === "patient") return patientActions;
    if (session?.role === "doctor") return doctorActions;
    return [];
  }, [session?.role]);

  const onLogout = async () => {
    await logout();
    setSession(null);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      <AppNavbar
        title="Health-Lock"
        aboutTo="/#about"
        supportTo="/#support"
        showProfile={isLoggedIn}
        profileTo={profileTo}
        onLogout={isLoggedIn ? onLogout : undefined}
      />

      <div className="container py-4 py-md-5">
        <div className="row g-4 align-items-start">
          <div className={isLoggedIn ? "col-xl-8" : "col-12"}>
            <section className="landing-hero p-4 p-md-5 mb-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <span className="landing-badge">
                  <i className="fa-solid fa-shield-halved me-2" /> Secure Medical Sharing
                </span>
                <div className="landing-mini-metric">
                  <i className="fa-solid fa-check-circle me-2" /> Role verified session
                </div>
              </div>

              <h1 className="display-5 fw-bold mt-1 mb-3">Share reports securely without the paperwork delay</h1>
              <p className="text-secondary lead mb-4">
                Health-Lock modernizes report delivery with QR-based consent, direct doctor retrieval,
                and transparent logs, while keeping the workflow simple for both patients and clinics.
              </p>

              <div className="d-flex flex-wrap gap-2 mb-4">
                {isLoggedIn ? (
                  <>
                    <Link className="btn btn-primary" to={profileTo}>Open Dashboard</Link>
                    <button className="btn btn-outline-primary" type="button" onClick={onLogout}>Logout</button>
                  </>
                ) : (
                  <>
                    <Link className="btn btn-primary" to="/signin">Sign In</Link>
                    <Link className="btn btn-outline-primary" to="/signup">Create Account</Link>
                  </>
                )}
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <div className="hero-stat">
                    <div className="hero-stat-icon"><i className="fa-solid fa-file-medical" /></div>
                    <div>
                      <div className="hero-stat-value">One-click</div>
                      <div className="hero-stat-label">report upload flow</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="hero-stat">
                    <div className="hero-stat-icon"><i className="fa-solid fa-qrcode" /></div>
                    <div>
                      <div className="hero-stat-value">QR-based</div>
                      <div className="hero-stat-label">doctor access token</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="hero-stat">
                    <div className="hero-stat-icon"><i className="fa-solid fa-clipboard-list" /></div>
                    <div>
                      <div className="hero-stat-value">Live logs</div>
                      <div className="hero-stat-label">for every report open</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="row g-3 mb-4">
              {featureCards.map((feature) => (
                <div key={feature.title} className="col-md-6">
                  <div className="landing-feature h-100">
                    <div className="landing-feature-icon">
                      <i className={`fa-solid ${feature.icon}`} />
                    </div>
                    <h2 className="h6 fw-bold mb-1">{feature.title}</h2>
                    <p className="mb-0 text-secondary small">{feature.text}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="landing-panel p-4 mb-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 className="h5 fw-semibold mb-0">Health-Lock vs Traditional Sharing</h2>
                <span className="small text-secondary">Workflow comparison</span>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="comparison-card traditional h-100">
                    <h3 className="h6 fw-semibold mb-2"><i className="fa-solid fa-folder me-2" />Traditional</h3>
                    <ul className="list-unstyled mb-0 small text-secondary d-grid gap-2">
                      <li><i className="fa-solid fa-xmark text-danger me-2" />Manual handoffs and repeated print/share cycles</li>
                      <li><i className="fa-solid fa-xmark text-danger me-2" />No direct visibility into who viewed records</li>
                      <li><i className="fa-solid fa-xmark text-danger me-2" />Delayed access when patient and doctor are remote</li>
                    </ul>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="comparison-card modern h-100">
                    <h3 className="h6 fw-semibold mb-2"><i className="fa-solid fa-bolt me-2" />Health-Lock</h3>
                    <ul className="list-unstyled mb-0 small text-secondary d-grid gap-2">
                      <li><i className="fa-solid fa-check text-success me-2" />Secure QR transfer from patient dashboard</li>
                      <li><i className="fa-solid fa-check text-success me-2" />Doctor scans and opens report in seconds</li>
                      <li><i className="fa-solid fa-check text-success me-2" />Full access history for accountability</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="landing-panel p-4 mb-4">
              <h2 className="h5 fw-semibold mb-3">Workflow Metrics Snapshot</h2>
              <div className="row g-4">
                <div className="col-md-7">
                  <p className="small text-secondary mb-2">Relative efficiency (illustrative)</p>
                  <div className="mb-2">
                    <div className="d-flex justify-content-between small mb-1">
                      <span>Report delivery speed</span>
                      <span className="fw-semibold">92%</span>
                    </div>
                    <div className="progress graph-progress" role="progressbar" aria-label="Speed" aria-valuenow="92" aria-valuemin="0" aria-valuemax="100">
                      <div className="progress-bar" style={{ width: "92%" }} />
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="d-flex justify-content-between small mb-1">
                      <span>Traceability coverage</span>
                      <span className="fw-semibold">96%</span>
                    </div>
                    <div className="progress graph-progress" role="progressbar" aria-label="Traceability" aria-valuenow="96" aria-valuemin="0" aria-valuemax="100">
                      <div className="progress-bar" style={{ width: "96%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>Manual dependency reduced</span>
                      <span className="fw-semibold">78%</span>
                    </div>
                    <div className="progress graph-progress" role="progressbar" aria-label="Manual dependency" aria-valuenow="78" aria-valuemin="0" aria-valuemax="100">
                      <div className="progress-bar" style={{ width: "78%" }} />
                    </div>
                  </div>
                </div>

                <div className="col-md-5">
                  <div className="mini-bar-chart" aria-hidden="true">
                    <div className="mini-bar" style={{ height: "48%" }} />
                    <div className="mini-bar" style={{ height: "74%" }} />
                    <div className="mini-bar" style={{ height: "66%" }} />
                    <div className="mini-bar" style={{ height: "88%" }} />
                    <div className="mini-bar" style={{ height: "94%" }} />
                  </div>
                  <p className="small text-secondary mb-0 mt-2">Trend: Adoption and access transparency improve month over month.</p>
                </div>
              </div>
            </section>

            <section id="about" className="landing-panel p-4 mb-4">
              <h2 className="h4 fw-semibold"><i className="fa-solid fa-circle-info me-2" />About</h2>
              <p className="text-secondary mb-0">
                Health-Lock is a secure bridge between patients and doctors. It is designed to replace slow,
                manual sharing with a controlled digital route where patients stay in charge of report access.
              </p>
            </section>

            <section id="support" className="landing-panel p-4 mb-4">
              <h2 className="h4 fw-semibold"><i className="fa-solid fa-headset me-2" />Support</h2>
              <p className="text-secondary mb-2">Need assistance or want to report an issue?</p>
              <p className="mb-0 fw-semibold">tanishqlokhande2005@gmail.com</p>
            </section>

            <section className="landing-cta p-4 p-md-5">
              <div className="row g-3 align-items-center">
                <div className="col-md-8">
                  <h2 className="h4 fw-bold mb-2">Ready to move beyond traditional report sharing?</h2>
                  <p className="mb-0 text-secondary">Start now with secure access, cleaner workflow, and full visibility.</p>
                </div>
                <div className="col-md-4 d-flex justify-content-md-end">
                  {isLoggedIn ? (
                    <Link className="btn btn-primary" to={profileTo}>Continue to Dashboard</Link>
                  ) : (
                    <Link className="btn btn-primary" to="/signup">Get Started</Link>
                  )}
                </div>
              </div>
            </section>
          </div>

          {isLoggedIn && (
            <aside className="col-xl-4">
              <div className="landing-quick-sidebar">
                <div className="landing-quick-header">
                  <p className="small text-uppercase mb-1 text-secondary fw-semibold">Logged in as</p>
                  <h3 className="h5 mb-0 text-capitalize">{session.role}</h3>
                </div>

                {checkingSession ? (
                  <p className="text-secondary small mb-0">Loading options...</p>
                ) : (
                  <div className="d-grid gap-2">
                    {quickActions.map((item) => (
                      <Link key={item.label} className="btn btn-outline-primary quick-action-btn" to={item.to}>
                        <i className={`fa-solid ${item.icon} me-2`} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
