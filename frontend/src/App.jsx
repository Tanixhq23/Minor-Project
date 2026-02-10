import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import Signin from "./pages/Signin.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import DoctorScanner from "./pages/DoctorScanner.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/patient" element={<PatientDashboard />} />
      <Route path="/doctor" element={<DoctorScanner />} />
    </Routes>
  );
}
