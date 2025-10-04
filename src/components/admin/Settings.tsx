import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { sendDailyReminders, sendOverdueNotifications } from '../../lib/sms-service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Settings as SettingsIcon, Save, MessageSquare, Send, TestTube } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      
      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('settings')
          .upsert({
            key,
            value,
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
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

  const testSMSReminders = async () => {
    setTestingSMS(true);
    try {
      await sendDailyReminders();
      await sendOverdueNotifications();
      alert('SMS reminders sent successfully! Check SMS logs for details.');
    } catch (error) {
      console.error('Error testing SMS:', error);
      alert('Error sending SMS reminders');
    } finally {
      setTestingSMS(false);
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
        <div className="flex space-x-3">
          <Button onClick={testSMSReminders} loading={testingSMS} variant="secondary">
            <TestTube className="w-4 h-4 mr-2" />
            Test SMS
          </Button>
          <Button onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
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
              label="Admin Mobile Number"
              value={settings.admin_mobile || ''}
              onChange={(e) => updateSetting('admin_mobile', e.target.value)}
              placeholder="9876543210"
            />
          </CardContent>
        </Card>

        {/* SMS Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold">Fast2SMS Configuration</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Fast2SMS API Key"
              type="password"
              value={settings.sms_api_key || ''}
              onChange={(e) => updateSetting('sms_api_key', e.target.value)}
              placeholder="Enter Fast2SMS API key"
            />
            <Input
              label="SMS Sender ID"
              value={settings.sms_sender_id || ''}
              onChange={(e) => updateSetting('sms_sender_id', e.target.value)}
              placeholder="EMIKIT"
            />
            <Input
              label="SMS API URL (Optional)"
              value={settings.sms_api_url || ''}
              onChange={(e) => updateSetting('sms_api_url', e.target.value)}
              placeholder="https://www.fast2sms.com/dev/bulkV2"
            />
            <Input
              label="UPI ID for Payments"
              value={settings.upi_id || ''}
              onChange={(e) => updateSetting('upi_id', e.target.value)}
              placeholder="jadhavsuresh2512@axl"
            />
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> SMS functionality is currently in demo mode. 
                Configure your SMS provider API to enable real SMS notifications.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SMS Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Send className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold">SMS Templates</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Confirmation Template
            </label>
            <textarea
              value={settings.sms_template_payment_confirmation || 'Dear {customer_name}, your EMI payment of Rs.{emi_amount} for installment {installment_number} has been received. {remaining_installments} installments remaining. Thank you! - {shop_name}'}
              onChange={(e) => updateSetting('sms_template_payment_confirmation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Payment confirmation message template"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Reminder Template
            </label>
            <textarea
              value={settings.sms_template_reminder || 'Dear {customer_name}, reminder: Your EMI of Rs.{emi_amount} is due on {due_date}. Please make payment on time. - {shop_name}'}
              onChange={(e) => updateSetting('sms_template_reminder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Payment reminder message template"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overdue Payment Template
            </label>
            <textarea
              value={settings.sms_template_overdue || 'Dear {customer_name}, your EMI of Rs.{emi_amount} is overdue. Late fee of Rs.{late_fee} has been added. Please pay immediately. - {shop_name}'}
              onChange={(e) => updateSetting('sms_template_overdue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Overdue payment message template"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NOC (Completion) Template
            </label>
            <textarea
              value={settings.sms_template_noc || 'Dear {customer_name}, congratulations! You have successfully completed all EMI payments for {product_name}. No Objection Certificate (NOC) is hereby issued. Thank you for your business! - {shop_name}'}
              onChange={(e) => updateSetting('sms_template_noc', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="NOC message template"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Welcome Template
            </label>
            <textarea
              value={settings.sms_template_purchase_welcome || 'Dear {customer_name}, welcome to {shop_name}! Your purchase of {product_name} worth Rs.{total_price} has been processed. Your EMI is Rs.{emi_amount} for {tenure} months. First EMI due: {first_due_date}. Thank you!'}
              onChange={(e) => updateSetting('sms_template_purchase_welcome', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Purchase welcome message template"
            />
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-700">
              <strong>Available Variables:</strong><br/>
              {'{customer_name}'}, {'{shop_name}'}, {'{emi_amount}'}, {'{installment_number}'}, {'{remaining_installments}'}, {'{due_date}'}, {'{late_fee}'}, {'{product_name}'}, {'{total_price}'}, {'{tenure}'}, {'{first_due_date}'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Current Configuration</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="font-semibold">{settings.sms_api_key ? 'Configured' : 'Not Configured'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};