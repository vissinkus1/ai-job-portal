const nodemailer = require("nodemailer");

// Create a test account dynamically for development purposes using Ethereal Email
// In production, replace these config options with your actual SMTP provider (SendGrid, AWS SES, Gmail, etc.)
let transporter;

async function initTransporter() {
  if (!transporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      console.log(`[Email Service] Ready. Test account: ${testAccount.user}`);
    } catch (err) {
      console.error("[Email Service] Initialization failed:", err.message);
    }
  }
  return transporter;
}

exports.sendWelcomeEmail = async (toEmail, name) => {
  try {
    const mailer = await initTransporter();
    if (!mailer) return;

    const info = await mailer.sendMail({
      from: '"AI Job Portal" <noreply@aijobportal.com>',
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

    console.log(`[Email Sent] Welcome email to ${toEmail}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (err) {
    console.error(`[Email Error] Failed to send welcome email to ${toEmail}:`, err.message);
  }
};

exports.sendResetCodeEmail = async (toEmail, code) => {
  try {
    const mailer = await initTransporter();
    if (!mailer) return;

    const info = await mailer.sendMail({
      from: '"AI Job Portal Security" <security@aijobportal.com>',
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

    console.log(`[Email Sent] Reset code to ${toEmail}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (err) {
    console.error(`[Email Error] Failed to send reset code to ${toEmail}:`, err.message);
  }
};
