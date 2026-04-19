import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(email, password);
      // Determine where to redirect based on role
      const user = data.data.user;
      if (user.role === "doctor") {
        navigate("/doctor/access");
      } else {
        navigate("/patient/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check credentials.");
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-4">
        <h2 className="fw-bold h3">Welcome Back</h2>
        <p className="text-muted small">Log in to manage your health vault</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger py-2 small text-center mb-3">{error}</div>}
        
        <div className="mb-3">
          <label className="form-label small fw-bold">Email Address</label>
          <input 
            type="email" 
            className="form-control"
            placeholder="name@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm">
          Log In
        </button>
      </form>

      <div className="mt-4 pt-2 text-center border-top">
        <p className="small text-muted">
          Don't have an account? <Link to="/register" className="text-primary fw-bold text-decoration-none">Create Account</Link>
        </p>
      </div>
    </AuthLayout>
  );
}