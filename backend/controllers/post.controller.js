const Community=require("../models/community.model");
const Post = require("../models/post.model");
const User=require("../models/user.model");
const Relationship=require("../models/relationship.model");
const dayjs=require("dayjs");
const Comment=require("../models/comment.model");
const formatCreatedAt = require("../utils/timeConverter");
const Report = require("../models/report.model");

const getCommunityPosts = async (req,res)=>{
    try{
        const communityId=req.params.communityId;
        const userId=req.userId;
        const {limit=10,skip=0}=req.query;
        const isMember=await Community.findOne({
            _id:communityId,
            members:userId,
        });
        if(!isMember){
            return res.status(401).json({
                message:"Unauthorized to view posts in this community",
            });
        }
        const posts=await Post.find({
            community:communityId,
        })
            .sort({
                createdAt:-1,
            })
            .populate("user","name avatar")
            .populate("community","name")
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .lean();
        const formattedPosts=posts.map((post)=>({
            ...post,
            createdAt:dayjs(post.createdAt).fromNow(),
        }));
        const totalCommunityPosts=await Post.countDocuments({
            community:communityId,
        });
        res.status(200).json({
            formattedPosts,
            totalCommunityPosts,
        });
    }catch(error){
        res.status(500).json({
            message:"Error retrieving posts",
        });
    }
};

const getSavedPosts = async(req,res)=>{
    try{
        const userId=req.userId;
        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({
                message:"User not found",
            });
        }
        const communityIds=await Community.find({members:userId}).distinct("_id");
        const savedPosts=await Post.find({
            community:{$in:communityIds},
            _id:{$in:user.savedPosts},
        })
        .populate("user","name avatar")
        .populate("community","name")

        const formattedPosts=savedPosts.map((post)=>({
            ...post.toObject(),
            createdAt:dayjs(post.createdAt).fromNow(),
        }));
        res.status(200).json(formattedPosts);
    }catch(error){
        res.status(500).json({
            message:"server error",
        });
    }
};

const getPublicPosts=async(req,res)=>{  
    try{
        const publicUserId=req.params.publicUserId;
        const currentUserId=req.userId;
        const isFollowing=await Relationship.exists({
            follower:currentUserId,
            following:publicUserId,
        });
        if(!isFollowing){
            return null;
        }
        const commonCommunityIds=await Community.find({
            members:{$all:[currentUserId,publicUserId]},
        }).distinct("_id");
        const publicPosts=await Post.find({
            community:{$in:commonCommunityIds},
            user:publicUserId,
        })
        .populate("user","_id name avatar")
        .populate("community","_id name")
        .sort("-createdAt")
        .limit(10)
        .exec();
        const formattedPosts=publicPosts.map((post)=>({
            ...post.toObject(),
            createdAt:dayjs(post.createdAt).fromNow(),
        }));
        res.status(200).json(formattedPosts);
    }catch(error){
        res.status(500).json({message:"server error"});
    }
};

const getFollowingUsersPosts = async(req,res)=>{
    try{
        const communityId=req.params.id;
        const userId=req.userId;
        const following=await Relationship.find({
            follower:userId,
        });
        const followingIds=following.map((relationship)=>relationship.following);
        const posts=await Post.find({
            user:{
                $in:followingIds,
            },
            community:communityId,
        })
        .sort({createdAt:-1,})
        .populate("user","name avatar")
        .populate("community","name")
        .limit(20)
        .lean();
        const formattedPosts=posts.map((post)=>({
            ...post,
            createdAt:dayjs(post.createdAt).fromNow(),
        }));
        res.status(200).json(formattedPosts);
    }catch(error){
        res.status(500).json({
            message:"Server error",
        });
    }
};

const getPost = async(req,res)=>{
    try{
        const postId=req.params.id;
        const userId=req.userId;
        const post=await findPostById(postId);
        if(!post){
            return res.status(404).json({message:"Post not found"});
        }
        const comments=await findCommentsByPostId(postId);

        post.comments=formatComments(comments);
        post.dateTime=formatCreatedAt(post.createdAt);
        post.createdAt=dayjs(post.createdAt).fromNow();
        post.savedByCount=await countSavedPosts(postId);
        const report=await findReportByPostAndUser(postId,userId);
        post.isReported=!!report;
        res.status(200).json(post);
    }catch(error){
        res.status(500).json({message:"Error getting post"});
    }
};

const findPostById=async(postId)=>
    await Post.findById(postId)
        .populate("user","name avatar")
        .populate("community", "name")
        .lean();

const findCommentsByPostId = async(postId)=>
    await Comment.find({post:postId})
        .sort({createdAt:-1})
        .populate("user","name avatar")
        .lean();

const formatComments=(comments)=>
    comments.map((comment)=>({
        ...comment,
        createdAt:dayjs(comment.createdAt).fromNow(),
    }));

const findReportByPostAndUser=async(postId,userId)=>
    await Report.findOne({post:postId,reportedBy:userId});

const getPosts = async(req,res)=>{
    try{
        const userId=req.userId;
        const {limit=10,skip=0}=req.query;
        const communities=await Community.find({
            members:userId,
        });
        const communityIds=communities.map((community)=>community._id);
        const posts=await Post.find({
            community:{
                $in:communityIds,
            },
        })
        .sort({createdAt:-1,})
        .populate("user","name avatar")
        .populate("community", "name")
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .lean();

        const formattedPosts=posts.map((post)=>({
            ...post,
            createdAt:dayjs(post.createdAt).fromNow(),
        }));
        const totalPosts=await Post.countDocuments({
            community:{
                $in:communityIds,
            },
        });
        res.status(200).json({
            formattedPosts,
            totalPosts,
        });
    }catch(error){
        res.status(500).json({
            message:"Error retrieving posts",
        });
    }
};

const confirmPost=async(req,res)=>{
    try{
        
    }catch(error){
        res.status(500).json({
            message:"Error publishing post",
        });
    }
};
        
module.exports={
    getCommunityPosts,
    getSavedPosts,
    getPublicPosts,
    getFollowingUsersPosts,
    getPost,
    getPosts,
};