#!/usr/bin/env node
// Minimal Cloudinary signing endpoint.
// Usage: set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your environment and run:
//   node server/cloudinary-sign.js
// This listens on port 4000 by default and exposes POST /api/sign-cloudinary

import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Please set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your environment before running this server.');
  process.exit(1);
}

app.post('/api/sign-cloudinary', (req, res) => {
  try {
    const { folder = '', filename = '' } = req.body || {};
    const timestamp = Math.round(Date.now() / 1000);

    // Build signature string with all required parameters
    const params = {
      timestamp: timestamp,
      folder: folder || undefined,
      resource_type: 'auto',
      api_key: CLOUDINARY_API_KEY
    };

    // Create the signature string from sorted parameters
    const paramStrings = Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`);
    
    const stringToSign = paramStrings.join('&') + CLOUDINARY_API_SECRET;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    res.json({
      signature,
      timestamp,
      api_key: CLOUDINARY_API_KEY,
      folder: folder || undefined,
      resource_type: 'auto'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Cloudinary signing server listening on http://localhost:${port}`));
