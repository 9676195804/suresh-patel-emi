import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS
app.use(cors());

// Create uploads directory if it doesn't exist
// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Return the URL where the file can be accessed
    const fileUrl = `http://localhost:4000/uploads/${req.file.filename}`;
    res.json({ 
        url: fileUrl,
        filename: req.file.filename
    });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`File upload server running at http://localhost:${port}`);
    console.log('Upload directory: ' + path.resolve('uploads'));
});