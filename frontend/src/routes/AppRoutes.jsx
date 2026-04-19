import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

// Lazy-loaded pages
const Landing = lazy(() => import("../pages/Landing"));
const NotFound = lazy(() => import("../pages/NotFound"));

const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/auth/Register"));

const Dashboard = lazy(() => import("../pages/patient/Dashboard"));
const Upload = lazy(() => import("../pages/patient/Upload"));
const Access = lazy(() => import("../pages/patient/Access"));
const Logs = lazy(() => import("../pages/patient/Logs"));

const AccessPatient = lazy(() => import("../pages/doctor/AccessPatient"));
const PatientView = lazy(() => import("../pages/doctor/PatientView"));
const Profile = lazy(() => import("../pages/shared/Profile"));

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'patient' ? '/patient/dashboard' : '/doctor/access'} replace />;
  }
  
  return children;
};

export default function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Shared Protected Routes */}
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />

            {/* Patient Routes */}
            <Route path="/patient/dashboard" element={
              <ProtectedRoute allowedRole="patient"><Dashboard /></ProtectedRoute>
            } />
            <Route path="/patient/upload" element={
              <ProtectedRoute allowedRole="patient"><Upload /></ProtectedRoute>
            } />
            <Route path="/patient/access" element={
              <ProtectedRoute allowedRole="patient"><Access /></ProtectedRoute>
            } />
            <Route path="/patient/logs" element={
              <ProtectedRoute allowedRole="patient"><Logs /></ProtectedRoute>
            } />

            {/* Doctor Routes */}
            <Route path="/doctor/access" element={
              <ProtectedRoute allowedRole="doctor"><AccessPatient /></ProtectedRoute>
            } />
            <Route path="/doctor/view" element={
              <ProtectedRoute allowedRole="doctor"><PatientView /></ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}