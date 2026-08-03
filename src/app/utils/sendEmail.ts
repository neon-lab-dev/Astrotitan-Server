import { Resend } from "resend";
import config from "../config";

const resend = new Resend(config.resend_api_key);

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  try {
    const from = config.email_from;
    if (!from) {
      throw new Error("Missing email_from configuration");
    }

    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    // console.log("Email Sent:", response);

    return response;
  } catch (error) {
    console.error("❌ Email Send Error:", error);
    throw error;
  }
};


// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// import config from "../config";

// dotenv.config();

// export const sendEmail = async (to: string, subject:string, html: string) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//      auth: {
//         user: config.smtp_email,
//         pass: config.smtp_pass,
//       },
//     });

//     await transporter.sendMail({
//       from: config.smtp_email,
//       to,
//       subject,
//       text: "Reset your password within 10 minutes",
//       html,
//     });
//   } catch (error) {
//     console.error("Failed to send email:", error);
//     throw new Error("Failed to send email");
//   }
// };