"use strict";
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { sendSingleNotification } from "../app/modules/applications/application.service";
// import { Guardian } from "../app/modules/guardian/guardian.model";
// import { Tutor } from "../app/modules/tutor/tutor.model";
// import cron from "node-cron";
// const BIRTHDAY_MESSAGE =
//   "Wishing you a year filled with joy, good health, and success. Thank you for being a valued part of the Bright Tuition Care community. Enjoy your special day!";
// const sendBirthdayNotifications = async () => {
//   const today = new Date();
//   const month = today.getMonth() + 1; // 1–12
//   const day = today.getDate();
//   // 🔍 Find tutors with birthdays today
//   const tutors = await Tutor.find({
//     "personalInformation.dateOfBirth": { $exists: true },
//     $expr: {
//       $and: [
//         { $eq: [{ $month: "$personalInformation.dateOfBirth" }, month] },
//         { $eq: [{ $dayOfMonth: "$personalInformation.dateOfBirth" }, day] },
//       ],
//     },
//   }).select("userId");
//   // 🔍 Find guardians with birthdays today
//   const guardians = await Guardian.find({
//     "personalInformation.dateOfBirth": { $exists: true },
//     $expr: {
//       $and: [
//         { $eq: [{ $month: "$personalInformation.dateOfBirth" }, month] },
//         { $eq: [{ $dayOfMonth: "$personalInformation.dateOfBirth" }, day] },
//       ],
//     },
//   }).select("userId");
//   // 🎯 Send notifications to tutors
//   for (const tutor of tutors) {
//     await sendSingleNotification(
//       tutor.userId as any,
//       "🎉 Happy Birthday! 🎂",
//       BIRTHDAY_MESSAGE
//     );
//   }
//   // 🎯 Send notifications to guardians
//   for (const guardian of guardians) {
//     await sendSingleNotification(
//       guardian.userId as any,
//       "🎉 Happy Birthday! 🎂",
//       BIRTHDAY_MESSAGE
//     );
//   }
//   console.log(
//     `🎂 Sent birthday notifications to ${tutors.length + guardians.length} users today.`
//   );
// };
// export const registerCrons = () => {
//   // Runs every day at 12:00 AM
//   cron.schedule("0 0 * * *", async () => {
//     console.log("🎂 Running birthday notification job at 12:00 AM");
//     await sendBirthdayNotifications();
//   });
// };
