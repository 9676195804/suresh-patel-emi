# Quick Start Guide - HttpSMS Testing

## 🚀 Fast Track to Test SMS

### Step 1: Login (30 seconds)
1. Open application
2. Click "Admin Portal"
3. Login with admin credentials
4. You'll see the dashboard

### Step 2: Configure Settings (1 minute)
1. Click **"Settings"** in navigation
2. Scroll to **"HttpSMS Configuration"**
3. Verify these are filled:
   - **API Key**: `uk_2C8G719ew-bNkReJ6plBsttuoCbfi6YACKnt64q0_9W25kf39n31hAYW3Y4TqPgp`
   - **Sender Phone**: `+919293184021`
4. Click **"Save Settings"** (top right)
5. Wait for success message

### Step 3: Send Test SMS (30 seconds)
1. Still on Settings page, scroll to **"Test SMS"** section
2. Enter mobile number: `+919032195804` (or your number)
3. Click **"Send Test SMS"**
4. Check alert message for result

### Step 4: Verify Results (1 minute)

#### Option A: Check SMS Logs (In App)
1. Click **"SMS Logs"** in navigation
2. You'll see your test SMS at the top
3. Click it to see full details including API response

#### Option B: Check Browser Console
1. Press F12 to open console
2. Look for logs showing:
   ```
   === Starting Test SMS ===
   Sending TEST SMS via HttpSMS API...
   HttpSMS API Response Status: 200
   === Test SMS Result ===
   ```

#### Option C: Check HttpSMS Portal
1. Go to https://httpsms.com
2. Login to your account
3. Check Messages section
4. Look for your message

---

## 🐛 Quick Troubleshooting

### ❌ "Demo Mode" Message
**Fix**: Settings not saved
1. Go to Settings
2. Fill API Key and Phone
3. Click Save Settings
4. Try again

### ❌ HTTP 401 Error
**Fix**: Invalid API key
1. Verify API key is correct
2. Check if active in httpsms.com
3. Update in Settings if needed

### ❌ HTTP 403 Error
**Fix**: Phone not registered
1. Verify sender phone in httpsms.com
2. Check phone has active subscription
3. Ensure format: +[country code][number]

### ❌ "Row-level security" Error
**Fix**: Already fixed! But if you see it:
1. Check if you're logged in as admin
2. Try logout and login again
3. Verify database migration ran

---

## 📊 What Success Looks Like

### Console Output (Success)
```
Sending TEST SMS via HttpSMS API...
{apiUrl: "https://api.httpsms.com/v1/messages/send", ...}

HttpSMS API Response Status: 200
HttpSMS API Response Body: {"status":"success","data":{...}}

=== Test SMS Result ===
{success: true, messageId: "msg_xxxxx", httpStatus: 200}
```

### Alert Message (Success)
```
✓ SMS sent successfully!

Message ID: msg_xxxxx
HTTP Status: 200

Check your httpsms portal to verify.
```

### SMS Logs Entry (Success)
- Status badge: **Green "Sent"**
- Type badge: **Purple "test"**
- Response shows: HTTP 200 with message ID

---

## 🎯 Expected Timeline

From starting app to verified SMS:
- **Total Time**: ~3-5 minutes
- Login: 30 sec
- Save Settings: 1 min
- Send Test SMS: 30 sec
- Verify Results: 1-2 min
- Check Portal: 1 min

---

## 📱 Phone Number Format

✅ **CORRECT**
- `+919032195804`
- `+919293184021`
- `+1234567890`

❌ **WRONG**
- `9032195804` (missing country code)
- `919032195804` (missing +)
- `+91 903 219 5804` (has spaces)

---

## 💡 Pro Tips

1. **Keep Console Open**: Press F12 before testing to see all logs
2. **Check SMS Logs**: Use the SMS Logs page for debugging
3. **Test with Your Number**: Send to your phone to verify delivery
4. **Save Settings First**: Always save settings before sending SMS
5. **Verify in Portal**: Check httpsms.com to confirm API is working

---

## 📖 Need More Help?

- **Detailed Setup**: Read `HTTPSMS_SETUP.md`
- **All Changes**: Read `IMPROVEMENTS_SUMMARY.md`
- **In-App Help**: Check SMS Logs for detailed API responses

---

## ✅ Success Checklist

Before reporting issues, verify:
- [ ] Admin logged in successfully
- [ ] Settings saved with success message
- [ ] Test phone includes country code (+)
- [ ] Browser console is open (F12)
- [ ] Checked SMS Logs page
- [ ] Verified API key is active
- [ ] Confirmed sender phone in httpsms.com

If all checked and still failing, review console logs and SMS Logs page for specific error details.
