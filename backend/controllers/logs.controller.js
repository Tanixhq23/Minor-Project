import * as logService from "../services/log.service.js";

export const getMyPatientLogs = async (req, res) => {
  const logs = await logService.getLogsForPatient(req.user.id);
  return res.json({ success: true, data: logs });
};
