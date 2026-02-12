import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getSession } from "../lib/api.js";
import NavArrow from "../components/NavArrow.jsx";

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
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
      role,
      name: event.target.signupName.value,
      email: event.target.signupEmail.value,
      password: event.target.signupPassword.value,
      phone: event.target.signupPhone?.value,
      specialization: event.target.signupSpecialization?.value
    };

    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Account created! Redirecting..." });
        setTimeout(() => {
          navigate(data?.data?.role === "doctor" ? "/doctor" : "/patient");
        }, 1200);
      } else {
        setMessage({ type: "error", text: data?.error?.message || "Signup failed." });
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
          <h1 className="h3 fw-semibold mb-2">Create Account</h1>
          <p className="text-secondary mb-0">Set up your secure access in less than a minute.</p>
        </div>

        <div className="card shadow-sm mx-auto" style={{ maxWidth: 560 }}>
          <div className="card-body">
            <h2 className="h5 fw-semibold mb-3">Sign Up</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="signupRole">Role</label>
                <select
                  className="form-select"
                  id="signupRole"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="signupName">Full Name</label>
                <input className="form-control" type="text" id="signupName" placeholder="Jane Doe" required />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="signupEmail">Email</label>
                <input className="form-control" type="email" id="signupEmail" placeholder="jane.doe@example.com" required />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="signupPassword">Password</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type={showPassword ? "text" : "password"}
                    id="signupPassword"
                    placeholder="Create a password"
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

              {role === "patient" ? (
                <div className="mb-3">
                  <label className="form-label" htmlFor="signupPhone">Phone (optional)</label>
                  <input className="form-control" type="text" id="signupPhone" placeholder="+1 555 123 4567" />
                </div>
              ) : (
                <div className="mb-3">
                  <label className="form-label" htmlFor="signupSpecialization">Specialization</label>
                  <input className="form-control" type="text" id="signupSpecialization" placeholder="Cardiology" />
                </div>
              )}

              <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            {message && (
              <div className={`alert alert-${message.type === "error" ? "danger" : message.type} mt-3`} role="alert">
                {message.text}
              </div>
            )}

            <p className="text-secondary text-center mt-3 mb-0">
              Already have an account? <Link to="/signin">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

