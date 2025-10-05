import { sendDailyReminders, sendOverdueNotifications } from './sms-service';

class SMSScheduler {
  private reminderInterval: NodeJS.Timeout | null = null;
  private overdueInterval: NodeJS.Timeout | null = null;

  start() {
    console.log('Starting SMS scheduler...');
    
    // Check every minute for testing, in production you might want every hour
    this.reminderInterval = setInterval(() => {
      const now = new Date();
      // Send reminders at 10:00 AM
      if (now.getHours() === 10 && now.getMinutes() === 0) {
        sendDailyReminders();
      }
    }, 60000); // Check every minute

    this.overdueInterval = setInterval(() => {
      const now = new Date();
      // Send overdue notifications at 6:00 PM
      if (now.getHours() === 18 && now.getMinutes() === 0) {
        sendOverdueNotifications();
      }
    }, 60000); // Check every minute
  }

  stop() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
    if (this.overdueInterval) {
      clearInterval(this.overdueInterval);
      this.overdueInterval = null;
    }
    console.log('SMS scheduler stopped');
  }

  // Manual trigger methods for testing
  async triggerReminders() {
    console.log('Manually triggering daily reminders...');
    await sendDailyReminders();
  }

  async triggerOverdueNotifications() {
    console.log('Manually triggering overdue notifications...');
    await sendOverdueNotifications();
  }
}

export const smsScheduler = new SMSScheduler();