import { restoreScheduledCampaigns } from "../domain/models/userCampaign.model";
import { dailyPriceCheckJob } from "./jobs/dailyPriceCheckJob";


// Initialize all cron jobs
export const initCronJobs = () => {
    dailyPriceCheckJob();
    restoreScheduledCampaigns();
};