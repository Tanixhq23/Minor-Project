import Patient from "../models/patient.model.js";
import Record from "../models/record.model.js";

export const getPatientById = async (patientId) => {
  if (!patientId) throw new Error("Patient id is required");
  return await Patient.findById(patientId);
};

export const saveRecord = async ({ patient, medicalData }) => {
  if (!patient || !patient._id) throw new Error("Patient is required");
  const record = await Record.create({ patient: patient._id, medicalData });
  return record;
};

export const getRecordsByPatientId = async (patientId) => {
  if (!patientId) throw new Error("Patient id is required");
  return await Record.find({ patient: patientId })
    .select("medicalData.fileName medicalData.fileType status createdAt updatedAt accessUrl")
    .sort({ createdAt: -1 });
};

export const getRecordByIdForPatient = async (recordId, patientId) => {
  if (!recordId || !patientId) throw new Error("Record id and patient id are required");
  return await Record.findOne({ _id: recordId, patient: patientId });
};

export const deleteRecordByIdForPatient = async (recordId, patientId) => {
  if (!recordId || !patientId) throw new Error("Record id and patient id are required");
  return await Record.findOneAndDelete({ _id: recordId, patient: patientId });
};

export const updatePatientHealthProfile = async (patientId, metrics, reportName = "") => {
  if (!patientId) throw new Error("Patient id is required");
  const patient = await Patient.findById(patientId);
  if (!patient) return null;

  patient.healthProfile = {
    ...(patient.healthProfile?.toObject ? patient.healthProfile.toObject() : patient.healthProfile || {}),
    ...metrics,
    lastAnalyzedAt: new Date(),
    lastReportName: String(reportName || "").trim() || undefined,
  };
  await patient.save();
  return patient;
};
