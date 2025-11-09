import express from 'express';
import cors from 'cors';
import fileUploadRouter from './file-storage.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Use file upload routes
app.use('/api/file-storage', fileUploadRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});