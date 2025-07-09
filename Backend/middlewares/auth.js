const jwt=require('jsonwebtoken');
require('dotenv').config();
const user=require('../models/User');

//auth
exports.auth=async(req,res,next)=>{
    try{
        //extract token
        const token=req.cookies.token|| req.body.token|| req.header("Authorization").replace("Bearer","");
        //if token missing
        if(!token)
        {
            return res.status(401).json(
                {
                    success:false,
                    message:"token not found",
                }
            )
        }
        //verify token using secret key
        try{
            const decode=jwt.verify(token.process.env.JWT_SECRET);//role received in token
            console.log(decode);
            req.user=decode;//role kept in req
        }
        catch(err)
        {
            return res.status(401).json(
                {
                    success:false,
                    message:"token is invalid",
                }
            )
        }

        next();
    }
    catch(err)
    {
        return res.status(401).json(
            {
                success:false,
                message:"Something went wrong while validating token",
            }
        )
    }
}

//isStudent
exports.isStudent=async(req,res,next)=>{
    try{
        if(req.user.accountType!="Student")
        {
            return res.status(401).json(
            {
                success:false,
                message:"This is a protected routes for students only",
            }
        )
        }
    }
    catch(err)
    {
        return res.status(401).json(
            {
                success:false,
                message:"User role cannot be verified",
            }
        )
    }
}

//isInstructor
exports.isInstructor=async(req,res,next)=>{
    try{
        if(req.user.accountType!="Instructor")
        {
            return res.status(401).json(
            {
                success:false,
                message:"This is a protected routes for Instructors only",
            }
        )
        }
    }
    catch(err)
    {
        return res.status(401).json(
            {
                success:false,
                message:"User role cannot be verified",
            }
        )
    }
}

//isAdmin
exports.isAdmin=async(req,res,next)=>{
    try{
        if(req.user.accountType!="Admin")
        {
            return res.status(401).json(
            {
                success:false,
                message:"This is a protected routes for Admin only",
            }
        )
        }
    }
    catch(err)
    {
        return res.status(401).json(
            {
                success:false,
                message:"User role cannot be verified",
            }
        )
    }
}