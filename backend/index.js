const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { connectDB } = require("./utils/db.js");
const { closeExpiredJobs } = require('./utils/jobDeadline.js');
require('dotenv').config();

const userRoute = require("./routes/user.route.js");
const companyRoute = require("./routes/company.route.js");
const jobRoute = require("./routes/jobRoutes.js");
const applicationRoute = require("./routes/application.route.js");

const app = express();

// middleware
app.use(express.json());
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
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// api's
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);


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
