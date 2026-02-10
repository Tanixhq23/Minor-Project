import * as patientService from "../services/patient.service.js";
import { createToken } from "../utils/token.js"; // Correct import
import { generateQRCodeDataUrl } from "../utils/qrcode.js";
import { sendQrGeneratedEmail } from "../services/notification.js";

export const uploadHistory = async (req, res, next) => {
  try {
    const { patient: patientInput, medicalData, doctorEmail } = req.body;
    if (!medicalData || !medicalData.file) {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: "medicalData and its file property are required" },
        });
    }
    const patient = await patientService.ensurePatient(patientInput || {});
    const record = await patientService.saveRecord({ patient, medicalData });
    
    // THIS IS THE CORRECTED LINE
    const token = createToken({ sub: record._id, scope: 'record:read' }, "10m"); 
    
    const baseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:5173";

    const accessUrl = `${baseUrl}/doctor?id=${record._id}&token=${token}`;
    const qrCode = await generateQRCodeDataUrl(accessUrl);
    
    // You should also save the accessUrl to the record in the database for log tracking
    record.accessUrl = accessUrl;
    await record.save();

    sendQrGeneratedEmail({
      email: patient?.email,
      name: patient?.name,
      recordId: record._id,
      accessUrl,
      recipientRole: "patient",
    }).catch(() => {});

    if (doctorEmail) {
      sendQrGeneratedEmail({
        email: doctorEmail,
        name: "Doctor",
        recordId: record._id,
        accessUrl,
        recipientRole: "doctor",
      }).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      data: {
        recordId: record._id,
        accessUrl,
        qrCodeDataUrl: qrCode,
        tokenExpiresIn: "10m",
      },
    });
  } catch (err) {
    next(err);
  }
};
// Add this function to your file
export const getPatientByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: "Email parameter is required" },
      });
    }
    const patient = await patientService.findPatientByEmail(email);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, error: { message: "Patient not found" } });
    }
    return res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
};
