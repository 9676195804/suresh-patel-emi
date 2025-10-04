import { supabase } from './supabase';

interface Fast2SMSResponse {
  return: boolean;
  request_id: string;
  message: string[];
}

export const sendSMSViaFast2SMS = async (
  mobile: string,
  message: string,
  customerId: string,
  smsType: string
) => {
  try {
    // Get SMS settings
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['sms_api_key', 'sms_sender_id', 'sms_api_url']);

    const settingsMap: Record<string, string> = {};
    settings?.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    const apiKey = settingsMap.sms_api_key;
    const senderId = settingsMap.sms_sender_id || 'EMIKIT';
    const apiUrl = settingsMap.sms_api_url || 'https://www.fast2sms.com/dev/bulkV2';

    if (!apiKey) {
      console.log('SMS API key not configured, logging message:', message);
      
      // Log SMS to database
      await supabase
        .from('sms_logs')
        .insert({
          customer_id: customerId,
          mobile,
          message,
          sms_type: smsType,
          status: 'sent',
          response: 'Demo mode - SMS logged but not sent'
        });
      
      return { success: true, demo: true };
    }

    // Prepare Fast2SMS API request
    const formData = new FormData();
    formData.append('authorization', apiKey);
    formData.append('sender_id', senderId);
    formData.append('message', message);
    formData.append('language', 'english');
    formData.append('route', 'q');
    formData.append('numbers', mobile);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });

    const result: Fast2SMSResponse = await response.json();
    
    // Log SMS to database
    await supabase
      .from('sms_logs')
      .insert({
        customer_id: customerId,
        mobile,
        message,
        sms_type: smsType,
        status: result.return ? 'sent' : 'failed',
        response: JSON.stringify(result)
      });

    return { 
      success: result.return, 
      requestId: result.request_id,
      message: result.message 
    };
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

export const getMessageTemplate = async (templateKey: string): Promise<string> => {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', templateKey)
      .maybeSingle();
    
    return data?.value || getDefaultTemplate(templateKey);
  } catch (error) {
    console.error('Error fetching template:', error);
    return getDefaultTemplate(templateKey);
  }
};

const getDefaultTemplate = (templateKey: string): string => {
  const templates: Record<string, string> = {
    'sms_template_payment_confirmation': 'Dear {customer_name}, your EMI payment of Rs.{emi_amount} for installment {installment_number} has been received. {remaining_installments} installments remaining. Thank you! - {shop_name}',
    'sms_template_reminder': 'Dear {customer_name}, reminder: Your EMI of Rs.{emi_amount} is due on {due_date}. Please make payment on time. - {shop_name}',
    'sms_template_overdue': 'Dear {customer_name}, your EMI of Rs.{emi_amount} is overdue. Late fee of Rs.{late_fee} has been added. Please pay immediately. - {shop_name}',
    'sms_template_noc': 'Dear {customer_name}, congratulations! You have successfully completed all EMI payments for {product_name}. No Objection Certificate (NOC) is hereby issued. Thank you for your business! - {shop_name}',
    'sms_template_purchase_welcome': 'Dear {customer_name}, welcome to {shop_name}! Your purchase of {product_name} worth Rs.{total_price} has been processed. Your EMI is Rs.{emi_amount} for {tenure} months. First EMI due: {first_due_date}. Thank you!'
  };
  
  return templates[templateKey] || 'Template not found';
};

export const formatMessage = (template: string, variables: Record<string, any>): string => {
  let message = template;
  
  Object.keys(variables).forEach(key => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
  });
  
  return message;
};

export const sendPaymentConfirmationSMS = async (
  customerName: string,
  customerMobile: string,
  customerId: string,
  shopName: string,
  emiAmount: number,
  installmentNumber: number,
  remainingInstallments: number
) => {
  const template = await getMessageTemplate('sms_template_payment_confirmation');
  const message = formatMessage(template, {
    customer_name: customerName,
    shop_name: shopName,
    emi_amount: emiAmount,
    installment_number: installmentNumber,
    remaining_installments: remainingInstallments
  });
  
  return await sendSMSViaFast2SMS(customerMobile, message, customerId, 'payment_confirmation');
};

export const sendReminderSMS = async (
  customerName: string,
  customerMobile: string,
  customerId: string,
  shopName: string,
  emiAmount: number,
  dueDate: string
) => {
  const template = await getMessageTemplate('sms_template_reminder');
  const message = formatMessage(template, {
    customer_name: customerName,
    shop_name: shopName,
    emi_amount: emiAmount,
    due_date: new Date(dueDate).toLocaleDateString()
  });
  
  return await sendSMSViaFast2SMS(customerMobile, message, customerId, 'reminder');
};

export const sendOverdueSMS = async (
  customerName: string,
  customerMobile: string,
  customerId: string,
  shopName: string,
  emiAmount: number,
  lateFee: number
) => {
  const template = await getMessageTemplate('sms_template_overdue');
  const message = formatMessage(template, {
    customer_name: customerName,
    shop_name: shopName,
    emi_amount: emiAmount,
    late_fee: lateFee
  });
  
  return await sendSMSViaFast2SMS(customerMobile, message, customerId, 'overdue');
};

export const sendNOCSMS = async (
  customerName: string,
  customerMobile: string,
  customerId: string,
  shopName: string,
  productName: string
) => {
  const template = await getMessageTemplate('sms_template_noc');
  const message = formatMessage(template, {
    customer_name: customerName,
    shop_name: shopName,
    product_name: productName
  });
  
  return await sendSMSViaFast2SMS(customerMobile, message, customerId, 'noc');
};

export const sendPurchaseWelcomeSMS = async (
  customerName: string,
  customerMobile: string,
  customerId: string,
  shopName: string,
  productName: string,
  totalPrice: number,
  emiAmount: number,
  tenure: number,
  firstDueDate: string
) => {
  const template = await getMessageTemplate('sms_template_purchase_welcome');
  const message = formatMessage(template, {
    customer_name: customerName,
    shop_name: shopName,
    product_name: productName,
    total_price: totalPrice,
    emi_amount: emiAmount,
    tenure: tenure,
    first_due_date: new Date(firstDueDate).toLocaleDateString()
  });
  
  return await sendSMSViaFast2SMS(customerMobile, message, customerId, 'purchase_welcome');
};

// Automated reminder system
export const sendDailyReminders = async () => {
  try {
    // Get tomorrow's date for reminders (1 day before due)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Get shop name
    const { data: shopData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shop_name')
      .maybeSingle();
    
    const shopName = shopData?.value || 'EMI Store';

    // Get pending EMIs due tomorrow
    const { data: pendingEMIs } = await supabase
      .from('emi_schedule')
      .select(`
        *,
        purchase:purchases(
          customer_id,
          customer:customers(name, mobile)
        )
      `)
      .eq('status', 'pending')
      .eq('due_date', tomorrowStr);

    if (!pendingEMIs || pendingEMIs.length === 0) {
      console.log('No EMI reminders to send for tomorrow');
      return;
    }

    // Send reminders
    for (const emi of pendingEMIs) {
      if (emi.purchase?.customer) {
        const customer = emi.purchase.customer;
        await sendReminderSMS(
          customer.name,
          customer.mobile,
          emi.purchase.customer_id,
          shopName,
          emi.total_amount,
          emi.due_date
        );
      }
    }

    console.log(`Sent ${pendingEMIs.length} EMI reminders`);
  } catch (error) {
    console.error('Error sending daily reminders:', error);
  }
};

// Check for overdue payments and send notifications
export const sendOverdueNotifications = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get shop name and late fee settings
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['shop_name', 'late_fee_per_day']);

    const settingsMap: Record<string, string> = {};
    settings?.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    const shopName = settingsMap.shop_name || 'EMI Store';
    const lateFeePerDay = parseFloat(settingsMap.late_fee_per_day || '50');

    // Get overdue EMIs
    const { data: overdueEMIs } = await supabase
      .from('emi_schedule')
      .select(`
        *,
        purchase:purchases(
          customer_id,
          customer:customers(name, mobile)
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', today);

    if (!overdueEMIs || overdueEMIs.length === 0) {
      console.log('No overdue EMIs found');
      return;
    }

    // Send overdue notifications
    for (const emi of overdueEMIs) {
      if (emi.purchase?.customer) {
        const customer = emi.purchase.customer;
        const daysOverdue = Math.ceil(
          (new Date().getTime() - new Date(emi.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        const lateFee = daysOverdue * lateFeePerDay;

        await sendOverdueSMS(
          customer.name,
          customer.mobile,
          emi.purchase.customer_id,
          shopName,
          emi.total_amount,
          lateFee
        );

        // Update EMI with late fee
        await supabase
          .from('emi_schedule')
          .update({ 
            late_fee: lateFee,
            status: 'overdue'
          })
          .eq('id', emi.id);
      }
    }

    console.log(`Sent ${overdueEMIs.length} overdue notifications`);
  } catch (error) {
    console.error('Error sending overdue notifications:', error);
  }
};