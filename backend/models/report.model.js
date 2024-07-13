const mongoose = require("mongoose");
const Schema= mongoose.Schema;
const reportSchema= new Schema({
    post:{
        type:Schema.Types.ObjectId,
        ref:"Post",
        required:true,
    },
    community:{
        type:Schema.Types.ObjectId,
        ref:"Community",
        required:true,
    },
    reportedBy:[
        {
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
    ],
    reportReason:{
        type:String,
        required:true,
    },
    reportDate:{
        type:Date,
        default:Date.now,
    },
});

module.exports=mongoose.model("Report",reportSchema);