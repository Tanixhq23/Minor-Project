import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const [role, setRole] = useState("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const data = await register(name, email, password, role);
      const user = data.data.user;
      if (user.role === "doctor") {
        navigate("/doctor/access");
      } else {
        navigate("/patient/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-4">
        <h2 className="fw-bold h3">Create Account</h2>
        <p className="text-muted small">Choose your role to get started</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger py-2 small text-center mb-3">{error}</div>}

        <div className="btn-group w-100 mb-4 shadow-sm" role="group">
          <button 
            type="button" 
            className={`btn py-2 fw-bold ${role === 'patient' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setRole("patient")}
            disabled={isLoading}
          >
            Patient
          </button>
          <button 
            type="button" 
            className={`btn py-2 fw-bold ${role === 'doctor' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setRole("doctor")}
            disabled={isLoading}
          >
            Doctor
          </button>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-bold">Full Name</label>
          <input 
            type="text" 
            className="form-control"
            placeholder="John Doe" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-bold">Email Address</label>
          <input 
            type="email" 
            className="form-control"
            placeholder="john@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="mb-4">
          <label className="form-label small fw-bold">Password</label>
          <input 
            type="password" 
            className="form-control"
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <button type="submit" className={`btn w-100 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center ${role === 'patient' ? 'btn-primary' : 'btn-success'}`} disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating Account...
            </>
          ) : (
            `Register as ${role === 'patient' ? 'Patient' : 'Doctor'}`
          )}
        </button>
      </form>

      <div className="mt-4 pt-2 text-center border-top">
        <p className="small text-muted">
          Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none">Log in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}