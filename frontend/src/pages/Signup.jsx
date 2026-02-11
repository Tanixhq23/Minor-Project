import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getSession } from "../lib/api.js";
import NavArrow from "../components/NavArrow.jsx";

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

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
    <div className="page">
      <header className="header">
        <div className="header-left">
          <NavArrow />
          <h1 className="header-title">Health-Lock</h1>
        </div>
      </header>

      <div className="container">
        <h1 className="page-title center">Create Account</h1>
        <p className="hero-sub center">Set up your secure access in less than a minute.</p>

        <div className="card auth-card">
          <h2 className="card-title auth-mini-title">Sign Up</h2>
          <form className="form" onSubmit={handleSubmit}>
            <label className="label" htmlFor="signupRole">Role</label>
            <select className="select" id="signupRole" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>

            <label className="label" htmlFor="signupName">Full Name</label>
            <input className="input" type="text" id="signupName" placeholder="Jane Doe" required />

            <label className="label" htmlFor="signupEmail">Email</label>
            <input className="input" type="email" id="signupEmail" placeholder="jane.doe@example.com" required />

            <label className="label" htmlFor="signupPassword">Password</label>
            <input className="input" type="password" id="signupPassword" placeholder="Create a password" required />

            {role === "patient" ? (
              <div>
                <label className="label" htmlFor="signupPhone">Phone (optional)</label>
                <input className="input" type="text" id="signupPhone" placeholder="+1 555 123 4567" />
              </div>
            ) : (
              <div>
                <label className="label" htmlFor="signupSpecialization">Specialization</label>
                <input className="input" type="text" id="signupSpecialization" placeholder="Cardiology" />
              </div>
            )}

            <button className="btn" type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
          </form>
          {message && <div className={`message ${message.type}`}>{message.text}</div>}
          <p className="muted center">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
