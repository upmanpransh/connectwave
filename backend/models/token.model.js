const mongoose= require("mongoose");

const tokenSchema= new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    refreshToken:{
        type:String,
        required:true,
    },
    accessToken:{
        type:String,
        required:true,
    },
    createdAT:{
        type:Date,
        default:Date.now,
        expired:6*60*60,
    },
});
module.exports=mongoose.model("Token",tokenSchema);