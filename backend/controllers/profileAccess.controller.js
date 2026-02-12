import Doctor from "../models/doctor.model.js";
import Record from "../models/record.model.js";
import AppError from "../utils/AppError.js";
import * as profileAccessService from "../services/profileAccess.service.js";
import { sendProfileAccessRequestEmail } from "../services/notification.js";

export const createProfileAccessRequest = async (req, res) => {
  const doctorId = req.user.id;
  const { patientId, recordId } = req.body || {};
  if (!patientId || !recordId) {
    throw new AppError(400, "patientId and recordId are required", "INVALID_REQUEST_PAYLOAD");
  }

  const [doctor, patient, record] = await Promise.all([
    Doctor.findById(doctorId),
    profileAccessService.getPatientById(patientId),
    Record.findById(recordId),
  ]);

  if (!doctor) throw new AppError(404, "Doctor not found", "DOCTOR_NOT_FOUND");
  if (!patient) throw new AppError(404, "Patient not found", "PATIENT_NOT_FOUND");
  if (!record || String(record.patient) !== String(patientId)) {
    throw new AppError(404, "Record not found for patient", "RECORD_NOT_FOUND");
  }

  const request = await profileAccessService.createProfileAccessRequest({
    doctorId,
    patientId,
    recordId,
  });

  const baseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
  const approvalUrl = `${baseUrl}/patient?tab=requests&requestId=${request._id}`;

  sendProfileAccessRequestEmail({
    email: patient.email,
    patientName: patient.name,
    doctorName: doctor.name,
    requestId: request._id,
    approvalUrl,
    expiresAt: request.expiresAt,
  }).catch(() => {});

  return res.status(201).json({
    success: true,
    data: {
      requestId: request._id,
      status: request.status,
      expiresAt: request.expiresAt,
      approvalUrl,
    },
  });
};

export const listMyProfileAccessRequests = async (req, res) => {
  const requests = await profileAccessService.getPatientPendingProfileRequests(req.user.id);
  return res.json({
    success: true,
    data: requests.map((request) => ({
      requestId: request._id,
      status: request.status,
      createdAt: request.createdAt,
      expiresAt: request.expiresAt,
      doctor: request.doctor
        ? {
            id: request.doctor._id,
            name: request.doctor.name,
            email: request.doctor.email,
            specialization: request.doctor.specialization,
          }
        : null,
      recordId: request.record,
    })),
  });
};

export const approveMyProfileAccessRequest = async (req, res) => {
  const { id } = req.params;
  const request = await profileAccessService.approveProfileAccessRequest({
    requestId: id,
    patientId: req.user.id,
  });
  if (!request) {
    throw new AppError(404, "Request not found", "REQUEST_NOT_FOUND");
  }
  if (request.status === "expired") {
    throw new AppError(400, "Request expired", "REQUEST_EXPIRED");
  }
  if (request.status !== "approved") {
    throw new AppError(400, "Request cannot be approved", "REQUEST_NOT_APPROVABLE");
  }

  return res.json({
    success: true,
    data: {
      requestId: request._id,
      status: request.status,
      approvedAt: request.approvedAt,
      expiresAt: request.expiresAt,
    },
  });
};

export const getDoctorProfileAccessRequest = async (req, res) => {
  const { id } = req.params;
  const result = await profileAccessService.getDoctorRequestStatus({
    requestId: id,
    doctorId: req.user.id,
  });
  if (!result?.request) {
    throw new AppError(404, "Request not found", "REQUEST_NOT_FOUND");
  }

  return res.json({
    success: true,
    data: {
      requestId: result.request._id,
      status: result.request.status,
      createdAt: result.request.createdAt,
      expiresAt: result.request.expiresAt,
      approvedAt: result.request.approvedAt || null,
      profile: result.profile,
    },
  });
};
