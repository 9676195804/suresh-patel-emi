# 🔧 Setup Guide - Fixing Errors in EMI Application

## 🚨 Primary Issue: Node.js Not Installed

The main error is that **Node.js and npm are not installed** on your system. This is preventing the application from running.

### Step 1: Install Node.js

1. **Download Node.js** from [nodejs.org](https://nodejs.org/)
2. **Install the LTS version** (recommended for most users)
3. **Verify installation** by running these commands in PowerShell:

```powershell
node --version
npm --version
```

Both should show version numbers. If you see "command not found" errors, Node.js is not properly installed.

### Step 2: Install Dependencies

Once Node.js is installed, navigate to your project directory and install dependencies:

```powershell
cd c:\Users\jadhav suresh\Documents\GitHub\EMI
npm install
```

### Step 3: Set Up Environment Variables

1. **Copy the example environment file**:
```powershell
copy .env.example .env
```

2. **Edit the `.env` file** and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these values:**
- Go to your Supabase project dashboard
- Project Settings → API
- Copy the Project URL and anon key

### Step 4: Run TypeScript Check

After installing dependencies, check for TypeScript errors:

```powershell
npm run typecheck
```

### Step 5: Start the Development Server

```powershell
npm run dev
```

The application should now run on `http://localhost:5173`

## 🔍 Common Issues and Solutions

### Issue 1: "Cannot find module" errors
**Solution**: Run `npm install` to install missing dependencies

### Issue 2: "Missing Supabase environment variables"
**Solution**: Create `.env` file with your Supabase credentials

### Issue 3: Import errors (already fixed)
**Solution**: ✅ Fixed - Removed `.tsx` extension from import in `main.tsx`

### Issue 4: TypeScript compilation errors
**Solution**: Run `npm run typecheck` to identify and fix specific errors

## 🧪 Testing the Application

Once everything is set up:

1. **Start the server**: `npm run dev`
2. **Open browser**: Go to `http://localhost:5173`
3. **Check console**: Press F12 to see browser console for any errors
4. **Test SMS**: Go to Admin → Settings → Send Test SMS

## 📋 Pre-flight Checklist

Before reporting any errors, verify:

- [ ] Node.js is installed (`node --version` works)
- [ ] npm is installed (`npm --version` works)
- [ ] Dependencies installed (`npm install` completed successfully)
- [ ] Environment variables set (`.env` file exists with Supabase credentials)
- [ ] TypeScript check passes (`npm run typecheck` shows no errors)
- [ ] Development server starts (`npm run dev` works)

## 🆘 Still Getting Errors?

If you still encounter errors after following this guide:

1. **Check the browser console** (F12) for specific error messages
2. **Check the terminal** where you ran `npm run dev` for compilation errors
3. **Verify your Supabase setup** - make sure RLS policies are configured
4. **Check SMS Logs page** in the admin dashboard for SMS-related errors

**Provide these details when asking for help:**
- Exact error messages from browser console
- Output from `npm run typecheck`
- Output from `npm run dev`
- Your operating system (Windows/Mac/Linux)
- Node.js version (`node --version`)

## 🔗 Related Documentation

- [HttpSMS Setup Guide](HTTPSMS_SETUP.md) - For SMS configuration
- [Quick Start Guide](QUICK_START.md) - For testing SMS functionality
- [System Architecture](SYSTEM_ARCHITECTURE.md) - For understanding the system
- [Improvements Summary](IMPROVEMENTS_SUMMARY.md) - For recent changes made