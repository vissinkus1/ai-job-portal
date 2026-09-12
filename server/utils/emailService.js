const nodemailer = require("nodemailer");

// Email service: uses real SMTP (Gmail) when EMAIL_USER/EMAIL_PASS are set,
// otherwise falls back to Ethereal test accounts for development.
let transporter;

async function initTransporter() {
  if (!transporter) {
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      if (emailUser && emailPass) {
        // Production: real Gmail SMTP (use App Password, not regular password)
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });
        console.log(`[Email Service] Ready with Gmail: ${emailUser}`);
      } else {
        // Development fallback: Ethereal test account
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.warn(`[Email Service] Using Ethereal test account: ${testAccount.user}`);
        console.warn("[Email Service] Set EMAIL_USER and EMAIL_PASS in .env for real email delivery");
      }
    } catch (err) {
      console.error("[Email Service] Initialization failed:", err.message);
    }
  }
  return transporter;
}

// Helper to get the "from" address (use real email when available)
function getFromAddress(label = "AI Job Portal") {
  const emailUser = process.env.EMAIL_USER;
  if (emailUser) return `"${label}" <${emailUser}>`;
  return `"${label}" <noreply@aijobportal.com>`;
}

exports.sendWelcomeEmail = async (toEmail, name) => {
  try {
    const mailer = await initTransporter();
    if (!mailer) return;

    const info = await mailer.sendMail({
      from: getFromAddress(),
      to: toEmail,
      subject: "Welcome to AI Job Portal! 🚀",
      text: `Hi ${name},\n\nWelcome to the AI Job Portal! We're thrilled to have you on board.\n\nStart browsing jobs or building your profile today.\n\nBest,\nThe AI Job Portal Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #00c6ff, #7c3aed); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Welcome to AI Job Portal! ⚡</h1>
          </div>
          <div style="padding: 30px; background: #fff; color: #333;">
            <h2 style="margin-top: 0;">Hi ${name},</h2>
            <p>We're thrilled to have you on board! The AI Job Portal is designed to connect top talent with the best companies using intelligent matching.</p>
            <p>Here are a few things you can do next:</p>
            <ul style="padding-left: 20px;">
              <li>Complete your profile and add your skills</li>
              <li>Upload your latest resume</li>
              <li>Browse and save jobs that catch your eye</li>
            </ul>
            <br/>
            <p>Best regards,<br/><strong>The AI Job Portal Team</strong></p>
          </div>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email Sent] Welcome email to ${toEmail}.${previewUrl ? ` Preview URL: ${previewUrl}` : ""}`);
  } catch (err) {
    console.error(`[Email Error] Failed to send welcome email to ${toEmail}:`, err.message);
  }
};

exports.sendResetCodeEmail = async (toEmail, code) => {
  try {
    const mailer = await initTransporter();
    if (!mailer) return;

    const info = await mailer.sendMail({
      from: getFromAddress("AI Job Portal Security"),
      to: toEmail,
      subject: "Password Reset Code 🔐",
      text: `Your password reset code is: ${code}\n\nThis code will expire in 15 minutes.\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
          <div style="background: #1e1e2d; padding: 25px; text-align: center; color: white;">
            <h2 style="margin: 0; font-weight: 500;">Password Reset Request</h2>
          </div>
          <div style="padding: 30px; background: #fafafa; color: #444; text-align: center;">
            <p style="font-size: 16px; margin-top: 0;">We received a request to reset your password. Here is your 6-digit confirmation code:</p>
            
            <div style="background: #fff; border: 2px dashed #ccc; border-radius: 8px; padding: 15px; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #7c3aed;">${code}</span>
            </div>
            
            <p style="font-size: 14px; color: #666;">This code is valid for <strong>15 minutes</strong>.</p>
            <p style="font-size: 13px; color: #999; margin-top: 25px;">If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email Sent] Reset code to ${toEmail}.${previewUrl ? ` Preview URL: ${previewUrl}` : ""}`);
  } catch (err) {
    console.error(`[Email Error] Failed to send reset code to ${toEmail}:`, err.message);
  }
};

exports.sendApplicationStatusEmail = async (toEmail, name, jobTitle, status) => {
  try {
    const mailer = await initTransporter();
    if (!mailer) return;

    const statusColors = { reviewed: "#2196F3", accepted: "#4CAF50", rejected: "#f44336" };
    const statusEmoji = { reviewed: "👀", accepted: "🎉", rejected: "😞" };
    const color = statusColors[status] || "#7c3aed";
    const emoji = statusEmoji[status] || "📋";

    const info = await mailer.sendMail({
      from: getFromAddress(),
      to: toEmail,
      subject: `Application ${status.charAt(0).toUpperCase() + status.slice(1)} — ${jobTitle} ${emoji}`,
      text: `Hi ${name},\n\nYour application for "${jobTitle}" has been ${status}.\n\nLog in to your dashboard for more details.\n\nBest,\nThe AI Job Portal Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
          <div style="background: ${color}; padding: 25px; text-align: center; color: white;">
            <h2 style="margin: 0;">Application ${status.charAt(0).toUpperCase() + status.slice(1)} ${emoji}</h2>
          </div>
          <div style="padding: 30px; background: #fff; color: #333;">
            <h3 style="margin-top: 0;">Hi ${name},</h3>
            <p>Your application for <strong>"${jobTitle}"</strong> has been <strong style="color: ${color};">${status}</strong>.</p>
            <p>Log in to your dashboard to see more details.</p>
            <br/>
            <p>Best regards,<br/><strong>The AI Job Portal Team</strong></p>
          </div>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email Sent] Status email to ${toEmail}.${previewUrl ? ` Preview URL: ${previewUrl}` : ""}`);
  } catch (err) {
    console.error(`[Email Error] Failed to send status email to ${toEmail}:`, err.message);
  }
};

exports.sendVerificationEmail = async (toEmail, name, code) => {
  try {
    const mailer = await initTransporter();
    if (!mailer) return;

    const info = await mailer.sendMail({
      from: getFromAddress(),
      to: toEmail,
      subject: "Verify Your Email ✉️",
      text: `Hi ${name},\n\nYour verification code is: ${code}\n\nThis code expires in 30 minutes.\n\nBest,\nThe AI Job Portal Team`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #00c6ff, #7c3aed); padding: 25px; text-align: center; color: white;">
            <h2 style="margin: 0; font-weight: 500;">Verify Your Email ✉️</h2>
          </div>
          <div style="padding: 30px; background: #fafafa; color: #444; text-align: center;">
            <p style="font-size: 16px; margin-top: 0;">Hi <strong>${name}</strong>, welcome! Please enter this code to verify your email:</p>
            <div style="background: #fff; border: 2px dashed #ccc; border-radius: 8px; padding: 15px; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #7c3aed;">${code}</span>
            </div>
            <p style="font-size: 14px; color: #666;">This code is valid for <strong>30 minutes</strong>.</p>
          </div>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email Sent] Verification email to ${toEmail}.${previewUrl ? ` Preview URL: ${previewUrl}` : ""}`);
  } catch (err) {
    console.error(`[Email Error] Failed to send verification email to ${toEmail}:`, err.message);
  }
};

exports.sendJobAlertEmail = async (toEmail, name, jobs) => {
  try {
    const mailer = await initTransporter();
    if (!mailer) return;

    const jobCount = jobs.length;
    const jobListHtml = jobs
      .map(
        (j) => `
        <div style="border: 1px solid #eee; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: #fff;">
          <h3 style="margin: 0 0 5px 0; color: #333;">${j.title}</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">${j.company} • ${j.location}</p>
        </div>`
      )
      .join("");

    const info = await mailer.sendMail({
      from: getFromAddress(),
      to: toEmail,
      subject: `🔔 ${jobCount} New Job${jobCount > 1 ? "s" : ""} Matching Your Alert!`,
      text: `Hi ${name},\n\nWe found ${jobCount} new job${jobCount > 1 ? "s" : ""} matching your alert:\n\n${jobs.map((j) => `• ${j.title} at ${j.company} (${j.location})`).join("\n")}\n\nLog in to view details and apply.\n\nBest,\nThe AI Job Portal Team`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #00c6ff, #7c3aed); padding: 25px; text-align: center; color: white;">
            <h2 style="margin: 0; font-weight: 500;">🔔 Job Alert Match!</h2>
          </div>
          <div style="padding: 30px; background: #fafafa; color: #444;">
            <p style="font-size: 16px; margin-top: 0;">Hi <strong>${name}</strong>, we found <strong>${jobCount} new job${jobCount > 1 ? "s" : ""}</strong> matching your alert:</p>
            ${jobListHtml}
            <p style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_ORIGIN || "http://localhost:5173"}/jobs" style="background: linear-gradient(135deg, #00c6ff, #7c3aed); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View Jobs →</a>
            </p>
            <p style="font-size: 13px; color: #999; margin-top: 25px; text-align: center;">Manage your alerts in Settings to update or disable notifications.</p>
          </div>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email Sent] Job alert to ${toEmail}.${previewUrl ? ` Preview URL: ${previewUrl}` : ""}`);
  } catch (err) {
    console.error(`[Email Error] Failed to send job alert email to ${toEmail}:`, err.message);
  }
};

