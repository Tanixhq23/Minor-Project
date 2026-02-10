import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getSession } from "../lib/api.js";

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
    <div>
      <style>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
          background: #f4f6f9;
          color: #333;
        }
        header {
          background: #1976d2;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 30px;
        }
        header h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        h1 {
          text-align: center;
          margin-top: 20px;
          font-size: 1.8rem;
          color: #222;
        }
        .container {
          max-width: 520px;
          margin: 20px auto 40px;
          padding: 0 15px;
        }
        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        .card h2 {
          margin-top: 0;
          font-size: 1.3rem;
          color: #1976d2;
        }
        label {
          display: block;
          margin: 12px 0 6px;
          font-weight: 600;
        }
        input[type="email"],
        input[type="password"],
        select {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 0.95rem;
        }
        button {
          background: #1976d2;
          color: white;
          border: none;
          padding: 10px 18px;
          margin-top: 15px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          transition: 0.3s;
          width: 100%;
        }
        button:hover {
          background: #135ca0;
        }
        .message { padding: 10px; border-radius: 6px; margin-top: 12px; }
        .message.info { background: #e8f0ff; color: #0b4ea2; font-weight: 600; }
        .message.success { background: #e6f4ea; color: #19692e; font-weight: 600; }
        .message.error { background: #fdecea; color: #b71c1c; font-weight: 600; }
        .helper-text {
          font-size: 0.9rem;
          color: #666;
          margin-top: 8px;
          text-align: center;
        }
        .link {
          color: #1976d2;
          text-decoration: none;
          font-weight: 600;
        }
        .remember {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }
      `}</style>

      <header>
        <h1>Health-Lock</h1>
      </header>

      <h1>Sign In</h1>

      <main>
        <div className="container">
          <div className="card">
            <h2>Sign In</h2>
            <form id="signin-form" onSubmit={handleSubmit}>
              <label htmlFor="signinRole">Role</label>
              <select id="signinRole" required>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>

              <label htmlFor="signinEmail">Email</label>
              <input type="email" id="signinEmail" placeholder="you@example.com" required />

              <label htmlFor="signinPassword">Password</label>
              <input type="password" id="signinPassword" placeholder="Your password" required />

              <label className="remember" htmlFor="rememberMe">
                <input type="checkbox" id="rememberMe" />
                Remember me for 30 days
              </label>

              <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
            </form>
            {message && <div className={`message ${message.type}`}>{message.text}</div>}
            <p className="helper-text">
              New here? <Link className="link" to="/signup">Create an account</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
