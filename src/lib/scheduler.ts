import cron from 'node-cron';
import { sendDailyReminders, sendOverdueNotifications } from './sms-service';

// Schedule daily reminders at 10:00 AM
export const startReminderScheduler = () => {
  // Send daily reminders at 10:00 AM every day
  cron.schedule('0 10 * * *', async () => {
    console.log('Running daily EMI reminders...');
    try {
      await sendDailyReminders();
    } catch (error) {
      console.error('Error in daily reminder scheduler:', error);
    }
  });

  // Check for overdue payments at 6:00 PM every day
  cron.schedule('0 18 * * *', async () => {
    console.log('Checking for overdue payments...');
    try {
      await sendOverdueNotifications();
    } catch (error) {
      console.error('Error in overdue notification scheduler:', error);
    }
  });

  console.log('SMS reminder scheduler started');
};

// Manual trigger functions for testing
export const triggerDailyReminders = async () => {
  console.log('Manually triggering daily reminders...');
  await sendDailyReminders();
};

export const triggerOverdueNotifications = async () => {
  console.log('Manually triggering overdue notifications...');
  await sendOverdueNotifications();
};