const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("./utils/db.js");
const { closeExpiredJobs } = require('./utils/jobDeadline.js');
require('dotenv').config();

const userRoute = require("./routes/user.route.js");
const companyRoute = require("./routes/company.route.js");
const jobRoute = require("./routes/jobRoutes.js");
const applicationRoute = require("./routes/application.route.js");
const coachRoute = require("./routes/coach.route.js");
const notificationRoute = require("./routes/notification.route.js");

const app = express();

// behind Render's proxy: needed so rate limiting sees the real client IP
app.set('trust proxy', 1);

// middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
const frontendOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '').split(',')
].filter(origin => typeof origin === 'string' && origin.trim())
    .map(origin => origin.trim().replace(/\/+$/, ''));
if (process.env.NODE_ENV !== 'production') frontendOrigins.push('http://localhost:5173');

const corsOptions = {
    origin(origin, callback) {
        if (!origin || frontendOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true
};

app.use(cors(corsOptions));
const PORT = process.env.PORT || 3000;

// Brute-force protection on credentials endpoints, plus a generous global cap.
const tooMany = { message: 'Too many attempts. Please wait a few minutes and try again.', success: false };
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: tooMany });
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false, message: tooMany });
app.use('/api/', globalLimiter);
app.use('/api/v1/user/login', authLimiter);
app.use('/api/v1/user/register', authLimiter);

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// api's
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/coach", coachRoute);
app.use("/api/v1/notification", notificationRoute);

// JSON 404 + error handler so the frontend never receives an HTML error page
app.use((_req, res) => res.status(404).json({ message: "Route not found.", success: false }));
app.use((error, _req, res, _next) => {
    console.error(error);
    const status = error.message?.startsWith("Origin not allowed") ? 403 : 500;
    res.status(status).json({ message: status === 403 ? error.message : "Internal server error.", success: false });
});


const startServer = async () => {
    try {
        await connectDB();
        await closeExpiredJobs();
        setInterval(() => {
            closeExpiredJobs().catch(error => console.error('Failed to close expired jobs:', error.message));
        }, 60 * 1000);
        app.listen(PORT, () => console.log(`Server running at port ${PORT}`));
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        process.exit(1);
    }
};

startServer();
