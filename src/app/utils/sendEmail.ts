import nodemailer from "nodemailer";
import dotenv from "dotenv";
import config from "../config";

dotenv.config();

export const sendEmail = async (to: string, html: string, subject?: string) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.smtp_email,
        pass: config.smtp_pass,
      },
    });

    await transporter.sendMail({
      from: config.smtp_email,
      to,
      subject: subject || "Reset your password within 10 minutes",
      text: "Reset your password within 10 minutes",
      html,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
};