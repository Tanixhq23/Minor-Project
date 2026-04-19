import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axiosClient";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    gender: "",
    dob: "",
    role: "",
    doctorProfile: {
      specialty: "",
      licenseId: "",
    },
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        const userData = res.data.data.user;
        setProfile({
          ...userData,
          dob: userData.dob ? new Date(userData.dob).toISOString().split("T")[0] : "",
          doctorProfile: userData.doctorProfile || { specialty: "", licenseId: "" },
        });
      } catch (err) {
        console.error("Failed to fetch profile", err);
        setMessage({ type: "danger", text: "Failed to load profile data." });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setProfile((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        name: profile.name,
        gender: profile.gender,
        dob: profile.dob,
        doctorProfile: profile.role === "doctor" ? profile.doctorProfile : undefined,
      };

      await api.patch("/auth/profile", payload);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      console.error("Update failed", err);
      setMessage({ type: "danger", text: err.response?.data?.message || "Failed to update profile." });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading Profile...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h2 className="fw-bold">My Profile</h2>
        <p className="text-muted small">Manage your personal information and account settings.</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
            {message.text && (
              <div className={`alert alert-${message.type} d-flex align-items-center mb-4 px-3 py-2 small`}>
                <i className={`bi bi-${message.type === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill me-2`}></i>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={profile.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Email Address</label>
                  <input
                    type="email"
                    className="form-control bg-light opacity-75"
                    value={profile.email}
                    disabled
                  />
                  <div className="form-text small" style={{ fontSize: '0.7rem' }}>Email cannot be changed contact support</div>
                </div>

                {profile.role === "patient" && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Gender</label>
                      <select
                        name="gender"
                        className="form-select"
                        value={profile.gender}
                        onChange={handleChange}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        className="form-control"
                        value={profile.dob}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}

                {profile.role === "doctor" && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Medical Specialty</label>
                      <input
                        type="text"
                        name="doctorProfile.specialty"
                        className="form-control"
                        placeholder="e.g. Cardiology"
                        value={profile.doctorProfile.specialty}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">License ID</label>
                      <input
                        type="text"
                        name="doctorProfile.licenseId"
                        className="form-control"
                        placeholder="e.g. MED-123456"
                        value={profile.doctorProfile.licenseId}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}

                <div className="col-12 mt-5">
                   <button 
                    type="submit" 
                    className="btn btn-primary px-5 py-3 fw-bold shadow-sm d-flex align-items-center"
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-check me-2"></i>
                        Update Profile
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-4 mt-4 bg-light border-dashed border-2 opacity-75">
             <div className="d-flex align-items-center gap-3">
                <div className="bg-white p-2 rounded-circle shadow-sm">
                   <i className="bi bi-info-circle text-primary fs-4"></i>
                </div>
                <div>
                   <h6 className="fw-bold mb-1">Account Security</h6>
                   <p className="small text-muted mb-0">Your data is stored in a HIPAA-compliant encrypted vault. Personal details are only visible to you and verified healthcare providers during active sessions.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
