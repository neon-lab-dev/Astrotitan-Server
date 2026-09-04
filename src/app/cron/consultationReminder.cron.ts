/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cron from 'node-cron';
import { Astrologer } from '../modules/astrologer/astrologer.model';
import { User } from '../modules/users/user.model';
import { sendSingleNotification } from '../utils/sendSingleNotification';
import Consultation from '../modules/astrologerBooking/consultation/consultation.model';

// Parse time string like "5:00 PM" to Date object
const parseTimeToDate = (timeStr: string, dateStr: string): Date => {
    // Extract date part
    const date = new Date(dateStr);
    
    // Parse time like "5:00 PM" or "5:30 PM"
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (modifier === 'PM' && hours !== 12) {
        hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
        hours = 0;
    }
    
    date.setHours(hours, minutes, 0, 0);
    return date;
};

// Send reminder for a single consultation
const sendConsultationReminder = async (consultation: any) => {
    try {
        // Get user details
        const user = await User.findById(consultation.user);
        const astrologer = await Astrologer.findById(consultation.astrologer);

        if (!user || !astrologer) {
            console.log('❌ User or Astrologer not found');
            return;
        }

        // Get booked slot details
        const slot = consultation.slotId?.slots?.find(
            (s: any) => s._id.toString() === consultation.bookedSlotId?.toString()
        );

        if (!slot) {
            console.log('❌ Booked slot not found');
            return;
        }

        const startTime = slot.startTime; // e.g., "5:00 PM"
        const date = consultation.slotId?.date; // e.g., "2026-08-31T00:00:00.000Z"

        if (!date) {
            console.log('❌ Date not found');
            return;
        }

        const scheduledDate = parseTimeToDate(startTime, date);

        // Format date for display
        const formattedDate = scheduledDate.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'Asia/Kolkata',
        });

        // Format time for display
        const formattedTime = scheduledDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
        });

        // Send notification to USER
        await sendSingleNotification(
            user?.accountId as any,
            '🔔 Consultation Reminder',
            `Your consultation with ${astrologer.displayName || astrologer.firstName} is scheduled for ${formattedDate} at ${formattedTime}. Please be ready.`,
        );

        // Send notification to ASTROLOGER
        await sendSingleNotification(
            astrologer.accountId as any,
            '🔔 Upcoming Consultation Reminder',
            `You have a consultation with ${user.firstName} ${user.lastName} scheduled for ${formattedDate} at ${formattedTime}. Please be ready.`,
        );
    } catch (error) {
        console.error(`❌ Failed to send reminder for consultation ${consultation._id}:`, error);
    }
};

// Main cron job - runs every minute to check for upcoming consultations
export const runConsultationReminderCron = () => {
    cron.schedule('* * * * *', async () => {
        console.log('🔄 Running consultation reminder check...');

        try {
            // Get current time in IST
            const now = new Date();
            
            // Get all consultations with 'call' method and 'accepted' status
            const consultations = await Consultation.find({
                method: 'call',
                status: { $in: ['accepted', 'pending'] },
                'slotId.slots.isBooked': true,
            })
                .populate('slotId')
                .populate('user', 'name email phoneNumber')
                .populate('astrologer', 'displayName firstName lastName accountId')
                .lean();

            // Filter consultations that need reminders
            for (const consultation of consultations) {
                try {
                    // Find the booked slot
                    const bookedSlot = (consultation.slotId as any)?.slots?.find(
                        (s: any) => s._id.toString() === consultation.bookedSlotId?.toString()
                    );

                    if (!bookedSlot) continue;

                    const startTime = bookedSlot.startTime;
                    const date = (consultation.slotId as any)?.date;

                    if (!date || !startTime) continue;

                    const scheduledDate = parseTimeToDate(startTime, date);

                    // Check if the consultation is scheduled within the next 30 minutes
                    const timeDiff = scheduledDate.getTime() - now.getTime();
                    const isWithin30Minutes = timeDiff > 0 && timeDiff <= 30 * 60 * 1000;

                    if (isWithin30Minutes) {
                        await sendConsultationReminder(consultation);
                    }
                } catch (error) {
                    console.error(`Error processing consultation ${consultation._id}:`, error);
                }
            }
        } catch (error) {
            console.error('❌ Consultation reminder cron failed:', error);
        }
    }, {
        timezone: 'Asia/Kolkata', // India timezone
    });
};
