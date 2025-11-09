Cloudinary signing endpoint (local)
=================================

This small server provides a signing endpoint for Cloudinary uploads during local development.

Setup
-----

1. Install dependencies (run in project root):

```powershell
npm install express dotenv
```

2. Set your Cloudinary credentials in environment (do NOT commit these to git).

Create a `.env.local` or set environment variables in your shell:

```powershell
$env:CLOUDINARY_API_KEY="<your_api_key>"
$env:CLOUDINARY_API_SECRET="<your_api_secret>"
node server/cloudinary-sign.js
```

Or create a `.env` file in the project root with:

```
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PORT=4000
```

3. Start the server:

```powershell
npm run start-sign
```

4. In your front-end `.env` (or `.env.local`) set:

```
VITE_CLOUDINARY_SIGN_URL=http://localhost:4000/api/sign-cloudinary
```

Now the front-end helper (`src/lib/cloudinary.ts`) will call the signing endpoint and perform signed uploads.
