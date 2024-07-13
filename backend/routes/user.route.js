const decodeToken = require("../middlewares/auth/decodeToken");
const passport = require("passport");
const useragent= require("express-useragent");
const requestIp = require("request-ip");
const requireAuth= passport.authenticate("jwt",{session:false},null);

const router = require("express").Router();

router.get("/public-users/:id",requireAuth,decodeToken,getPublicUser);
router.get("/public-users",requireAuth,decodeToken,getPublicUser);
router.get("/moderator",requireAuth,decodeToken,getModProfile);
router.get("/following",requireAuth,decodeToken,getFollowingUsers);
router.get("/:id",requireAuth,getUser);
router.post("/signup",signUpSignInLimiter,avatarUpload,addUserValidator,addUserValidatorHandler,addUser,sendVerificationEmail);
router.post("/refresh-token",refreshToken);
router.post("/signin",signUpSignInLimiter,requestIp.mw(),useragent.express(),signin,sendLoginVerificationEmail);
router.post("/logout",logout);
router.put("/:id",requireAuth,decodeToken,updateInfo);
router.use(followLimiter);
router.patch("/:id/follow",requireAuth,decodeToken,followUser);
router.patch("/:id/unfollow",requireAuth,decodeToken,unfollowUser);

module.exports=router;
