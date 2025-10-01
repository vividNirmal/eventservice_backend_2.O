import schedule from 'node-schedule';

// Function to schedule a daily job at 6 AM
export const dailyPriceCheckJob = () => {

    schedule.scheduleJob('0 6 * * *', async () => {
        
        console.log('Running daily job at 6 AM');

    });

};
