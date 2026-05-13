"use strict";
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
const resend_1 = require("resend");
const config_1 = __importDefault(require("../config"));
const resend = new resend_1.Resend(config_1.default.resend_api_key);
const sendEmail = (to, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const from = config_1.default.email_from;
        if (!from) {
            throw new Error("Missing email_from configuration");
        }
        const response = yield resend.emails.send({
            from,
            to,
            subject,
            html,
        });
        // console.log("✅ Email Sent:", response);
        return response;
    }
    catch (error) {
        console.error("❌ Email Send Error:", error);
        throw error;
    }
});
exports.sendEmail = sendEmail;
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
