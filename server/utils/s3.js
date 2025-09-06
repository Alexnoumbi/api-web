const fs = require('fs');
const path = require('path');

// Simple local fallback for S3-like upload/delete used in development.
// uploadToS3(file) -> returns { Location }
// deleteFromS3(url) -> removes the file if it points to the local uploads directory

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const sanitize = (name) => name.replace(/[^a-zA-Z0-9.\-_]/g, '_');

async function uploadToS3(file) {
  if (!file) throw new Error('No file provided to uploadToS3');

  const timestamp = Date.now();
  const original = file.originalname || file.filename || 'file';
  const safeName = `${timestamp}-${sanitize(original)}`;
  const destPath = path.join(UPLOADS_DIR, safeName);

  // If multer saved the file to disk, copy it. Otherwise write buffer.
  if (file.path) {
    await fs.promises.copyFile(file.path, destPath);
  } else if (file.buffer) {
    await fs.promises.writeFile(destPath, file.buffer);
  } else {
    throw new Error('File object has no path or buffer');
  }

  // Return an object similar to AWS S3 SDK response for compatibility
  return {
    Key: safeName,
    Location: `/uploads/${safeName}`
  };
}

async function deleteFromS3(url) {
  if (!url) return false;

  // Expecting urls like '/uploads/filename' or full URLs that include '/uploads/filename'
  const parsed = url.split('/uploads/').pop();
  if (!parsed) return false;

  const filename = parsed.split('?')[0];
  const filePath = path.join(UPLOADS_DIR, filename);

  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (err) {
    throw err;
  }
}

module.exports = { uploadToS3, deleteFromS3 };
