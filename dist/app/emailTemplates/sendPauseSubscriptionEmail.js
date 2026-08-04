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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReviewReceivedEmail = exports.sendConsultationStatusEmail = exports.sendConsultationBookingEmail = exports.sendSubscriptionStatusEmail = exports.sendSubscriptionConfirmationEmail = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const sendEmail_1 = require("../utils/sendEmail");
const BRAND_NAME = "Astrotitan";
const BRAND_COLOR = "#d4af37"; // Gold color
const ADMIN_EMAIL = "rahul.mitraconsultancy@gmail.com";
/* Get User Name Helper */
const getUserName = (user) => {
    if ((user === null || user === void 0 ? void 0 : user.firstName) && (user === null || user === void 0 ? void 0 : user.lastName)) {
        return `${user.firstName} ${user.lastName}`;
    }
    if (user === null || user === void 0 ? void 0 : user.name) {
        return user.name;
    }
    return "User";
};
/* Email Template Wrapper */
const emailWrapper = (title, content) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; background-color:#f8f6f0; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; padding:40px; box-shadow:0 2px 10px rgba(0,0,0,0.08); border-top: 4px solid ${BRAND_COLOR};">
    
    <!-- Header -->
    <div style="text-align:center; margin-bottom:25px;">
      <h1 style="color:${BRAND_COLOR}; font-size:28px; font-weight:700; margin:0; letter-spacing:1px;">${BRAND_NAME}</h1>
      <p style="color:#8b7a5a; font-size:14px; margin:5px 0 0 0; font-weight:300;">Astrology &amp; Spiritual Guidance</p>
    </div>

    <!-- Body -->
    ${content}

    <!-- Footer -->
    <div style="text-align:center; margin-top:30px; padding-top:20px; border-top:1px solid #e8e2d5;">
      <p style="color:#999; font-size:12px; margin:0;">
        © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
      </p>
      <p style="color:#999; font-size:12px; margin:5px 0 0 0;">
        This email was sent to you because you are a valued ${BRAND_NAME} user.
      </p>
    </div>
  </div>
</div>
`;
/* Subscription Confirmation Email */
const sendSubscriptionConfirmationEmail = (user, subscriptionDetails) => __awaiter(void 0, void 0, void 0, function* () {
    const userName = getUserName(user);
    const startDate = subscriptionDetails.startDate
        ? new Date(subscriptionDetails.startDate).toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    const endDate = subscriptionDetails.endDate
        ? new Date(subscriptionDetails.endDate).toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "N/A";
    const content = `
    <p style="font-size:16px; color:#333; margin-bottom:10px;">Namaste <strong>${userName}</strong>,</p>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      🌟 Your <strong>${BRAND_NAME} Premium Subscription</strong> has been successfully activated!
    </p>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      You now have access to exclusive astrological insights, personalized horoscopes, and premium consultations with our expert astrologers.
    </p>
    <div style="background:#f5f0e6; padding:18px; border-radius:8px; margin:20px 0; border-left: 3px solid ${BRAND_COLOR};">
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📿 Subscription ID:</strong> ${subscriptionDetails.razorpaySubscriptionId}</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📅 Start Date:</strong> ${startDate}</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📅 Expiry Date:</strong> ${endDate}</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>✨ Status:</strong> Active</p>
    </div>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      May the stars guide your path! ✨
    </p>
    <p style="font-size:15px; color:#333; margin-top:25px;">With cosmic blessings,</p>
    <p style="font-size:16px; font-weight:bold; color:${BRAND_COLOR};">The ${BRAND_NAME} Team</p>
  `;
    const htmlBody = emailWrapper("Subscription Confirmation", content);
    try {
        yield (0, sendEmail_1.sendEmail)(user.email, `✨ ${BRAND_NAME} - Subscription Confirmed`, htmlBody);
        // Send admin notification
        const adminContent = `
      <p style="font-size:16px; color:#333; margin-bottom:10px;">Hello Admin,</p>
      <p style="font-size:15px; color:#555; line-height:1.6;">
        A new subscription has been purchased on ${BRAND_NAME}.
      </p>
      <div style="background:#f5f0e6; padding:18px; border-radius:8px; margin:20px 0; border-left: 3px solid ${BRAND_COLOR};">
        <p style="font-size:14px; margin:6px 0; color:#333;"><strong>👤 Customer:</strong> ${userName}</p>
        <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📧 Email:</strong> ${user.email}</p>
        <p style="font-size:14px; margin:6px 0; color:#333;"><strong>🪐 Subscription ID:</strong> ${subscriptionDetails.razorpaySubscriptionId}</p>
        <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📅 Date:</strong> ${startDate}</p>
      </div>
    `;
        const adminHtml = emailWrapper("New Subscription", adminContent);
        yield (0, sendEmail_1.sendEmail)(ADMIN_EMAIL, `🪐 ${BRAND_NAME} - New Subscription`, adminHtml);
    }
    catch (error) {
        console.error("Failed to send subscription confirmation email:", error);
    }
});
exports.sendSubscriptionConfirmationEmail = sendSubscriptionConfirmationEmail;
/* Subscription Status Update Email (Active/Paused/Cancelled) */
const sendSubscriptionStatusEmail = (user, subscriptionDetails, action) => __awaiter(void 0, void 0, void 0, function* () {
    const userName = getUserName(user);
    const actionTense = action === "paused"
        ? "paused"
        : action === "active"
            ? "resumed"
            : "cancelled";
    const actionTitle = action === "paused"
        ? "Paused"
        : action === "active"
            ? "Resumed"
            : "Cancelled";
    const actionEmoji = action === "paused"
        ? "⏸️"
        : action === "active"
            ? "▶️"
            : "❌";
    const statusMessage = action === "paused"
        ? "Your subscription benefits are temporarily on hold. You can resume anytime from your dashboard."
        : action === "active"
            ? "Your subscription benefits have been restored! You now have full access to all premium astrological features."
            : "Your subscription has been cancelled. You will no longer have access to premium features. If this was a mistake, you can purchase a new subscription anytime.";
    const content = `
    <p style="font-size:16px; color:#333; margin-bottom:10px;">Namaste <strong>${userName}</strong>,</p>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      ${actionEmoji} Your ${BRAND_NAME} Premium Subscription has been <strong>${actionTense}</strong>.
    </p>
    <div style="background:#f5f0e6; padding:18px; border-radius:8px; margin:20px 0; border-left: 3px solid ${BRAND_COLOR};">
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📿 Subscription ID:</strong> ${subscriptionDetails.razorpaySubscriptionId}</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📊 Status:</strong> ${actionTitle}</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📅 ${actionTitle} Date:</strong> ${new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</p>
    </div>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      ${statusMessage}
    </p>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      May the stars guide your path! ✨
    </p>
    <p style="font-size:15px; color:#333; margin-top:25px;">With cosmic blessings,</p>
    <p style="font-size:16px; font-weight:bold; color:${BRAND_COLOR};">The ${BRAND_NAME} Team</p>
  `;
    const htmlBody = emailWrapper(`Subscription ${actionTitle}`, content);
    try {
        yield (0, sendEmail_1.sendEmail)(user.email, `${actionEmoji} ${BRAND_NAME} - Subscription ${actionTitle}`, htmlBody);
        // Admin notification
        const adminContent = `
      <p style="font-size:16px; color:#333; margin-bottom:10px;">Hello Admin,</p>
      <p style="font-size:15px; color:#555; line-height:1.6;">
        A subscription has been ${actionTense} on ${BRAND_NAME}.
      </p>
      <div style="background:#f5f0e6; padding:18px; border-radius:8px; margin:20px 0; border-left: 3px solid ${BRAND_COLOR};">
        <p style="font-size:14px; margin:6px 0; color:#333;"><strong>👤 Customer:</strong> ${userName}</p>
        <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📧 Email:</strong> ${user.email}</p>
        <p style="font-size:14px; margin:6px 0; color:#333;"><strong>🪐 Subscription ID:</strong> ${subscriptionDetails.razorpaySubscriptionId}</p>
        <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📊 Action:</strong> ${actionTitle}</p>
      </div>
    `;
        const adminHtml = emailWrapper(`Subscription ${actionTitle}`, adminContent);
        yield (0, sendEmail_1.sendEmail)(ADMIN_EMAIL, `🪐 ${BRAND_NAME} - Subscription ${actionTitle}`, adminHtml);
    }
    catch (error) {
        console.error(`Failed to send subscription ${action} email:`, error);
    }
});
exports.sendSubscriptionStatusEmail = sendSubscriptionStatusEmail;
/* Consultation Booking Confirmation Email */
const sendConsultationBookingEmail = (user, astrologer, consultationDetails) => __awaiter(void 0, void 0, void 0, function* () {
    const userName = getUserName(user);
    const astrologerName = (astrologer === null || astrologer === void 0 ? void 0 : astrologer.displayName) || `${(astrologer === null || astrologer === void 0 ? void 0 : astrologer.firstName) || ''} ${(astrologer === null || astrologer === void 0 ? void 0 : astrologer.lastName) || ''}`.trim() || "Astrologer";
    const date = consultationDetails.createdAt
        ? new Date(consultationDetails.createdAt).toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    const content = `
    <p style="font-size:16px; color:#333; margin-bottom:10px;">Namaste <strong>${userName}</strong>,</p>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      🙏 Your consultation request has been received!
    </p>
    <div style="background:#f5f0e6; padding:18px; border-radius:8px; margin:20px 0; border-left: 3px solid ${BRAND_COLOR};">
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>🔮 Astrologer:</strong> ${astrologerName}</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📋 Purpose:</strong> ${consultationDetails.consultationFor || "General Guidance"}</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>💬 Method:</strong> ${consultationDetails.method === "chat" ? "Chat" : "Call"}</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📅 Date:</strong> ${date}</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📊 Status:</strong> ${consultationDetails.status || "Pending"}</p>
    </div>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      Our astrologer will review your request and get back to you shortly.
    </p>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      May the stars align in your favor! ✨
    </p>
    <p style="font-size:15px; color:#333; margin-top:25px;">With cosmic blessings,</p>
    <p style="font-size:16px; font-weight:bold; color:${BRAND_COLOR};">The ${BRAND_NAME} Team</p>
  `;
    const htmlBody = emailWrapper("Consultation Request Received", content);
    try {
        yield (0, sendEmail_1.sendEmail)(user.email, `🙏 ${BRAND_NAME} - Consultation Request Received`, htmlBody);
    }
    catch (error) {
        console.error("Failed to send consultation booking email:", error);
    }
});
exports.sendConsultationBookingEmail = sendConsultationBookingEmail;
/* Consultation Status Update Email */
const sendConsultationStatusEmail = (user, consultationDetails, status) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userName = getUserName(user);
    const statusEmoji = status === "accepted" ? "" : status === "declined" ? "❌" : "📌";
    const statusTitle = status.charAt(0).toUpperCase() + status.slice(1);
    const content = `
    <p style="font-size:16px; color:#333; margin-bottom:10px;">Namaste <strong>${userName}</strong>,</p>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      ${statusEmoji} Your consultation request has been <strong>${status}</strong>.
    </p>
    <div style="background:#f5f0e6; padding:18px; border-radius:8px; margin:20px 0; border-left: 3px solid ${BRAND_COLOR};">
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>🔮 Astrologer:</strong> ${((_a = consultationDetails.astrologer) === null || _a === void 0 ? void 0 : _a.displayName) || "N/A"}</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📋 Purpose:</strong> ${consultationDetails.consultationFor || "General Guidance"}</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📊 Status:</strong> ${statusTitle}</p>
    </div>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      ${status === "accepted"
        ? "You can now start your consultation. Click the button below to begin your session."
        : status === "declined"
            ? "We recommend trying another astrologer for your consultation needs."
            : "Thank you for using our service. We hope you had a great experience!"}
    </p>
    ${status === "accepted" ? `
    <div style="text-align:center; margin:25px 0;">
      <a href="${process.env.FRONTEND_URL}/chat/${consultationDetails._id}" 
         style="display:inline-block; background-color:${BRAND_COLOR}; color:#1a1a1a; padding:12px 35px; border-radius:8px; text-decoration:none; font-weight:600; font-size:16px;">
        🪐 Start Consultation
      </a>
    </div>
    ` : ""}
    <p style="font-size:15px; color:#333; margin-top:25px;">With cosmic blessings,</p>
    <p style="font-size:16px; font-weight:bold; color:${BRAND_COLOR};">The ${BRAND_NAME} Team</p>
  `;
    const htmlBody = emailWrapper(`Consultation ${statusTitle}`, content);
    try {
        yield (0, sendEmail_1.sendEmail)(user.email, `${statusEmoji} ${BRAND_NAME} - Consultation ${statusTitle}`, htmlBody);
    }
    catch (error) {
        console.error(`Failed to send consultation ${status} email:`, error);
    }
});
exports.sendConsultationStatusEmail = sendConsultationStatusEmail;
/* Review Received Email */
const sendReviewReceivedEmail = (user, astrologer, reviewDetails) => __awaiter(void 0, void 0, void 0, function* () {
    const userName = getUserName(user);
    const astrologerName = (astrologer === null || astrologer === void 0 ? void 0 : astrologer.displayName) || `${(astrologer === null || astrologer === void 0 ? void 0 : astrologer.firstName) || ''} ${(astrologer === null || astrologer === void 0 ? void 0 : astrologer.lastName) || ''}`.trim() || "Astrologer";
    const content = `
    <p style="font-size:16px; color:#333; margin-bottom:10px;">Namaste <strong>${userName}</strong>,</p>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      ⭐ Thank you for sharing your feedback!
    </p>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      Your review for <strong>${astrologerName}</strong> has been received and will help other seekers on their spiritual journey.
    </p>
    <div style="background:#f5f0e6; padding:18px; border-radius:8px; margin:20px 0; border-left: 3px solid ${BRAND_COLOR};">
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>⭐ Rating:</strong> ${reviewDetails.rating} / 5</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>📝 Review:</strong> ${reviewDetails.review}</p>
      <p style="font-size:14px; margin:6px 0; color:#333;"><strong>🔮 Astrologer:</strong> ${astrologerName}</p>
    </div>
    <p style="font-size:15px; color:#555; line-height:1.6;">
      Your feedback helps us improve and maintain the highest quality of astrological guidance.
    </p>
    <p style="font-size:15px; color:#333; margin-top:25px;">With cosmic blessings,</p>
    <p style="font-size:16px; font-weight:bold; color:${BRAND_COLOR};">The ${BRAND_NAME} Team</p>
  `;
    const htmlBody = emailWrapper("Review Received", content);
    try {
        yield (0, sendEmail_1.sendEmail)(user.email, `⭐ ${BRAND_NAME} - Thank You for Your Review`, htmlBody);
    }
    catch (error) {
        console.error("Failed to send review received email:", error);
    }
});
exports.sendReviewReceivedEmail = sendReviewReceivedEmail;
