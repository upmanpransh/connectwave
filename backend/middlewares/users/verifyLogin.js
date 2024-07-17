const nodemailer = require("nodemailer");
const {verifyLoginHTML}=require("../../utils/emailTemplates");
const CLIENT_URL=process.env.CLIENT_URL;
const EMAIL_SERVICE=process.env.EMAIL_SERVICE;
const EmailVerification=require("../../models/email.model");

const sendLoginVerificationEmail = async(req,res)=>{
    const USER = process.env.EMAIL;
    const PASS = process.env.PASSWORD;
    const currentContextData=req.currentContextData;
    const {email,name}=req.user;
    const id=currentContextData.id;
    const verificationLink=`${CLIENT_URL}/verify-login?id=${id}&email=${email}`;
    try{
        let transporter =nodemailer.createTransport({
            service:EMAIL_SERVICE,
            auth:{
                user:USER,
                pass:PASS,
            },
        });
        let info=await transporter.sendMail({
            from:`"ConnectWave"<${USER}>`,
            to:email,
            subject:"Action Required: Verify Recent login",
            html:verifyLoginHTML(
                name,
                verificationLink,
                blockLink,
                currentContextData
            ),
        });
        const newVerification = new EmailVerification({
            email,
            verificationCode:id,
            messageId:info.messageId,
            for:"login",
        });
        await newVerification.save();
        res.status(401).json({
            message:`Access blocked due to suspicious activity. Verification email was sent to your email address.`,
        });
    }catch(err){
        console.log("Could not send email. There could be an issue with the provided credentials or the email service.");
        res.status(500).json({message:"Something wend wrong"});
    }
};

module.exports={
    sendLoginVerificationEmail,
};