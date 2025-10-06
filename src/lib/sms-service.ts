import { supabase } from './supabase';

interface HttpSMSResponse {
  status: string;
  data?: {
    id: string;
    from: string;
    to: string;
    content: string;
  };
  message?: string;
}

export const sendSMS = async (
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
      .in('key', ['sms_api_key', 'sms_sender_id']);

    const settingsMap: Record<string, string> = {};
    settings?.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    const apiKey = settingsMap.sms_api_key;
    const senderPhone = settingsMap.sms_sender_id;

    if (!apiKey || !senderPhone) {
      console.log(`Demo SMS to ${mobile}: ${message}`);

      // Log SMS to database
      await supabase
        .from('sms_logs')
        .insert({
          customer_id: customerId,
          mobile,
          message,
          sms_type: smsType,
          status: 'sent',
          response: 'Demo mode - SMS not actually sent'
        });

      return { success: true, demo: true };
    }

    // Send SMS via httpsms API
    const response = await fetch('https://api.httpsms.com/v1/messages/send', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        from: senderPhone,
        to: mobile,
        content: message
      })
    });

    const result: HttpSMSResponse = await response.json();

    // Log SMS to database
    await supabase
      .from('sms_logs')
      .insert({
        customer_id: customerId,
        mobile,
        message,
        sms_type: smsType,
        status: response.status === 200 ? 'sent' : 'failed',
        response: JSON.stringify(result)
      });

    return {
      success: response.status === 200,
      messageId: result.data?.id,
      result
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

export const sendTestSMS = async (mobile: string, testMessage: string) => {
  try {
    // Get SMS settings
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['sms_api_key', 'sms_sender_id']);

    const settingsMap: Record<string, string> = {};
    settings?.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    const apiKey = settingsMap.sms_api_key;
    const senderPhone = settingsMap.sms_sender_id;

    if (!apiKey || !senderPhone) {
      console.log(`Demo SMS to ${mobile}: ${testMessage}`);

      // Log test SMS to database
      await supabase
        .from('sms_logs')
        .insert({
          customer_id: null,
          mobile,
          message: testMessage,
          sms_type: 'test',
          status: 'sent',
          response: 'Demo mode - SMS not actually sent'
        });

      return { success: true, demo: true, message: 'Demo mode - SMS logged but not sent' };
    }

    // Send test SMS via httpsms API
    const response = await fetch('https://api.httpsms.com/v1/messages/send', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        from: senderPhone,
        to: mobile,
        content: testMessage
      })
    });

    const result: HttpSMSResponse = await response.json();

    // Log test SMS
    await supabase
      .from('sms_logs')
      .insert({
        customer_id: null,
        mobile,
        message: testMessage,
        sms_type: 'test',
        status: response.status === 200 ? 'sent' : 'failed',
        response: JSON.stringify(result)
      });

    return {
      success: response.status === 200,
      messageId: result.data?.id,
      message: result.status === 'success' ? 'SMS sent successfully' : result.message || 'Failed to send SMS',
      response: result
    };
  } catch (error) {
    console.error('Test SMS Error:', error);

    // Log failed test SMS
    await supabase
      .from('sms_logs')
      .insert({
        customer_id: null,
        mobile,
        message: testMessage,
        sms_type: 'test',
        status: 'failed',
        response: error instanceof Error ? error.message : 'Unknown error'
      });

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const replaceMessageVariables = (
  template: string,
  variables: Record<string, string | number>
): string => {
  let message = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), String(value));
  });
  
  return message;
};

export const sendPurchaseWelcomeSMS = async (
  customerName: string,
  customerMobile: string,
  customerId: string,
  productName: string,
  totalPrice: number,
  emiAmount: number,
  tenure: number,
  firstDueDate: string,
  shopName: string
) => {
  try {
    // Get template from settings
    const { data: templateData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'sms_template_purchase_welcome')
      .maybeSingle();

    const template = templateData?.value || 
      'Dear {customer_name}, welcome to {shop_name}! Your purchase of {product_name} worth Rs.{total_price} has been processed. EMI: Rs.{emi_amount} for {tenure} months. First EMI due: {first_due_date}. Thank you!';

    const message = replaceMessageVariables(template, {
      customer_name: customerName,
      product_name: productName,
      total_price: totalPrice,
      emi_amount: emiAmount,
      tenure: tenure,
      first_due_date: firstDueDate,
      shop_name: shopName
    });

    return await sendSMS(customerMobile, message, customerId, 'purchase_welcome');
  } catch (error) {
    console.error('Error sending purchase welcome SMS:', error);
    return { success: false, error };
  }
};

export const sendPaymentConfirmationSMS = async (
  customerName: string,
  customerMobile: string,
  customerId: string,
  emiAmount: number,
  installmentNumber: number,
  remainingInstallments: number,
  shopName: string
) => {
  try {
    // Get template from settings
    const { data: templateData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'sms_template_payment_confirmation')
      .maybeSingle();

    const template = templateData?.value || 
      'Dear {customer_name}, your EMI payment of Rs.{emi_amount} for installment {installment_number} has been received. {remaining_installments} installments remaining. Thank you! - {shop_name}';

    const message = replaceMessageVariables(template, {
      customer_name: customerName,
      emi_amount: emiAmount,
      installment_number: installmentNumber,
      remaining_installments: remainingInstallments,
      shop_name: shopName
    });

    return await sendSMS(customerMobile, message, customerId, 'payment_confirmation');
  } catch (error) {
    console.error('Error sending payment confirmation SMS:', error);
    return { success: false, error };
  }
};

export const sendPaymentReminderSMS = async (
  customerName: string,
  customerMobile: string,
  customerId: string,
  emiAmount: number,
  dueDate: string,
  shopName: string
) => {
  try {
    // Get template from settings
    const { data: templateData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'sms_template_payment_reminder')
      .maybeSingle();

    const template = templateData?.value || 
      'Dear {customer_name}, reminder: Your EMI of Rs.{emi_amount} is due on {due_date}. Please make payment on time. - {shop_name}';

    const message = replaceMessageVariables(template, {
      customer_name: customerName,
      emi_amount: emiAmount,
      due_date: dueDate,
      shop_name: shopName
    });

    return await sendSMS(customerMobile, message, customerId, 'payment_reminder');
  } catch (error) {
    console.error('Error sending payment reminder SMS:', error);
    return { success: false, error };
  }
};

export const sendOverdueNotificationSMS = async (
  customerName: string,
  customerMobile: string,
  customerId: string,
  emiAmount: number,
  lateFee: number,
  shopName: string
) => {
  try {
    // Get template from settings
    const { data: templateData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'sms_template_overdue_notice')
      .maybeSingle();

    const template = templateData?.value || 
      'Dear {customer_name}, your EMI of Rs.{emi_amount} is overdue. Late fee of Rs.{late_fee} has been added. Please pay immediately. - {shop_name}';

    const message = replaceMessageVariables(template, {
      customer_name: customerName,
      emi_amount: emiAmount,
      late_fee: lateFee,
      shop_name: shopName
    });

    return await sendSMS(customerMobile, message, customerId, 'overdue_notice');
  } catch (error) {
    console.error('Error sending overdue notification SMS:', error);
    return { success: false, error };
  }
};

export const sendNOCSMS = async (
  customerName: string,
  customerMobile: string,
  customerId: string,
  productName: string,
  shopName: string
) => {
  try {
    // Get template from settings
    const { data: templateData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'sms_template_noc')
      .maybeSingle();

    const template = templateData?.value || 
      'Dear {customer_name}, congratulations! You have successfully completed all EMI payments for {product_name}. No Objection Certificate (NOC) is hereby issued. Thank you for your business! - {shop_name}';

    const message = replaceMessageVariables(template, {
      customer_name: customerName,
      product_name: productName,
      shop_name: shopName
    });

    return await sendSMS(customerMobile, message, customerId, 'noc');
  } catch (error) {
    console.error('Error sending NOC SMS:', error);
    return { success: false, error };
  }
};

// Automated reminder system
export const sendDailyReminders = async () => {
  try {
    console.log('Running daily SMS reminders...');
    
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    // Get shop name
    const { data: shopData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shop_name')
      .maybeSingle();
    
    const shopName = shopData?.value || 'Suresh Patel Kirana EMI';

    // Get pending EMIs due tomorrow
    const { data: pendingEMIs } = await supabase
      .from('emi_schedule')
      .select(`
        *,
        purchase:purchases(
          customer:customers(*)
        )
      `)
      .eq('status', 'pending')
      .eq('due_date', tomorrowDate);

    if (!pendingEMIs || pendingEMIs.length === 0) {
      console.log('No EMIs due tomorrow');
      return;
    }

    // Send reminders
    for (const emi of pendingEMIs) {
      if (emi.purchase?.customer) {
        const customer = emi.purchase.customer;
        await sendPaymentReminderSMS(
          customer.name,
          customer.mobile,
          customer.id,
          emi.total_amount,
          new Date(emi.due_date).toLocaleDateString(),
          shopName
        );
      }
    }

    console.log(`Sent ${pendingEMIs.length} payment reminders`);
  } catch (error) {
    console.error('Error sending daily reminders:', error);
  }
};

export const sendOverdueNotifications = async () => {
  try {
    console.log('Running overdue notifications...');
    
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

    const shopName = settingsMap.shop_name || 'Suresh Patel Kirana EMI';
    const lateFeePerDay = parseFloat(settingsMap.late_fee_per_day || '50');

    // Get overdue EMIs
    const { data: overdueEMIs } = await supabase
      .from('emi_schedule')
      .select(`
        *,
        purchase:purchases(
          customer:customers(*)
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
        
        // Calculate late fee
        const dueDate = new Date(emi.due_date);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const lateFee = diffDays * lateFeePerDay;

        await sendOverdueNotificationSMS(
          customer.name,
          customer.mobile,
          customer.id,
          emi.total_amount,
          lateFee,
          shopName
        );
      }
    }

    console.log(`Sent ${overdueEMIs.length} overdue notifications`);
  } catch (error) {
    console.error('Error sending overdue notifications:', error);
  }
};