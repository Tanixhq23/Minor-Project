import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getSession } from "../lib/api.js";

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
        input[type="text"],
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
      `}</style>

      <header>
        <h1>Health-Lock</h1>
      </header>

      <h1>Create Account</h1>

      <main>
        <div className="container">
          <div className="card">
            <h2>Sign Up</h2>
            <form id="signup-form" onSubmit={handleSubmit}>
              <label htmlFor="signupRole">Role</label>
              <select id="signupRole" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>

              <label htmlFor="signupName">Full Name</label>
              <input type="text" id="signupName" placeholder="Jane Doe" required />

              <label htmlFor="signupEmail">Email</label>
              <input type="email" id="signupEmail" placeholder="jane.doe@example.com" required />

              <label htmlFor="signupPassword">Password</label>
              <input type="password" id="signupPassword" placeholder="Create a password" required />

              {role === "patient" ? (
                <div id="signupPatientFields">
                  <label htmlFor="signupPhone">Phone (optional)</label>
                  <input type="text" id="signupPhone" placeholder="+1 555 123 4567" />
                </div>
              ) : (
                <div id="signupDoctorFields">
                  <label htmlFor="signupSpecialization">Specialization</label>
                  <input type="text" id="signupSpecialization" placeholder="Cardiology" />
                </div>
              )}

              <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
            </form>
            {message && <div className={`message ${message.type}`}>{message.text}</div>}
            <p className="helper-text">
              Already have an account? <Link className="link" to="/signin">Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
