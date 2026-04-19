const patientService = require("../services/patientService");
const Document = require("../models/Document");
const sendResponse = require("../utils/apiResponse");
const AppError = require("../utils/AppError");
const { streamLocalFile } = require("../utils/localFileStream");

async function streamDocument(req, res) {
  const { documentId } = req.params;
  const doc = await Document.findOne({ _id: documentId, patientId: req.user.id });

  if (!doc) {
    throw new AppError("Document not found", 404);
  }

  await streamLocalFile(doc.storagePath, doc.mimeType, res);
}

async function uploadDocument(req, res) {
  const data = await patientService.uploadDocument(req.user.id, req.file);
  return sendResponse(res, { statusCode: 201, message: "Document uploaded successfully", data });
}

async function listDocuments(req, res) {
  const documents = await patientService.listDocuments(req.user.id);
  return sendResponse(res, { message: "Documents fetched successfully", data: { documents } });
}

async function createQrAccess(req, res) {
  const data = await patientService.createQrAccess(req.user.id, req.body.documentId);
  return sendResponse(res, { message: "QR access created successfully", data });
}

async function createOtpAccess(req, res) {
  const data = await patientService.createOtpAccess(req.user.id);
  return sendResponse(res, { message: "OTP access created successfully", data });
}

async function listActiveAccess(req, res) {
  const access = await patientService.listActiveAccess(req.user.id);
  return sendResponse(res, { message: "Active access fetched successfully", data: { access } });
}

async function revokeAccess(req, res) {
  const data = await patientService.revokeAccess(req.user.id, req.params.consentId);
  return sendResponse(res, { message: "Access revoked successfully", data });
}

async function deleteDocument(req, res) {
  const data = await patientService.deleteDocument(req.user.id, req.params.documentId);
  return sendResponse(res, { message: "Document deleted successfully", data });
}

async function getLogs(req, res) {
  const { limit } = req.query;
  const data = await patientService.listLogs(req.user.id, limit);
  return sendResponse(res, { message: "Access logs fetched successfully", data: { logs: data } });
}

async function getDownloadRequests(req, res) {
  const data = await patientService.getDownloadRequests(req.user.id);
  return sendResponse(res, { message: "Download requests fetched successfully", data: { requests: data } });
}

async function respondToRequest(req, res) {
  const { requestId } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'
  const data = await patientService.respondToRequest(req.user.id, requestId, status);
  return sendResponse(res, { message: `Request ${status}`, data });
}

module.exports = {
  uploadDocument,
  listDocuments,
  createQrAccess,
  createOtpAccess,
  listActiveAccess,
  revokeAccess,
  deleteDocument,
  getLogs,
  getDownloadRequests,
  respondToRequest,
  streamDocument,
};
