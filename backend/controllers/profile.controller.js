const User = require("../models/user.model");
const Post = require("../models/post.model");
const Community = require("../models/community.model");
const Relationship = require("../models/relationship.model");
const dayjs = require("dayjs");
const mongoose = require("mongoose");

const getPublicUsers = async(req,res)=>{
    try{
        const userId = req.userId;
        const followingIds=await Relationship.find({follower:userId}).distinct
        ("following");
        const userIdObj=mongoose.Types.ObjectId(userId);
        const excludedIds = [...followingIds, userIdObj];
        const userToDisplay=await User.aggregate([
            {
                $match:{
                    _id:{$nin:excludedIds},
                    role:{$ne:"moderator"},
                },
            },
            {
                $project:{
                    _id:1,
                    name:1,
                    avatar:1,
                    location:1,
                },
            },
            {
                $lookup:{
                    from:"relationships",
                    localField:"_id",
                    foreignField:"following",
                    as:"followers",
                },
            },
            {
                $project:{
                    _id:1,
                    name:1,
                    avatar:1,
                    location:1,
                    followerCount:{$size:"$followers"},
                },
            },
            {
                $sort:{followerCount:-1},
            },
            {
                $limit:5,
            },
        ]);
        res.status(200).json(userToDisplay);

    }catch(err){
        res.status(500).json({message:"An error occurred"});
    }
};

const getPublicUser = async (req,res)=>{
    try{
        const currentUserId=req.userId;
        const id=req.params.id;
        const user=await User.findById(id).select(
            "-password -email -savedPosts -updatedAt"
        );
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const totalPosts=await Post.countDocuments({user:user._id});
        const communities = await Community.find({members:user._id})
            .select("name")
            .lean();
        const currentUserCommunities= await Community.find({
            members:currentUserId,
        })
            .select("_id name")
            .lean();
        const userCommunities = await Community.find({members:user._id})
            .select("_id name")
            .lean();

        const commonCommunities = currentUserCommunities.filter((comm)=>{
            return userCommunities.some((userComm)=>userComm._id.equals(comm._id));
        });
        const isFollowing = await Relationship.findOne({
            follower:currentUserId,
            following:user._id,
        });
        const followingSince = isFollowing ? dayjs(isFollowing.createdAt).format("MMM D, YYYY"):null;

        const last30Days = dayjs().subtract(30,"day").toDate();
        const postLast30Days = await Post.aggregate([
            {$match:{user:user._id,createdAt:{$gte:last30Days}}},
            {$count:"total"},
        ]);
        const totalPostsLast30Days=postLast30Days.length>0?postLast30Days[0].total:0;

        const responseData={
            name :user.name,
            avatar:user.avatar,
            location:user.location,
            bio:user.bio,
            role:user.role,
            interests:user.interests,
            totalPosts,
            communities,
            totalCommunities:communities.length,
            joinedOn:dayjs(user.createdAt).format("MMM D, YYYY"),
            totalFollowing:user.following?.length,
            totalFollowers:usr.followers?.length,
            isFollowing:!!isFollowing,
            followingSince,
            postLast30Days:totalPostsLast30Days,
            commonCommunities,
        };

        res.status(200).json(responseData);


    }catch(err){
        res.status(500).json({
            message:"Some error occurred while retrieving the user",
        });
    }
};

const getModProfile = async(req,res)=>{
    try{
        const moderator = await User.findById(req.userId);
        if(!moderator){
            return res.status(404).json({
                message:"user not found",
            });
        }
        const moderatorInfo ={
            ...moderator._doc,
        };
        delete moderatorInfo.password;
        moderatorInfo.createdAt=moderatorInfo.createdAt.toLocaleString();
        res.status(200).json({
            moderatorInfo,
        });
    }catch(err){
        res.status(500).json({
            message:"Internal server error",
        });
    }
};

const getFollowingUsers = async(req,res)=>{
    try{
        const relationships = await Relationship.find({
            follower:req.userId,    
        }).populate("following","_id name avatar location").lean();

        const followingUsers=relationships.map((relationship)=>({
            ...relationship.following,followingSince:relationship.createdAt,
        })).sort((a,b)=>b.followingSince-a.followingSince);
        res.status(200).json(followingUsers);
    }catch(err){
        res.status(500).json({
            message:"some error occurred while retrieving the following users",
        });
    }
};

module.exports={
    getPublicUser,
    getPublicUsers,
    getModProfile,
    getFollowingUsers,
};