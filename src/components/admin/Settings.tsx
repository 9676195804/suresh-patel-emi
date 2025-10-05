import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          </CardContent>
        </Card>

        {/* SMS Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">SMS Configuration</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="SMS API Key"
              type="password"
              value={settings.sms_api_key || ''}
              onChange={(e) => updateSetting('sms_api_key', e.target.value)}
              placeholder="Enter SMS API key"
            />
            <Input
              label="SMS Sender ID"
              value={settings.sms_sender_id || ''}
              onChange={(e) => updateSetting('sms_sender_id', e.target.value)}
              placeholder="EMIKIT"
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};