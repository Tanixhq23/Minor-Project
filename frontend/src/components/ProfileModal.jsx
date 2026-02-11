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

  const isPatient = role === "patient";
  const isDoctor = role === "doctor";

  const title = useMemo(() => (isDoctor ? "Doctor Profile" : "Patient Profile"), [isDoctor]);

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
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-head">
          <h2 className="card-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close profile">
            x
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading profile...</p>
        ) : (
          <form className="form" onSubmit={handleSubmit}>
            <label className="label" htmlFor="profileName">Full Name</label>
            <input
              className="input"
              id="profileName"
              value={form.name}
              onChange={(e) => onFieldChange("name", e.target.value)}
              required
            />

            <label className="label" htmlFor="profileEmail">Email</label>
            <input
              className="input"
              type="email"
              id="profileEmail"
              value={form.email}
              onChange={(e) => onFieldChange("email", e.target.value)}
              required
            />

            {isPatient && (
              <>
                <label className="label" htmlFor="profilePhone">Phone</label>
                <input
                  className="input"
                  id="profilePhone"
                  value={form.phone}
                  onChange={(e) => onFieldChange("phone", e.target.value)}
                  placeholder="+1 555 123 4567"
                />
              </>
            )}

            {isDoctor && (
              <>
                <label className="label" htmlFor="profileSpecialization">Specialization</label>
                <input
                  className="input"
                  id="profileSpecialization"
                  value={form.specialization}
                  onChange={(e) => onFieldChange("specialization", e.target.value)}
                  placeholder="Cardiology"
                  required
                />
              </>
            )}

            <div className="divider" />
            <p className="muted">Change password (optional)</p>

            <label className="label" htmlFor="profileCurrentPassword">Current Password</label>
            <input
              className="input"
              type="password"
              id="profileCurrentPassword"
              value={form.currentPassword}
              onChange={(e) => onFieldChange("currentPassword", e.target.value)}
            />

            <label className="label" htmlFor="profileNewPassword">New Password</label>
            <input
              className="input"
              type="password"
              id="profileNewPassword"
              value={form.newPassword}
              onChange={(e) => onFieldChange("newPassword", e.target.value)}
            />

            <label className="label" htmlFor="profileConfirmPassword">Confirm New Password</label>
            <input
              className="input"
              type="password"
              id="profileConfirmPassword"
              value={form.confirmNewPassword}
              onChange={(e) => onFieldChange("confirmNewPassword", e.target.value)}
            />

            {message && <div className={`message ${message.type}`}>{message.text}</div>}

            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
