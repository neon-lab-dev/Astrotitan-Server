"use strict";
// import { Resend } from "resend";
// import config from "../config";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
// const resend = new Resend(config.resend_api_key);
// export const sendEmail = async (
//   to: string,
//   subject: string,
//   html: string
// ) => {
//   try {
//     const from = config.email_from;
//     if (!from) {
//       throw new Error("Missing email_from configuration");
//     }
//     const response = await resend.emails.send({
//       from,
//       to,
//       subject,
//       html,
//     });
//     console.log("✅ Email Sent:", response);
//     return response;
//   } catch (error) {
//     console.error("❌ Email Send Error:", error);
//     throw error;
//   }
// };
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = __importDefault(require("../config"));
dotenv_1.default.config();
const sendEmail = (to, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: config_1.default.smtp_email,
                pass: config_1.default.smtp_pass,
            },
        });
        yield transporter.sendMail({
            from: config_1.default.smtp_email,
            to,
            subject,
            text: "Reset your password within 10 minutes",
            html,
        });
    }
    catch (error) {
        console.error("Failed to send email:", error);
        throw new Error("Failed to send email");
    }
});
exports.sendEmail = sendEmail;
