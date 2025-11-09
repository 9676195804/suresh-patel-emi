# Local Storage Migration

This guide explains how to migrate from Cloudinary to local file storage.

## Setup

1. Install dependencies if not already installed:
```bash
npm install express cors multer
```

2. Create required directories:
```bash
mkdir uploads
```

3. Update environment variables:
- Remove all Cloudinary-related environment variables
- Add SERVER_URL if needed (defaults to http://localhost:4000)

## Running the Server

1. Start the file storage server:
```bash
node server/index.js
```

2. Start the development server:
```bash
npm run dev
```

## Storage Location

Files are stored in the `uploads` directory in the project root. Make sure this directory has appropriate permissions.

## Backup Considerations

Since files are stored locally:
1. Regularly backup the `uploads` directory
2. Consider setting up a cron job for automated backups
3. Monitor disk space usage

## Security Notes

1. The server includes basic file validation:
   - Only allows image files
   - 5MB file size limit
   - Generates unique filenames

2. Additional security measures to consider:
   - Implement user authentication for uploads
   - Add virus scanning
   - Set up rate limiting