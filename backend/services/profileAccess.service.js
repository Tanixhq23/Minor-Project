import ProfileAccessRequest from "../models/profileAccessRequest.model.js";
import Patient from "../models/patient.model.js";

const TEN_MIN_MS = 10 * 60 * 1000;

const toDoctorProfileView = (patient) => ({
  id: patient._id,
  name: patient.name || "",
  email: patient.email || "",
  phone: patient.phone || "",
  healthProfile: {
    hemoglobin: patient.healthProfile?.hemoglobin ?? null,
    glucose: patient.healthProfile?.glucose ?? null,
    cholesterol: patient.healthProfile?.cholesterol ?? null,
    bmi: patient.healthProfile?.bmi ?? null,
    heartRate: patient.healthProfile?.heartRate ?? null,
    bloodPressureSystolic: patient.healthProfile?.bloodPressureSystolic ?? null,
    bloodPressureDiastolic: patient.healthProfile?.bloodPressureDiastolic ?? null,
    lastAnalyzedAt: patient.healthProfile?.lastAnalyzedAt ?? null,
    lastReportName: patient.healthProfile?.lastReportName ?? "",
  },
});

const markExpiredIfNeeded = async (request) => {
  if (!request) return null;
  if (request.status === "pending" && new Date(request.expiresAt).getTime() <= Date.now()) {
    request.status = "expired";
    await request.save();
  }
  return request;
};

export const createProfileAccessRequest = async ({ doctorId, patientId, recordId }) => {
  const existing = await ProfileAccessRequest.findOne({
    doctor: doctorId,
    patient: patientId,
    record: recordId,
    status: "pending",
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (existing) return existing;

  return await ProfileAccessRequest.create({
    doctor: doctorId,
    patient: patientId,
    record: recordId,
    status: "pending",
    expiresAt: new Date(Date.now() + TEN_MIN_MS),
  });
};

export const getPatientPendingProfileRequests = async (patientId) => {
  const requests = await ProfileAccessRequest.find({
    patient: patientId,
    status: "pending",
  })
    .populate("doctor", "name email specialization")
    .sort({ createdAt: -1 });

  for (const request of requests) {
    // eslint-disable-next-line no-await-in-loop
    await markExpiredIfNeeded(request);
  }

  return requests.filter((request) => request.status === "pending");
};

export const approveProfileAccessRequest = async ({ requestId, patientId }) => {
  const request = await ProfileAccessRequest.findOne({ _id: requestId, patient: patientId });
  if (!request) return null;
  await markExpiredIfNeeded(request);
  if (request.status !== "pending") return request;

  request.status = "approved";
  request.approvedAt = new Date();
  await request.save();
  return request;
};

export const getDoctorRequestStatus = async ({ requestId, doctorId }) => {
  const request = await ProfileAccessRequest.findOne({ _id: requestId, doctor: doctorId }).populate(
    "patient",
    "name email phone healthProfile"
  );
  if (!request) return null;
  await markExpiredIfNeeded(request);

  return {
    request,
    profile: request.status === "approved" && request.patient ? toDoctorProfileView(request.patient) : null,
  };
};

export const getPatientById = async (patientId) => {
  return await Patient.findById(patientId);
};
