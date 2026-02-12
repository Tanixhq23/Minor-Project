import AppError from "./AppError.js";

const decodePdfStringToken = (token) => {
  const source = token.slice(1, -1);
  let out = "";
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }

    const next = source[i + 1];
    if (!next) break;

    if (/[0-7]/.test(next)) {
      const octal = source.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)?.[0] || "";
      if (octal) {
        out += String.fromCharCode(parseInt(octal, 8));
        i += octal.length;
        continue;
      }
    }

    if (next === "n") out += "\n";
    else if (next === "r") out += "\r";
    else if (next === "t") out += "\t";
    else if (next === "b") out += "\b";
    else if (next === "f") out += "\f";
    else out += next;
    i += 1;
  }
  return out;
};

const extractPdfText = (pdfDataUrl) => {
  const base64 = String(pdfDataUrl || "").split(",")[1] || "";
  const buffer = Buffer.from(base64, "base64");
  const raw = buffer.toString("latin1");

  const tokens = raw.match(/\((?:\\.|[^\\)])*\)/g) || [];
  const decoded = tokens
    .map(decodePdfStringToken)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return { raw, decoded };
};

const detectReportTypes = (text) => {
  const source = String(text || "").toLowerCase();
  const types = [];

  if (/(cbc|complete blood count|hemoglobin|rbc|wbc|platelet)/i.test(source)) {
    types.push("Complete Blood Count (CBC)");
  }
  if (/(lipid|cholesterol|hdl|ldl|triglyceride)/i.test(source)) {
    types.push("Lipid Profile");
  }
  if (/(glucose|hba1c|diabetes|fbs|rbs)/i.test(source)) {
    types.push("Diabetes Panel");
  }
  if (/(blood pressure|heart rate|pulse|vital|bmi)/i.test(source)) {
    types.push("Vitals Summary");
  }
  if (/(liver|alt|ast|bilirubin|alkaline phosphatase)/i.test(source)) {
    types.push("Liver Function Test");
  }
  if (/(creatinine|urea|egfr|kidney|renal)/i.test(source)) {
    types.push("Kidney Function Test");
  }

  return types.length > 0 ? types : ["General Medical Report"];
};

const parseMetric = (text, regex) => {
  const match = text.match(regex);
  if (!match?.[1]) return undefined;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return undefined;
  return value;
};

export const analyzeHealthReportPdf = (pdfDataUrl) => {
  const { raw, decoded } = extractPdfText(pdfDataUrl);
  const printableRaw = raw.replace(/[^\x20-\x7E]+/g, " ").replace(/\s+/g, " ").trim();
  const extractedText = decoded.length >= 20 ? decoded : printableRaw;

  if (!extractedText || extractedText.length < 20) {
    throw new AppError(
      400,
      "Could not extract readable text from this PDF. Please upload a text-based PDF report.",
      "TEXT_EXTRACTION_FAILED"
    );
  }

  const corpus = extractedText.toLowerCase();

  const metrics = {
    hemoglobin: parseMetric(corpus, /(?:hemoglobin|haemoglobin|hb)\s*[:\-]?\s*(\d{1,2}(?:\.\d+)?)/i),
    glucose: parseMetric(corpus, /(?:glucose|sugar|fbs|rbs)\s*[:\-]?\s*(\d{2,3}(?:\.\d+)?)/i),
    cholesterol: parseMetric(corpus, /(?:cholesterol|total cholesterol)\s*[:\-]?\s*(\d{2,3}(?:\.\d+)?)/i),
    bmi: parseMetric(corpus, /(?:bmi|body mass index)\s*[:\-]?\s*(\d{1,2}(?:\.\d+)?)/i),
    heartRate: parseMetric(corpus, /(?:heart rate|pulse)\s*[:\-]?\s*(\d{2,3})(?:\s*bpm)?/i),
  };

  const bpMatch = corpus.match(/(?:blood pressure|bp)\s*[:\-]?\s*(\d{2,3})\s*\/\s*(\d{2,3})/i);
  if (bpMatch?.[1] && bpMatch?.[2]) {
    metrics.bloodPressureSystolic = Number(bpMatch[1]);
    metrics.bloodPressureDiastolic = Number(bpMatch[2]);
  }

  const metricCount = Object.values(metrics).filter((value) => value !== undefined).length;

  const findings = [];
  if (metrics.glucose !== undefined && metrics.glucose > 126) {
    findings.push("Glucose appears elevated (>126).");
  }
  if (metrics.cholesterol !== undefined && metrics.cholesterol > 200) {
    findings.push("Cholesterol appears elevated (>200).");
  }
  if (metrics.bmi !== undefined && metrics.bmi > 25) {
    findings.push("BMI appears above normal range (>25).");
  }
  if (
    metrics.bloodPressureSystolic !== undefined &&
    metrics.bloodPressureDiastolic !== undefined &&
    (metrics.bloodPressureSystolic > 130 || metrics.bloodPressureDiastolic > 80)
  ) {
    findings.push("Blood pressure appears elevated (>130/80).");
  }

  const cleanedMetrics = Object.fromEntries(
    Object.entries(metrics).filter(([, value]) => value !== undefined)
  );

  if (metricCount === 0) {
    findings.push("Text extracted, but no known numeric health metrics were detected.");
  }

  return {
    extractedText,
    reportTypes: detectReportTypes(extractedText),
    metrics: cleanedMetrics,
    findings,
  };
};
