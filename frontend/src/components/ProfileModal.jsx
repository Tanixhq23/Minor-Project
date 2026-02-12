import React, { useEffect, useMemo, useState } from "react";
import { getProfile, updateProfile } from "../lib/api.js";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  specialization: "",
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

export default function ProfileModal({ open, role, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isPatient = role === "patient";
  const isDoctor = role === "doctor";

  const title = useMemo(() => (isDoctor ? "Doctor Profile" : "Patient Profile"), [isDoctor]);
  const alertVariant = useMemo(() => {
    if (!message?.type) return "info";
    if (message.type === "error") return "danger";
    if (message.type === "success") return "success";
    return "info";
  }, [message]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setMessage(null);
    getProfile()
      .then((profile) => {
        setForm({
          ...emptyForm,
          name: profile?.name || "",
          email: profile?.email || "",
          phone: profile?.phone || "",
          specialization: profile?.specialization || "",
        });
      })
      .catch((err) => {
        setMessage({ type: "error", text: err.message || "Failed to load profile." });
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const onFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!form.name.trim() || !form.email.trim()) {
      setMessage({ type: "error", text: "Name and email are required." });
      return;
    }

    if (form.newPassword || form.currentPassword || form.confirmNewPassword) {
      if (!form.currentPassword) {
        setMessage({ type: "error", text: "Enter current password to set a new password." });
        return;
      }
      if (form.newPassword.length < 8) {
        setMessage({ type: "error", text: "New password must be at least 8 characters." });
        return;
      }
      if (form.newPassword !== form.confirmNewPassword) {
        setMessage({ type: "error", text: "New password and confirm password do not match." });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        ...(isPatient ? { phone: form.phone } : {}),
        ...(isDoctor ? { specialization: form.specialization } : {}),
      };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      const updated = await updateProfile(payload);
      setForm((prev) => ({
        ...prev,
        name: updated?.name || prev.name,
        email: updated?.email || prev.email,
        phone: updated?.phone || "",
        specialization: updated?.specialization || "",
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      }));
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" onClick={onClose}>
        <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close profile" />
            </div>
            <div className="modal-body">
              {loading ? (
                <p className="text-secondary mb-0">Loading profile...</p>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="profileName">Full Name</label>
                    <input
                      className="form-control"
                      id="profileName"
                      value={form.name}
                      onChange={(e) => onFieldChange("name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="profileEmail">Email</label>
                    <input
                      className="form-control"
                      type="email"
                      id="profileEmail"
                      value={form.email}
                      onChange={(e) => onFieldChange("email", e.target.value)}
                      required
                    />
                  </div>

                  {isPatient && (
                    <div className="mb-3">
                      <label className="form-label" htmlFor="profilePhone">Phone</label>
                      <input
                        className="form-control"
                        id="profilePhone"
                        value={form.phone}
                        onChange={(e) => onFieldChange("phone", e.target.value)}
                        placeholder="+1 555 123 4567"
                      />
                    </div>
                  )}

                  {isDoctor && (
                    <div className="mb-3">
                      <label className="form-label" htmlFor="profileSpecialization">Specialization</label>
                      <input
                        className="form-control"
                        id="profileSpecialization"
                        value={form.specialization}
                        onChange={(e) => onFieldChange("specialization", e.target.value)}
                        placeholder="Cardiology"
                        required
                      />
                    </div>
                  )}

                  <hr className="my-3" />
                  <p className="text-secondary">Change password (optional)</p>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="profileCurrentPassword">Current Password</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        type={showCurrentPassword ? "text" : "password"}
                        id="profileCurrentPassword"
                        value={form.currentPassword}
                        onChange={(e) => onFieldChange("currentPassword", e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                        aria-pressed={showCurrentPassword}
                      >
                        {showCurrentPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="profileNewPassword">New Password</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        type={showNewPassword ? "text" : "password"}
                        id="profileNewPassword"
                        value={form.newPassword}
                        onChange={(e) => onFieldChange("newPassword", e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                        aria-pressed={showNewPassword}
                      >
                        {showNewPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="profileConfirmPassword">Confirm New Password</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        type={showConfirmPassword ? "text" : "password"}
                        id="profileConfirmPassword"
                        value={form.confirmNewPassword}
                        onChange={(e) => onFieldChange("confirmNewPassword", e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        aria-pressed={showConfirmPassword}
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {message && (
                    <div className={`alert alert-${alertVariant}`} role="alert">
                      {message.text}
                    </div>
                  )}

                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

