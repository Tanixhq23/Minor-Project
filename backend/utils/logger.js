const fs = require("fs");
const path = require("path");

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), "logs");
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const LEVEL_PRIORITY = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function shouldLog(level) {
  const currentLevel = LEVEL_PRIORITY[LOG_LEVEL] ?? LEVEL_PRIORITY.info;
  const requestedLevel = LEVEL_PRIORITY[level] ?? LEVEL_PRIORITY.info;
  return requestedLevel <= currentLevel;
}

function serializeMeta(meta) {
  if (!meta) return "";
  if (meta instanceof Error) {
    return JSON.stringify({
      name: meta.name,
      message: meta.message,
      stack: meta.stack,
    });
  }
  try {
    return JSON.stringify(meta);
  } catch (error) {
    return JSON.stringify({ message: "Failed to serialize log metadata" });
  }
}

function formatLine(level, message, meta) {
  const timestamp = new Date().toISOString();
  const details = serializeMeta(meta);
  return details
    ? `[${timestamp}] [${level.toUpperCase()}] ${message} ${details}`
    : `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

function writeToFile(filename, line) {
  try {
    ensureLogDirectory();
    fs.appendFileSync(path.join(LOG_DIR, filename), `${line}\n`, "utf8");
  } catch (e) {
    // Fail silent if logs cannot be written
  }
}

function writeLog(level, message, meta) {
  if (!shouldLog(level)) return;

  const line = formatLine(level, message, meta);

  if (level === "error") {
    console.error(line);
    writeToFile("error.log", line);
    writeToFile("combined.log", line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }

  writeToFile("combined.log", line);
}

function logInfo(message, meta) { writeLog("info", message, meta); }
function logWarn(message, meta) { writeLog("warn", message, meta); }
function logError(message, meta) { writeLog("error", message, meta); }
function logHttp(message, meta) { writeLog("http", message, meta); }
function logDebug(message, meta) { writeLog("debug", message, meta); }

const loggerStream = {
  write(message) { logHttp(message.trim()); },
};

module.exports = {
  logInfo, logWarn, logError, logHttp, logDebug, loggerStream,
};
