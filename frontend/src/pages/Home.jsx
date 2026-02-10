import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
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
          justify-content: center;
          align-items: center;
          padding: 18px 30px;
        }
        header h1 {
          margin: 0;
          font-size: 1.6rem;
        }
        .hero {
          text-align: center;
          margin-top: 40px;
        }
        .hero h2 {
          margin: 0 0 12px;
          font-size: 2rem;
          color: #222;
        }
        .hero p {
          color: #555;
          margin: 0;
        }
        .actions {
          max-width: 720px;
          margin: 40px auto;
          padding: 0 15px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }
        .card {
          background: white;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
          text-align: center;
        }
        .card h3 {
          margin: 0 0 10px;
          font-size: 1.3rem;
          color: #1976d2;
        }
        .card p {
          color: #666;
          margin-bottom: 20px;
        }
        .btn {
          display: inline-block;
          background: #1976d2;
          color: white;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 600;
          transition: 0.3s;
        }
        .btn:hover {
          background: #135ca0;
        }
        .muted {
          text-align: center;
          color: #777;
          font-size: 0.9rem;
          margin-bottom: 30px;
        }
      `}</style>

      <header>
        <h1>Health-Lock</h1>
      </header>

      <section className="hero">
        <h2>Welcome</h2>
        <p>Choose an option to continue.</p>
      </section>

      <section className="actions">
        <div className="card">
          <h3>Create Account</h3>
          <p>New here? Sign up as a patient or doctor.</p>
          <Link className="btn" to="/signup">Sign Up</Link>
        </div>

        <div className="card">
          <h3>Sign In</h3>
          <p>Already have an account? Sign in to continue.</p>
          <Link className="btn" to="/signin">Sign In</Link>
        </div>
      </section>

      <p className="muted">
        Patients go to the Patient Dashboard. Doctors go to the Doctor Scanner.
      </p>
    </div>
  );
}
