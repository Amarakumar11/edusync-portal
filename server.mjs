import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.UPLOAD_PORT || 3001;

app.use(cors());

// Ensure default upload directory exists
const defaultUploadDir = join(__dirname, 'public', 'uploads', 'misc');
if (!fs.existsSync(defaultUploadDir)) {
    fs.mkdirSync(defaultUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folder = req.params.folder || 'misc';
        const uploadDir = join(__dirname, 'public', 'uploads', folder);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const uploadHandler = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = req.params.folder || 'misc';
    // Return the path relative to public directory for the frontend to use
    const publicPath = `/uploads/${folder}/${req.file.filename}`;
    res.json({ url: publicPath });
};

app.post('/api/upload', upload.single('file'), uploadHandler);
app.post('/api/upload/:folder', upload.single('file'), uploadHandler);

app.listen(port, () => {
    console.log(`Upload server listening at http://localhost:${port}`);
});
