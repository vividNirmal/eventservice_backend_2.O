// api/cron/reminderCron.js
import { sendCheckinReminders } from "../../services/reminderEmailService";
import { loggerMsg } from "../../lib/logger";
import schedule from "node-schedule";

/**
 * Initialize reminder cron jobs
 */
export const initReminderCronJobs = () => {
    // Run every day at 9:00 AM // 0 9 * * *
    schedule.scheduleJob('0 9 * * *', async () => {
        console.log("✅✅✅✅✅Running daily check-in reminder job")
        try {
            loggerMsg("info", "Starting daily check-in reminder job");
            await sendCheckinReminders();
            loggerMsg("info", "Daily check-in reminder job completed");
        } catch (error: any) {
            loggerMsg("error", `Daily reminder job failed: ${error.message}`);
        }
    });

    console.log("Reminder cron jobs initialized");
};