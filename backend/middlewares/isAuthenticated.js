const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model.js");

const authCookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
};

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
            })
        }
        const decode = await jwt.verify(token, process.env.SECRET_KEY);
        if(!decode){
            return res.status(401).json({
                message:"Invalid token",
                success:false
            })
        };
        req.id = decode.userId;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).clearCookie("token", authCookieOptions).json({
            message: "Session expired. Please log in again.",
            success: false,
        });
    }
}

const isRecruiter = async (req, res, next) => {
    try {
        const user = await User.findById(req.id).select('role');
        if (!user || user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Recruiter access is required.', success: false });
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Unable to verify recruiter access.', success: false });
    }
};

module.exports = { isAuthenticated, isRecruiter };
