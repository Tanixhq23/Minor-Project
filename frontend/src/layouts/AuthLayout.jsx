import { Link } from "react-router-dom";

export default function AuthLayout({ children }) {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 py-5">
      <div className="w-100" style={{ maxWidth: "450px" }}>
        <div className="text-center mb-5">
          <Link to="/" className="h2 fw-bold text-primary text-decoration-none" style={{ letterSpacing: "-1px" }}>HealthLock</Link>
        </div>
        <div className="card border-0 shadow-lg p-3 p-md-4 rounded-4">
          <div className="card-body">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}