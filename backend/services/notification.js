// FILE: services/notification.js

import nodemailer from "nodemailer";
import logger from "../config/logger.js";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || "Health-Lock <no-reply@health-lock.local>";

const hasSmtpConfig = Boolean(smtpHost && smtpUser && smtpPass);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })
  : null;

const sendMail = async ({ to, subject, html }) => {
  if (!transporter) {
    logger.warn("Email transporter not configured. Skipping email notification.");
    return;
  }
  if (!to) return;
  try {
    await transporter.sendMail({ from: mailFrom, to, subject, html });
    logger.info(`Email notification sent to ${to} (${subject})`);
  } catch (err) {
    logger.error({ err, to, subject }, "Failed to send email notification.");
  }
};

export const sendSignupEmail = async ({ email, name, role }) => {
  await sendMail({
    to: email,
    subject: "Welcome to Health-Lock",
    html: `
      <p>Hello ${name || "User"},</p>
      <p>Your ${role} account has been created successfully.</p>
      <p>If this wasn't you, please contact support.</p>
    `,
  });
};

export const sendLoginEmail = async ({ email, name, role }) => {
  await sendMail({
    to: email,
    subject: "New Login to Health-Lock",
    html: `
      <p>Hello ${name || "User"},</p>
      <p>We detected a login to your ${role} account.</p>
      <p>If this wasn't you, please reset your password immediately.</p>
    `,
  });
};

export const sendQrGeneratedEmail = async ({ email, name, recordId, accessUrl, recipientRole }) => {
  await sendMail({
    to: email,
    subject: "QR Code Generated",
    html: `
      <p>Hello ${name || "User"},</p>
      <p>A QR code for medical record <strong>${recordId}</strong> was generated.</p>
      <p>You can access the report via:</p>
      <a href="${accessUrl}">${accessUrl}</a>
      <p>Recipient: ${recipientRole || "user"}</p>
    `,
  });
};

export const sendQrAccessedEmail = async ({ email, name, recordId, accessUrl, when, recipientRole }) => {
  await sendMail({
    to: email,
    subject: "Medical Record Accessed",
    html: `
      <p>Hello ${name || "User"},</p>
      <p>The medical record <strong>${recordId}</strong> was accessed.</p>
      <p><strong>Time:</strong> ${new Date(when).toLocaleString()}</p>
      <p>Access link:</p>
      <a href="${accessUrl}">${accessUrl}</a>
      <p>Recipient: ${recipientRole || "user"}</p>
    `,
  });
};
