import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getSession } from "../lib/api.js";
import NavArrow from "../components/NavArrow.jsx";

export default function Signin() {
  const navigate = useNavigate();
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
    <div className="page">
      <header className="header">
        <div className="header-left">
          <NavArrow />
          <h1 className="header-title">Health-Lock</h1>
        </div>
      </header>

      <div className="container">
        <h1 className="page-title center">Sign In</h1>
        <p className="hero-sub center">Welcome back. Continue with your secure portal.</p>

        <div className="card auth-card">
          <h2 className="card-title auth-mini-title">Sign In</h2>
          <form className="form" onSubmit={handleSubmit}>
            <label className="label" htmlFor="signinRole">Role</label>
            <select className="select" id="signinRole" required>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>

            <label className="label" htmlFor="signinEmail">Email</label>
            <input className="input" type="email" id="signinEmail" placeholder="you@example.com" required />

            <label className="label" htmlFor="signinPassword">Password</label>
            <input className="input" type="password" id="signinPassword" placeholder="Your password" required />

            <label className="label" style={{ display: "flex", alignItems: "center", gap: 8 }} htmlFor="rememberMe">
              <input type="checkbox" id="rememberMe" />
              Remember me for 30 days
            </label>

            <button className="btn" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
          </form>
          {message && <div className={`message ${message.type}`}>{message.text}</div>}
          <p className="muted center">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
