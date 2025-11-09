import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { sendTestSMS } from '../../lib/sms-service';
import { smsScheduler } from '../../lib/scheduler';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Settings as SettingsIcon, Save, MessageSquare, Send, Clock, CreditCard } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testMobile, setTestMobile] = useState('');
  const [testMessage, setTestMessage] = useState('This is a test message from SURESH PATEL EMI system.');
  const [testLoading, setTestLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      console.log('Fetching settings from database...');
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) {
        console.error('Database error fetching settings:', error);
        throw error;
      }

      console.log('Settings fetched:', data?.length, 'settings');
      const settingsMap: Record<string, string> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      
      // Pre-fill with httpsms configuration if not already set
      if (!settingsMap.sms_api_key) {
        settingsMap.sms_api_key = 'uk_2C8G719ew-bNkReJ6plBsttuoCbfi6YACKnt64q0_9W25kf39n31hAYW3Y4TqPgp';
      }
      if (!settingsMap.sms_sender_id) {
        settingsMap.sms_sender_id = '+919293184021';
      }
      if (!settingsMap.shop_name) {
        settingsMap.shop_name = 'SURESH PATEL EMI';
      }
      if (!settingsMap.default_interest_rate) {
        settingsMap.default_interest_rate = '24';
      }
      if (!settingsMap.late_fee_per_day) {
        settingsMap.late_fee_per_day = '50';
      }
      if (!settingsMap.upi_id) {
        settingsMap.upi_id = 'jadhavsuresh2512@axl';
      }
      
      // Set default SMS templates if not present
      if (!settingsMap.sms_template_purchase_welcome) {
        settingsMap.sms_template_purchase_welcome = 'Dear {customer_name}, welcome to {shop_name}! Your purchase of {product_name} worth Rs.{total_price} has been processed. EMI: Rs.{emi_amount} for {tenure} months. First EMI due: {first_due_date}. Thank you! For more details visit:- suresh-patel-emi-cfh0.bolt.host/';
      }
      if (!settingsMap.sms_template_payment_confirmation) {
        settingsMap.sms_template_payment_confirmation = 'Dear {customer_name}, your EMI payment of Rs.{emi_amount} for installment {installment_number} has been received. {remaining_installments} installments remaining. Thank you! - {shop_name}';
      }
      if (!settingsMap.sms_template_payment_reminder) {
        settingsMap.sms_template_payment_reminder = 'Dear {customer_name}, reminder: Your EMI of Rs.{emi_amount} is due on {due_date}. Please make payment on time. Pay now: {payment_link} - {shop_name}';
      }
      if (!settingsMap.sms_template_overdue_notice) {
        settingsMap.sms_template_overdue_notice = 'Dear {customer_name}, your EMI of Rs.{emi_amount} is overdue. Late fee of Rs.{late_fee} has been added. Please pay immediately. - {shop_name}';
      }
      if (!settingsMap.sms_template_noc) {
        settingsMap.sms_template_noc = 'Dear {customer_name}, congratulations! You have successfully completed all EMI payments for {product_name}. No Objection Certificate (NOC) is hereby issued. Thank you for your business! - {shop_name}';
      }
      
      // Set default shop signature if not present
      if (!settingsMap.shop_signature_url) {
        settingsMap.shop_signature_url = '';
      }
      
      console.log('Settings map created:', Object.keys(settingsMap));
      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert(`Error loading settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Starting to save settings...');

      // Validate required fields
      if (!settings.sms_api_key || !settings.sms_sender_id) {
        alert('Please fill in both SMS API Key and Sender Phone Number before saving.');
        return;
      }

      // Validate SMS template fields
      const smsTemplateKeys = [
        'sms_template_purchase_welcome',
        'sms_template_payment_confirmation',
        'sms_template_payment_reminder',
        'sms_template_overdue_notice',
        'sms_template_noc'
      ];

      for (const key of smsTemplateKeys) {
        const template = settings[key];
        if (template && template.length > 1000) {
          alert(`SMS template "${key}" is too long. Maximum 1000 characters allowed.`);
          return;
        }
      }

      // Validate phone number format
      if (settings.sms_sender_id && !settings.sms_sender_id.match(/^\+?[1-9]\d{1,14}$/)) {
        alert('Please enter a valid phone number for SMS Sender ID (e.g., +919293184021)');
        return;
      }

      // Create array of settings to upsert with proper data sanitization
      const settingsArray = Object.entries(settings).map(([key, value]) => {
        let sanitizedValue = value || '';
        
        // Sanitize SMS templates - remove any potentially harmful characters
        if (key.startsWith('sms_template_')) {
          sanitizedValue = sanitizedValue.replace(/[<>]/g, ''); // Remove HTML tags
        }
        
        return {
          key,
          value: sanitizedValue,
          updated_at: new Date().toISOString()
        };
      });

      console.log('Settings to save:', settingsArray.length);

      // Use individual upserts to avoid conflicts and provide better error handling
      let successCount = 0;
      const errors: string[] = [];
      
      for (const setting of settingsArray) {
        try {
          console.log(`Saving setting: ${setting.key}`);
          const { data, error } = await supabase
            .from('settings')
            .upsert(setting, {
              onConflict: 'key'
            })
            .select();

          if (error) {
            console.error(`Error saving setting ${setting.key}:`, error);
            errors.push(`${setting.key}: ${error.message}`);
            continue; // Continue with other settings even if one fails
          }
          
          console.log(`Successfully saved: ${setting.key}`, data);
          successCount++;
        } catch (err) {
          console.error(`Exception saving setting ${setting.key}:`, err);
          errors.push(`${setting.key}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      if (errors.length > 0) {
        console.warn(`Some settings failed to save:`, errors);
        alert(`Settings saved with warnings! (${successCount}/${settingsArray.length} settings updated)\n\nFailed settings:\n${errors.join('\n')}`);
      } else {
        console.log(`All ${successCount} settings saved successfully!`);
        alert(`Settings saved successfully! (${successCount} settings updated)`);
      }

      // Refresh settings from database to confirm
      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      alert(`Error saving settings: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTestSMS = async () => {
    if (!testMobile.trim()) {
      alert('Please enter a mobile number for testing');
      return;
    }

    // Validate phone number format
    if (!testMobile.startsWith('+')) {
      alert('Please enter phone number with country code (e.g., +919032195804)');
      return;
    }

    setTestLoading(true);
    try {
      console.log('=== Starting Test SMS ===');
      console.log('Mobile:', testMobile);
      console.log('Message:', testMessage);

      const result = await sendTestSMS(testMobile, testMessage);

      console.log('=== Test SMS Result ===', result);

      if (result.success) {
        if (result.demo) {
          alert('Test SMS logged in Demo Mode!\n\nPlease save your API Key and Sender Phone in settings first.');
        } else {
          alert(`✓ SMS sent successfully!\n\nMessage ID: ${result.messageId || 'N/A'}\nHTTP Status: ${result.httpStatus}\n\nCheck your httpsms portal to verify.`);
        }
      } else {
        const errorDetails = result.response ? JSON.stringify(result.response, null, 2) : result.error;
        alert(`✗ Failed to send SMS\n\nHTTP Status: ${result.httpStatus}\nError: ${errorDetails}\n\nPlease check:\n1. API Key is correct\n2. Sender phone is registered with httpsms\n3. Check browser console for details`);
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleTriggerReminders = async () => {
    setReminderLoading(true);
    try {
      await smsScheduler.triggerReminders();
      alert('Daily reminders triggered successfully!');
    } catch (error) {
      console.error('Error triggering reminders:', error);
      alert('Error triggering reminders');
    } finally {
      setReminderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your EMI system</p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <SettingsIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold">Business Settings</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Shop Name"
              value={settings.shop_name || ''}
              onChange={(e) => updateSetting('shop_name', e.target.value)}
              placeholder="Enter shop name"
            />
            <Input
              label="Default Interest Rate (%)"
              type="number"
              step="0.01"
              value={settings.default_interest_rate || ''}
              onChange={(e) => updateSetting('default_interest_rate', e.target.value)}
              placeholder="24.00"
            />
            <Input
              label="Late Fee per Day (₹)"
              type="number"
              step="0.01"
              value={settings.late_fee_per_day || ''}
              onChange={(e) => updateSetting('late_fee_per_day', e.target.value)}
              placeholder="50.00"
            />
            <Input
              label="UPI ID for Payments"
              value={settings.upi_id || ''}
              onChange={(e) => updateSetting('upi_id', e.target.value)}
              placeholder="jadhavsuresh2512@axl"
            />
            
            {/* Shop Signature Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Signature Image
              </label>
              <div className="flex items-center space-x-4">
                <Input
                  label="Signature Image URL"
                  value={settings.shop_signature_url || ''}
                  onChange={(e) => updateSetting('shop_signature_url', e.target.value)}
                  placeholder="https://example.com/signature.png"
                  className="flex-1"
                />
                {settings.shop_signature_url && (
                  <img 
                    src={settings.shop_signature_url} 
                    alt="Shop Signature Preview" 
                    className="w-20 h-20 object-contain border border-gray-300 rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload your shop's signature image to display on invoices and certificates
              </p>
            </div>
          </CardContent>
        </Card>



        {/* HttpSMS Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold">HttpSMS Configuration</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="HttpSMS API Key"
              type="password"
              value={settings.sms_api_key || ''}
              onChange={(e) => updateSetting('sms_api_key', e.target.value)}
              placeholder="uk_xxxxxxxxxxxxxxx"
            />
            <Input
              label="Sender Phone Number (with country code)"
              value={settings.sms_sender_id || ''}
              onChange={(e) => updateSetting('sms_sender_id', e.target.value)}
              placeholder="+919293184021"
            />
            <p className="text-xs text-gray-500">Enter the phone number registered with HttpSMS, including country code (e.g., +91 for India)</p>
          </CardContent>
        </Card>
      </div>

      {/* SMS Templates */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">SMS Templates</h3>
          <p className="text-sm text-gray-600">Customize your SMS messages. Use variables like {'{customer_name}'}, {'{emi_amount}'}, {'{shop_name}'}, etc.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Welcome SMS
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={settings.sms_template_purchase_welcome || 'Dear {customer_name}, welcome to {shop_name}! Your purchase of {product_name} worth Rs.{total_price} has been processed. EMI: Rs.{emi_amount} for {tenure} months. First EMI due: {first_due_date}. Thank you! For more details visit:- suresh-patel-emi-cfh0.bolt.host/'}
              onChange={(e) => updateSetting('sms_template_purchase_welcome', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Variables: {'{customer_name}, {product_name}, {total_price}, {emi_amount}, {tenure}, {first_due_date}, {shop_name}'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Confirmation SMS
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={settings.sms_template_payment_confirmation || 'Dear {customer_name}, your EMI payment of Rs.{emi_amount} for installment {installment_number} has been received. {remaining_installments} installments remaining. Thank you! - {shop_name}'}
              onChange={(e) => updateSetting('sms_template_payment_confirmation', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Variables: {'{customer_name}, {emi_amount}, {installment_number}, {remaining_installments}, {shop_name}'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Reminder SMS
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={settings.sms_template_payment_reminder || 'Dear {customer_name}, reminder: Your EMI of Rs.{emi_amount} is due on {due_date}. Please make payment on time. Pay now: {payment_link} - {shop_name}'}
              onChange={(e) => updateSetting('sms_template_payment_reminder', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Variables: {'{customer_name}, {emi_amount}, {due_date}, {payment_link}, {shop_name}'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overdue Notice SMS
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={settings.sms_template_overdue_notice || 'Dear {customer_name}, your EMI of Rs.{emi_amount} is overdue. Late fee of Rs.{late_fee} has been added. Please pay immediately. - {shop_name}'}
              onChange={(e) => updateSetting('sms_template_overdue_notice', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Variables: {'{customer_name}, {emi_amount}, {late_fee}, {shop_name}'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NOC (No Objection Certificate) SMS
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={settings.sms_template_noc || 'Dear {customer_name}, congratulations! You have successfully completed all EMI payments for {product_name}. No Objection Certificate (NOC) is hereby issued. Thank you for your business! - {shop_name}'}
              onChange={(e) => updateSetting('sms_template_noc', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Variables: {'{customer_name}, {product_name}, {shop_name}'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Test SMS */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Send className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold">Test SMS</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Test Mobile Number"
              value={testMobile}
              onChange={(e) => setTestMobile(e.target.value)}
              placeholder="Enter mobile number"
            />
            <div className="flex items-end">
              <Button onClick={handleTestSMS} loading={testLoading} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Send Test SMS
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Message
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>
          <div className="flex space-x-3">
            <Button onClick={handleTriggerReminders} loading={reminderLoading} variant="secondary">
              <Clock className="w-4 h-4 mr-2" />
              Test Daily Reminders
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Current Configuration</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Shop Name</p>
              <p className="font-semibold">{settings.shop_name || 'Not set'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Default Interest Rate</p>
              <p className="font-semibold">{settings.default_interest_rate || '0'}% per annum</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Late Fee</p>
              <p className="font-semibold">₹{settings.late_fee_per_day || '0'} per day</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">SMS API Status</p>
              <p className="font-semibold">{settings.sms_api_key ? '✅ Configured' : '❌ Not Set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};