const nodemailer= require("nodemailer");
const CLIENT_URL=process.env.CLIENT_URL;
const EMAIL_SERVICE=process.env.EMAIL_SERVICE;
const EmailVerfication=require("../../models/emailSchema");

const sendVerificationEmail = async(req,res)=>{
    const USER = process.env.EMAIL;
    const PASS = process.env.PASSWORD;
    const {email,name}=req.body;
    const verificationCode=Math.floor(10000+Math.random()*90000);
    const verificationLink = `${CLIENT_URL}/auth/verify?code=${verificationCode}&email=${email}`;
    try{
        let transporter = nodemailer.createTransport({
            service:EMAIL_SERVICE,
            auth:{
                user:USER,
                pass:PASS,
            },
        });
        let info=await transporter.sendMail({
            from:`"ConnectWave" <${USER}>`,
            to:email,
            subject:"Verify your email address",
            html:verifyEmailHTML(name,verificationLink,verificationCode),
        });
        const newVerification=new EmailVerfication({
            email,
            verificationCode,
            messageId:info.messageId,
            for:"signup",
        });
        await newVerification.save();
        res.status(200).json({
            message:`Verification email was successfully sent to ${email}`,
        });
    }catch(err){
        console.log(
            "Could not send verification email. There could be an issue with the provided credendtials of the email service."
        );
        res.status(500).json({message:"Something went wrong"});
    }
};

module.exports={
    sendVerificationEmail,
};