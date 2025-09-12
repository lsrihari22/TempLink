import rateLimit from "express-rate-limit"

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, // IP limit => 100 requests
    message: "Too many requests from this IP, please try again later."
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 20, // IP limit => 20 uploads
    message: "Too many upload requests from this IP, please try again later."
});

const downloadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 50, // IP limit => 50 downloads
    message: "Too many download requests from this IP, please try again later."
});

export {apiLimiter, uploadLimiter, downloadLimiter}; ;