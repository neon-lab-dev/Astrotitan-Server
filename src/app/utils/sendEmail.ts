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

    console.log("✅ Email Sent:", response);

    return response;
  } catch (error) {
    console.error("❌ Email Send Error:", error);
    throw error;
  }
};