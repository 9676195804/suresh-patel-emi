import { supabase } from './supabase';

export const sendSMS = async (
  mobile: string,
  message: string,
  customerId: string,
  smsType: string
) => {
  try {
    // In a real application, integrate with SMS API (Twilio, Fast2SMS, MSG91)
    console.log(`SMS to ${mobile}: ${message}`);
    
    // Log SMS to database
    await supabase
      .from('sms_logs')
      .insert({
        customer_id: customerId,
        mobile,
        message,
        sms_type: smsType,
        status: 'sent',
        response: 'Demo SMS sent successfully'
      });
    
    return { success: true };
  } catch (error) {
    console.error('SMS Error:', error);
    
    // Log failed SMS
    await supabase
      .from('sms_logs')
      .insert({
        customer_id: customerId,
        mobile,
        message,
        sms_type: smsType,
        status: 'failed',
        response: error instanceof Error ? error.message : 'Unknown error'
      });
    
    return { success: false, error };
  }
};

export const formatPaymentConfirmationSMS = (
  customerName: string,
  shopName: string,
  emiAmount: number,
  installmentNumber: number,
  remainingInstallments: number
) => {
  return `Dear ${customerName}, your EMI payment of Rs.${emiAmount} for installment ${installmentNumber} has been received. ${remainingInstallments} installments remaining. Thank you! - ${shopName}`;
};

export const formatReminderSMS = (
  customerName: string,
  shopName: string,
  emiAmount: number,
  dueDate: string
) => {
  return `Dear ${customerName}, reminder: Your EMI of Rs.${emiAmount} is due on ${dueDate}. Please make payment on time. - ${shopName}`;
};

export const formatLateFeeNotificationSMS = (
  customerName: string,
  shopName: string,
  emiAmount: number,
  lateFee: number
) => {
  return `Dear ${customerName}, your EMI of Rs.${emiAmount} is overdue. Late fee of Rs.${lateFee} has been added. Please pay immediately. - ${shopName}`;
};

export const formatNOCMessage = (
  customerName: string,
  shopName: string,
  productName: string
) => {
  return `Dear ${customerName}, congratulations! You have successfully completed all EMI payments for ${productName}. No Objection Certificate (NOC) is hereby issued. Thank you for your business! - ${shopName}`;
};