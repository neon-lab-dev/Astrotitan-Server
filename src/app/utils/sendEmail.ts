import nodemailer from "nodemailer";
import config from "../config";

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: config.smtp_email,
        pass: config.smtp_pass,
      },
    });

    await transporter.verify();

    console.log("✅ SMTP connected");

    const info = await transporter.sendMail({
      from: config.smtp_email,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);

  } catch (error) {
    console.error("❌ REAL EMAIL ERROR:", error);

    throw error;
  }
};