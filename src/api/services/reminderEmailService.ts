// services/reminderEmailService.js
import { loggerMsg } from "../lib/logger";
import FormRegistration from "../domain/schema/formRegistration.schema";
import Ticket from "../domain/schema/ticket.schema";
import { sendNotification } from "./templateService";

/**
 * Send reminder emails to users who haven't checked in
 */
export const sendCheckinReminders = async () => {
    try {
        // Find all active tickets with form registrations
        const tickets = await Ticket.find({ status: 'active' })
            .populate('eventId')
            .populate('notifications.emailNotification.templates.templateId');

        for (const ticket of tickets) {
            await processTicketReminders(ticket);
        }

        loggerMsg("info", "Check-in reminder processing completed");
    } catch (error: any) {
        loggerMsg("error", `Error in check-in reminder service: ${error.message}`);
    }
};

/**
 * Process reminders for a specific ticket
 */
const processTicketReminders = async (ticket: any) => {
    try {
        // ⛔ STOP if event already ended
        if (ticket.eventId?.endDate && ticket.eventId?.endTime) {
            const eventEnd = new Date(`${ticket.eventId.endDate}T${ticket.eventId.endTime}:00`);
            const now = new Date();

            if (now > eventEnd) {
                console.log(`Event ended → reminders stopped for ticket: ${ticket.ticketName}`);
                return;
            }
        }

        // Find registrations that haven't checked in
        const pendingRegistrations = await FormRegistration.find({
            ticketId: ticket._id,
            checkin_time: { $exists: false },
            approved: true
        }).populate('eventId');

        if (pendingRegistrations.length === 0) return;

        // Skip registrations created today
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const eligibleRegistrations = pendingRegistrations.filter((registration: any) => {
            const registrationDate = new Date(registration.createdAt);
            return registrationDate < yesterday;
        });

        if (eligibleRegistrations.length === 0) return;

        // Batch processing
        const batchSize = 100; // #batch
        const totalBatches = Math.ceil(eligibleRegistrations.length / batchSize);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startIndex = batchIndex * batchSize;
            const endIndex = Math.min(startIndex + batchIndex + batchSize, eligibleRegistrations.length);

            const batch = eligibleRegistrations.slice(startIndex, endIndex);
            await processReminderBatch(ticket, batch, batchIndex);

            if (batchIndex < totalBatches - 1) {
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        }
    } catch (error: any) {
        loggerMsg("error", `Error processing reminders for ticket ${ticket._id}: ${error.message}`);
    }
};

/**
 * Process a batch of reminder emails
 */
const processReminderBatch = async (ticket: any, registrations: any, batchIndex: any) => {
    let sentCount = 0;
    let failedCount = 0;

    console.log(`Processing reminder batch ${batchIndex + 1} with ${registrations.length} registrations`);

    for (const registration of registrations) {
        try {
            const templateData = {
                name: registration.formData?.name || registration.formData?.firstName || 'User',
                email: registration.email,
                badgeNo: registration.badgeNo,
                eventName: registration.eventId?.event_title || ticket.eventId?.event_title || 'Event',
                ticketName: ticket.ticketName,
                registrationDate: registration.createdAt,
                ...registration.formData
            };

            // Send reminder notification
            await sendNotification(
                ticket._id,
                "reminder",
                registration.email,
                templateData,
                "email"
            );

            sentCount++;
            loggerMsg("info", `Reminder sent to ${registration.email} for ticket ${ticket.ticketName}`);

        } catch (error: any) {
            failedCount++;
            loggerMsg("error", `Failed to send reminder to ${registration.email}: ${error.message}`);
        }
    }

    console.log(`Reminder batch ${batchIndex + 1} completed: ${sentCount} sent, ${failedCount} failed`);
};