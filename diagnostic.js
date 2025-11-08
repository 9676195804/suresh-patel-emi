#!/usr/bin/env node

/**
 * Diagnostic script to check for common issues in the EMI application
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 EMI Application Diagnostic Tool');
console.log('=====================================\n');

// Check Node.js version
console.log('1. Node.js Version:');
try {
  console.log(`   ✅ Node.js ${process.version} is installed`);
} catch (error) {
  console.log('   ❌ Node.js is not installed');
  console.log('   📥 Please install Node.js from https://nodejs.org/');
  process.exit(1);
}

// Check if package.json exists
console.log('\n2. Package.json Check:');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('   ✅ package.json found');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`   📦 Project: ${packageJson.name}`);
  console.log(`   📋 Scripts available: ${Object.keys(packageJson.scripts).join(', ')}`);
} else {
  console.log('   ❌ package.json not found');
}

// Check if node_modules exists
console.log('\n3. Dependencies Check:');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✅ node_modules directory found');
  console.log('   📁 Dependencies appear to be installed');
} else {
  console.log('   ❌ node_modules directory not found');
  console.log('   📥 Run: npm install');
}

// Check environment variables
console.log('\n4. Environment Variables Check:');
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file found');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY');
  
  if (hasSupabaseUrl && hasSupabaseKey) {
    console.log('   ✅ Supabase environment variables present');
  } else {
    console.log('   ⚠️  Supabase environment variables may be missing');
    console.log('   📝 Check .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
} else if (fs.existsSync(envExamplePath)) {
  console.log('   ⚠️  .env file not found but .env.example exists');
  console.log('   📋 Copy .env.example to .env and fill in your values');
  console.log('   📄 Run: copy .env.example .env');
} else {
  console.log('   ❌ No .env file found');
  console.log('   📋 Create a .env file with your Supabase credentials');
}

// Check for common import issues
console.log('\n5. Import Statement Check:');
const mainTsxPath = path.join(__dirname, 'src', 'main.tsx');
if (fs.existsSync(mainTsxPath)) {
  const mainContent = fs.readFileSync(mainTsxPath, 'utf8');
  if (mainContent.includes("import App from './App.tsx'")) {
    console.log('   ❌ Found incorrect import with .tsx extension');
    console.log('   🔧 Fix: Change "import App from \'./App.tsx\'" to "import App from \'./App\'"');
  } else {
    console.log('   ✅ Import statements appear correct');
  }
}

// Check TypeScript configuration
console.log('\n6. TypeScript Configuration:');
const tsconfigPath = path.join(__dirname, 'tsconfig.json');
const tsconfigAppPath = path.join(__dirname, 'tsconfig.app.json');

if (fs.existsSync(tsconfigPath) && fs.existsSync(tsconfigAppPath)) {
  console.log('   ✅ TypeScript configuration files found');
} else {
  console.log('   ❌ Missing TypeScript configuration files');
}

// Check Vite configuration
console.log('\n7. Vite Configuration:');
const viteConfigPath = path.join(__dirname, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  console.log('   ✅ vite.config.ts found');
} else {
  console.log('   ❌ vite.config.ts not found');
}

// Check key directories
console.log('\n8. Directory Structure Check:');
const keyDirs = ['src', 'src/components', 'src/lib', 'src/types', 'supabase/migrations'];
keyDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`   ✅ ${dir} exists`);
  } else {
    console.log(`   ❌ ${dir} missing`);
  }
});

console.log('\n🎯 Summary:');
console.log('==========');
console.log('If you see any ❌ items above, follow the suggested fixes.');
console.log('Once all checks pass, run: npm run dev');
console.log('\n📚 Next Steps:');
console.log('1. Install Node.js if not already installed');
console.log('2. Run: npm install');
console.log('3. Set up .env file with Supabase credentials');
console.log('4. Run: npm run dev');
console.log('\n📖 For detailed setup instructions, see: SETUP_GUIDE.md');