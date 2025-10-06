# HttpSMS Integration Setup Guide

## Overview
This application uses HttpSMS API for sending SMS notifications. This guide will help you set up and debug the SMS functionality.

## Configuration

### 1. Required Settings

Navigate to **Settings** page in the Admin Dashboard and configure:

- **HttpSMS API Key**: Your API key from httpsms.com (format: `uk_xxxxx...`)
- **Sender Phone Number**: Phone number registered with HttpSMS (format: `+919293184021`)

### 2. Pre-configured Values

The system comes pre-configured with:
```
API Key: uk_2C8G719ew-bNkReJ6plBsttuoCbfi6YACKnt64q0_9W25kf39n31hAYW3Y4TqPgp
Sender Phone: +919293184021
```

## Testing SMS

### Step 1: Save Settings
1. Go to Admin Dashboard > Settings
2. Verify API Key and Sender Phone are filled
3. Click "Save Settings"
4. Wait for confirmation message

### Step 2: Send Test SMS
1. In Settings page, scroll to "Test SMS" section
2. Enter recipient mobile number with country code (e.g., `+919032195804`)
3. Enter or modify test message
4. Click "Send Test SMS"
5. Check the alert message for results

### Step 3: Check SMS Logs
1. Navigate to Admin Dashboard > SMS Logs
2. View all SMS attempts with status
3. Click on any log entry to see detailed API response
4. Filter by status: All / Sent / Failed

## Debugging

### Browser Console Logs

Open browser console (F12) and look for:

```
=== Starting Test SMS ===
Mobile: +919032195804
Message: This is a test message...

Sending TEST SMS via HttpSMS API...
{apiUrl: "https://api.httpsms.com/v1/messages/send", apiKey: "uk_2C8G71...", payload: {...}}

HttpSMS API Response Status: 200
HttpSMS API Response Headers: {...}
HttpSMS API Response Body: {...}

=== Test SMS Result ===
{success: true, messageId: "...", ...}
```

### Common Issues

#### Issue 1: Demo Mode
**Symptom**: "Test SMS logged in Demo Mode!"
**Cause**: API Key or Sender Phone not saved in settings
**Solution**:
1. Fill in both API Key and Sender Phone Number
2. Click "Save Settings" and wait for confirmation
3. Try sending test SMS again

#### Issue 2: HTTP 401 Unauthorized
**Symptom**: SMS fails with status 401
**Cause**: Invalid or expired API key
**Solution**:
1. Verify API key is correct
2. Check if key is active in httpsms.com dashboard
3. Generate new key if necessary

#### Issue 3: HTTP 403 Forbidden
**Symptom**: SMS fails with status 403
**Cause**: Sender phone not registered or not verified
**Solution**:
1. Verify sender phone is registered in httpsms.com
2. Check if phone has active subscription
3. Ensure phone number format includes country code

#### Issue 4: RLS Policy Violations
**Symptom**: "Row-level security policy" error in console
**Cause**: Database policies not allowing operations
**Solution**: Already fixed! RLS policies have been updated to allow authenticated users to:
- Insert SMS logs
- Update settings
- Read settings

## API Request Format

The application sends requests in this exact format:

```javascript
POST https://api.httpsms.com/v1/messages/send

Headers:
{
  "x-api-key": "uk_2C8G719ew-bNkReJ6plBsttuoCbfi6YACKnt64q0_9W25kf39n31hAYW3Y4TqPgp",
  "Content-Type": "application/json",
  "Accept": "application/json"
}

Body:
{
  "from": "+919293184021",
  "to": "+919032195804",
  "content": "This is a test message from Suresh Patel Kirana EMI system."
}
```

## Expected API Response

### Success Response (HTTP 200)
```json
{
  "status": "success",
  "data": {
    "id": "msg_xxxxx",
    "from": "+919293184021",
    "to": "+919032195804",
    "content": "This is a test message...",
    "timestamp": "2025-10-06T12:34:56Z"
  }
}
```

### Error Response (HTTP 4xx/5xx)
```json
{
  "status": "error",
  "message": "Error description here"
}
```

## SMS Types

The system supports these SMS types:

1. **test** - Manual test messages from Settings
2. **purchase_welcome** - Sent when new purchase is created
3. **payment_confirmation** - Sent when EMI payment is received
4. **payment_reminder** - Sent 1 day before EMI due date
5. **overdue_notice** - Sent for overdue EMIs
6. **noc** - No Objection Certificate when all EMIs are paid

## Automated SMS Schedule

- **Daily Reminders**: Run automatically at 9:00 AM for EMIs due next day
- **Overdue Notifications**: Run automatically at 10:00 AM for overdue EMIs

You can manually trigger these from Settings page using the "Trigger Daily Reminders" button.

## Verifying in HttpSMS Portal

After sending SMS:
1. Log in to https://httpsms.com
2. Navigate to Messages section
3. Check for your sent message
4. Verify delivery status

## Support

If SMS still not working after following this guide:

1. Check all console logs
2. Review SMS Logs page for API responses
3. Verify settings are saved in database
4. Ensure Supabase RLS policies are active
5. Check httpsms.com account status and credits

## Technical Details

- SMS service location: `src/lib/sms-service.ts`
- Settings component: `src/components/admin/Settings.tsx`
- SMS logs viewer: `src/components/admin/SMSLogs.tsx`
- Database table: `sms_logs` (stores all SMS attempts)
- Settings table: `settings` (stores API configuration)
