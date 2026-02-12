import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getSession } from "../lib/api.js";
import NavArrow from "../components/NavArrow.jsx";

export default function Signin() {
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      if (session?.role) {
        navigate(session.role === "doctor" ? "/doctor" : "/patient", { replace: true });
      }
    });
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    const payload = {
      role: event.target.signinRole.value,
      email: event.target.signinEmail.value,
      password: event.target.signinPassword.value,
      rememberMe: event.target.rememberMe.checked
    };

    try {
      const res = await apiFetch("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Signed in! Redirecting..." });
        setTimeout(() => {
          navigate(data?.data?.role === "doctor" ? "/doctor" : "/patient");
        }, 1200);
      } else {
        setMessage({ type: "error", text: data?.error?.message || "Signin failed." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to connect to the server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      <header className="app-navbar">
        <div className="container d-flex align-items-center gap-2 py-3">
          <NavArrow />
          <h1 className="h5 mb-0 fw-bold">Health-Lock</h1>
        </div>
      </header>

      <div className="container py-4">
        <div className="text-center mb-4">
          <h1 className="h3 fw-semibold mb-2">Sign In</h1>
          <p className="text-secondary mb-0">Welcome back. Continue with your secure portal.</p>
        </div>

        <div className="card shadow-sm mx-auto" style={{ maxWidth: 560 }}>
          <div className="card-body">
            <h2 className="h5 fw-semibold mb-3">Sign In</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="signinRole">Role</label>
                <select className="form-select" id="signinRole" required>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="signinEmail">Email</label>
                <input className="form-control" type="email" id="signinEmail" placeholder="you@example.com" required />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="signinPassword">Password</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type={showPassword ? "text" : "password"}
                    id="signinPassword"
                    placeholder="Your password"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="rememberMe" />
                <label className="form-check-label" htmlFor="rememberMe">
                  Remember me for 30 days
                </label>
              </div>

              <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {message && (
              <div className={`alert alert-${message.type === "error" ? "danger" : message.type} mt-3`} role="alert">
                {message.text}
              </div>
            )}

            <p className="text-secondary text-center mt-3 mb-0">
              New here? <Link to="/signup">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

