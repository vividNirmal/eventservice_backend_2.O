// src/api/cron/index.ts
import { restoreScheduledCampaigns } from "../domain/models/userCampaign.model";
import { initReminderCronJobs } from "./jobs/reminderCron";


// Initialize all cron jobs
export const initCronJobs = () => {
    restoreScheduledCampaigns();
    initReminderCronJobs();
};