const path = require('path');
const { cloudinary } = require('./cloudinary.js');

const MAX_BYTES = 10 * 1024 * 1024;

// Downloads the candidate's stored resume (Cloudinary only) and returns plain text.
const getResumeText = async (profile = {}) => {
    const { resumeUrl, resumeName } = profile;
    if (!resumeUrl) throw new Error('NO_RESUME');

    const url = new URL(resumeUrl);
    const cloudName = cloudinary.config().cloud_name;
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || (cloudName && !url.pathname.startsWith(`/${cloudName}/`))) {
        throw new Error('INVALID_RESUME_URL');
    }

    const upstream = await fetch(url.toString());
    if (!upstream.ok) throw new Error('RESUME_FETCH_FAILED');
    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.length > MAX_BYTES) throw new Error('RESUME_TOO_LARGE');

    const extension = (path.extname(resumeName || '') || path.extname(url.pathname)).toLowerCase();
    let text = '';
    if (extension === '.pdf') {
        const pdfParse = require('pdf-parse/lib/pdf-parse.js');
        text = (await pdfParse(buffer)).text;
    } else if (extension === '.docx') {
        const mammoth = require('mammoth');
        text = (await mammoth.extractRawText({ buffer })).value;
    } else {
        throw new Error('UNSUPPORTED_RESUME_TYPE');
    }
    text = text.replace(/\u0000/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length < 40) throw new Error('RESUME_UNREADABLE');
    return text.slice(0, 12000);
};

module.exports = { getResumeText };
