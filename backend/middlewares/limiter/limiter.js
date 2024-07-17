const rateLimit=require("express-rate-limit");
const MESSAGE="Too many requests, please try again later";

const createLimiter = (windowMs, max, message)=>{
    return rateLimit({
        windowMs,
        max,
        message:{message:message},
    });
};

const signUpSignInLimiter=createLimiter(10*60*1000,100,MESSAGE);

module.exports={
    signUpSignInLimiter,
};