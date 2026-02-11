import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Background from "./components/Background.jsx";
import RouteLoader from "./components/RouteLoader.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));
const Signin = lazy(() => import("./pages/Signin.jsx"));
const PatientDashboard = lazy(() => import("./pages/PatientDashboard.jsx"));
const DoctorScanner = lazy(() => import("./pages/DoctorScanner.jsx"));

export default function App() {
  return (
    <>
      <Background />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/doctor" element={<DoctorScanner />} />
        </Routes>
      </Suspense>
    </>
  );
}
