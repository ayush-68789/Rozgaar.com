const { User } = require("../models/user.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDataUri } = require("../utils/datauri.js");
const { cloudinary } = require("../utils/cloudinary.js");
const { generateAndStoreJobRecommendations } = require('../utils/jobRecommendations.js');
const path = require('path');

const isResumeFile = (file) => file && [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
].includes(file.mimetype);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const uploadResume = async (resume) => {
    if (!isResumeFile(resume)) throw new Error('Upload a PDF, DOC, or DOCX resume.');
    const fileUri = getDataUri(resume);
    const extension = path.extname(resume.originalname).toLowerCase();
    const baseName = path.basename(resume.originalname, extension).replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 90) || 'resume';
    const result = await cloudinary.uploader.upload(fileUri.content, {
        resource_type: 'raw',
        folder: 'rozgaar/resumes',
        public_id: `${baseName}-${Date.now()}${extension}`
    });
    return { resumeUrl: result.secure_url, resumeName: resume.originalname };
};

const downloadResume = async (req, res) => {
    try {
        const requestedUrl = new URL(req.query.url || '');
        const cloudName = cloudinary.config().cloud_name;
        const allowedPath = `/${cloudName}/raw/upload/`;
        if (requestedUrl.protocol !== 'https:' || requestedUrl.hostname !== 'res.cloudinary.com' || !requestedUrl.pathname.startsWith(allowedPath)) {
            return res.status(400).json({ message: 'Invalid resume URL.', success: false });
        }

        // Older records may contain a failed fl_attachment transformation segment.
        requestedUrl.pathname = requestedUrl.pathname.replace(/\/raw\/upload\/fl_attachment:[^/]+\//, '/raw/upload/');
        const upstream = await fetch(requestedUrl.toString());
        if (!upstream.ok) {
            return res.status(502).json({ message: 'The resume file could not be retrieved.', success: false });
        }

        const fileBuffer = Buffer.from(await upstream.arrayBuffer());
        if (fileBuffer.length > 10 * 1024 * 1024) {
            return res.status(413).json({ message: 'The resume file is too large to download.', success: false });
        }

        const filename = String(req.query.filename || 'resume.pdf').replace(/[\\/\r\n\0]/g, '_').slice(0, 180);
        const fallbackName = filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'resume.pdf';
        const contentTypes = { '.pdf': 'application/pdf', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
        const extension = filename.match(/\.[^.]+$/)?.[0]?.toLowerCase() || '.pdf';
        res.setHeader('Content-Type', contentTypes[extension] || 'application/octet-stream');
        res.setHeader('Content-Length', fileBuffer.length);
        res.setHeader('Content-Disposition', `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
        return res.status(200).send(fileBuffer);
    } catch (error) {
        console.error('Resume download failed:', error);
        return res.status(500).json({ message: 'Unable to download this resume.', success: false });
    }
};

const isProduction = process.env.NODE_ENV === 'production';
const authCookieOptions = {
    maxAge: 1 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/'
};
const authCookieClearOptions = {
    httpOnly: true,
    sameSite: authCookieOptions.sameSite,
    secure: authCookieOptions.secure,
    path: '/'
};

const getCurrentUser = async (req, res) => {
    try {
        const userRecord = await User.findById(req.id);
        if (!userRecord) {
            return res.status(404).json({ message: "User not found.", success: false });
        }
        const user = {
            _id: userRecord._id,
            fullname: userRecord.fullname,
            email: userRecord.email,
            phoneNumber: userRecord.phoneNumber,
            role: userRecord.role,
            profile: userRecord.profile
        };
        return res.status(200).json({ user, success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to restore session.", success: false });
    }
};

const register = async (req, res) => {
    try {
        const { fullname, phoneNumber, password, role } = req.body;
        const email = String(req.body.email || '').trim().toLowerCase();

        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        if (!EMAIL_PATTERN.test(email)) {
            return res.status(400).json({ message: 'Enter a valid email address.', success: false });
        }
        if (String(password).length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`, success: false });
        }
        if (!['student', 'recruiter'].includes(role)) {
            return res.status(400).json({ message: 'Choose a valid account type.', success: false });
        }
        const file = req.files?.file?.[0];
        const resume = req.files?.resume?.[0];
        if (resume && role !== 'student') {
            return res.status(400).json({ message: 'Resume upload is available for candidate accounts.', success: false });
        }
        if (resume && !isResumeFile(resume)) {
            return res.status(400).json({ message: 'Upload a PDF, DOC, or DOCX resume.', success: false });
        }

        // Check for an existing account BEFORE uploading anything, so failed sign-ups don't leave orphaned files in Cloudinary.
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exist with this email.',
                success: false,
            })
        }

        let profilePhoto = "";
        if (file) {
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            profilePhoto = cloudResponse.secure_url;
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const profile = { profilePhoto };
        if (resume) Object.assign(profile, await uploadResume(resume));

        const newUser = await User.create({
            fullname: String(fullname).trim(),
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile
        });

        const tokenData = {
            userId: newUser._id
        }
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        const user = {
            _id: newUser._id,
            fullname: newUser.fullname,
            email: newUser.email,
            phoneNumber: newUser.phoneNumber,
            role: newUser.role,
            profile: newUser.profile
        }

        return res.status(201).cookie("token", token, authCookieOptions).json({
            message: "Account created successfully.",
            user,
            success: true
        });
    } catch (error) {
        console.error('Registration failed:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'An account already exists with this email.', success: false });
        }
        const isInvalidInput = error.name === 'ValidationError' || error.name === 'CastError';
        const message = isInvalidInput
            ? 'Please check your details and try again.'
            : process.env.NODE_ENV === 'production'
                ? 'Unable to create your account. Please try again.'
                : `Unable to create your account: ${error.message}`;
        return res.status(isInvalidInput ? 400 : 500).json({ message, success: false });
    }
}

const login = async (req, res) => {
    try {
        const { password, role } = req.body;
        const email = String(req.body.email || '').trim().toLowerCase();

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        };
        // check role is correct or not
        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with current role.",
                success: false
            })
        };

        const tokenData = {
            userId: user._id
        }
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).cookie("token", token, authCookieOptions).json({
            message: `Welcome back ${user.fullname}`,
            user,
            success: true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Unable to log in. Please try again.', success: false });
    }
}

const logout = async (req, res) => {
    try {
        return res.status(200).clearCookie("token", authCookieClearOptions).json({
            message: "Logged out successfully.",
            success: true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Unable to log out. Please try again.', success: false });
    }
}

const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;
        
        const file = req.files?.file?.[0];
        const resume = req.files?.resume?.[0];
        if (resume && !isResumeFile(resume)) {
            return res.status(400).json({ message: 'Upload a PDF, DOC, or DOCX resume.', success: false });
        }
        const userId = req.id; // middleware authentication
        let user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({
                message: "User not found.",
                success: false
            })
        }
        // updating data
        if(fullname) user.fullname = fullname.trim()
        if(email) {
            const nextEmail = email.trim().toLowerCase();
            if (!EMAIL_PATTERN.test(nextEmail)) {
                return res.status(400).json({ message: 'Enter a valid email address.', success: false });
            }
            if (nextEmail !== user.email) {
                const emailTaken = await User.exists({ email: nextEmail, _id: { $ne: user._id } });
                if (emailTaken) return res.status(409).json({ message: 'That email is already used by another account.', success: false });
            }
            user.email = nextEmail;
        }
        if(phoneNumber) user.phoneNumber = phoneNumber
        if(bio !== undefined) user.profile.bio = bio
        let skillsChanged = false;
        if(skills !== undefined) {
            const nextSkills = (skills || '').split(',').map(skill => skill.trim()).filter(Boolean);
            skillsChanged = JSON.stringify(nextSkills) !== JSON.stringify(user.profile.skills || []);
            user.profile.skills = nextSkills;
        }

        // profile photo upload
        if(file){
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            user.profile.profilePhoto = cloudResponse.secure_url;
        }

        if (resume) {
            if (user.role !== 'student') return res.status(400).json({ message: 'Only candidates can add a resume.', success: false });
            Object.assign(user.profile, await uploadResume(resume));
            user.profile.jobRecommendations = [];
            user.profile.jobRecommendationsUpdatedAt = null;
            user.profile.jobRecommendationsSource = null;
        }

        await user.save();
        if (skillsChanged && user.role === 'student') {
            try { await generateAndStoreJobRecommendations(user); }
            catch (error) { console.error('Could not refresh saved job suggestions:', error.message); }
        }

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).json({
            message:"Profile updated successfully.",
            user,
            success:true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Unable to update your profile. Please try again.', success: false });
    }
}

const PROFILE_RECORD_FIELDS = {
    projects: ['title', 'link', 'description', 'skills'],
    education: ['institution', 'degree', 'fieldOfStudy', 'location', 'startDate', 'endDate', 'current', 'description'],
    experience: ['title', 'company', 'location', 'employmentType', 'startDate', 'endDate', 'current', 'description'],
    achievements: ['title', 'organization', 'date', 'description', 'link'],
    certificates: ['title', 'organization', 'date', 'description', 'link']
};

const PROFILE_RECORD_LIMITS = {
    title: 120, institution: 160, degree: 120, fieldOfStudy: 120, company: 160,
    organization: 160, location: 120, employmentType: 80, startDate: 30, endDate: 30,
    date: 30, description: 1200, link: 500
};

const cleanProfileRecord = (section, record) => {
    const clean = {};
    for (const field of PROFILE_RECORD_FIELDS[section]) {
        const value = record[field];
        if (field === 'current') {
            clean.current = value === true || value === 'true';
        } else if (field === 'skills') {
            const skills = Array.isArray(value) ? value : String(value || '').split(',');
            clean.skills = [...new Set(skills.map(skill => String(skill).trim().slice(0, 60)).filter(Boolean))].slice(0, 20);
        } else {
            clean[field] = String(value || '').trim().slice(0, PROFILE_RECORD_LIMITS[field] || 120);
        }
    }
    return clean;
};

const updateProfileRecords = async (req, res) => {
    try {
        const { section } = req.params;
        if (!Object.hasOwn(PROFILE_RECORD_FIELDS, section)) {
            return res.status(404).json({ message: 'Profile section not found.', success: false });
        }
        if (!Array.isArray(req.body?.records) || req.body.records.length > 20) {
            return res.status(400).json({ message: 'Submit up to 20 profile entries at a time.', success: false });
        }

        const requiredField = section === 'education' ? 'institution' : 'title';
        const records = req.body.records.filter(record => record && typeof record === 'object').map(record => cleanProfileRecord(section, record));
        for (const record of records) {
            const hasAnyValue = Object.values(record).some(value => Array.isArray(value) ? value.length > 0 : Boolean(value));
            if (hasAnyValue && !record[requiredField]) {
                return res.status(400).json({ message: `Every entry needs a ${requiredField === 'title' ? 'title' : 'institution'}.`, success: false });
            }
            for (const field of ['link']) {
                if (!record[field]) continue;
                try {
                    if (new URL(record[field]).protocol !== 'https:') throw new Error('Invalid protocol');
                } catch {
                    return res.status(400).json({ message: 'Links must be valid HTTPS URLs.', success: false });
                }
            }
        }

        const user = await User.findById(req.id);
        if (!user) return res.status(404).json({ message: 'User not found.', success: false });
        user.profile[section] = records.filter(record => record[requiredField]);
        await user.save();

        const publicUser = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };
        return res.status(200).json({ user: publicUser, records: user.profile[section], success: true, message: 'Profile section updated.' });
    } catch (error) {
        console.error('Profile section update failed:', error);
        return res.status(500).json({ message: 'Unable to save this profile section.', success: false });
    }
};

module.exports = { register, login, logout, updateProfile, updateProfileRecords, getCurrentUser, downloadResume };
