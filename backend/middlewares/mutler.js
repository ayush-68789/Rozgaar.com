const multer = require("multer");

const storage = multer.memoryStorage();
const uploadOptions = { storage, limits: { fileSize: 5 * 1024 * 1024 } };
const singleUpload = multer(uploadOptions).single("file");
const parseProfileUpload = multer(uploadOptions).fields([
    { name: "file", maxCount: 1 },
    { name: "resume", maxCount: 1 }
]);

const profileUpload = (req, res, next) => {
    parseProfileUpload(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError) {
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'Each upload must be 5 MB or smaller.'
                : 'The uploaded files could not be processed. Please check the selected files and try again.';
            return res.status(400).json({ message, success: false });
        }
        return res.status(400).json({ message: 'The upload could not be processed.', success: false });
    });
};

module.exports = { singleUpload, profileUpload };
