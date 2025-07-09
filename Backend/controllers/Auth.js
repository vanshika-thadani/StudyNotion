const User=require('../models/User');
const OTP=require('../models/OTP');
const otpGenerator=require('otp-generator');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
require('dotenv').config();


//sendOTP before signup(jab tak otp not verified sign up ni hoga)
exports.sendOTP=async(req,res)=>{
    try{
        //fetch email from req body
        const {email}=req.body;

        //check if user already exist
        const checkUserExist=await User.find({email});
        if(checkUserExist)
        {
            return res.status(401).json(
            {
                success:false,
                message:"User already registered",
            }
            )
        }
        //installed package otp-generator
        var otp=otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });

        //make sure otp generated is unique
        let result=await OTP.findOne({otp:otp});

        while(result)
        {
            otp=otpGenerator.generate(6,
                {
                    upperCaseAlphabets:false,
                    lowerCaseAlphabets:false,
                    specialChars:false,
                }
            )
            result=await OTP.findOne({otp:otp});
        }


        //store unique otp in db
        const otpPayload={email,otp};//took from model didn't took createdAt because it is byDefualt
        const otpBody=await OTP.create(otpPayload);

        //return response successful
        res.status(200).json(
            {
                success:true,
                message:"OTP sent successfully",
            }
        );

    }
    catch(err)
    {
        console.log(err);
        res.status(500).json(
            {
                success:false,
                message:err.message,
            }
        );
    }
}

//sign up handler
exports.signUp=async(req,res)=>{
    try{
        //data fetch from req.body
    const {firstName,lastName,email,password,confirmPassword,accountType,contactNumber,otp}=req.body;

    //data validation
    if(!firstName || !lastName || !email || !password || !confirmPassword || !contactNumber || !otp)
    {
        return res.status(403).json(
            {
                success:false,
                message:"All fields are required",
            }
        )
    }
    //match password and confirm password
    if(password != confirmPassword)
    {
        return res.status(400).json(
            {
                success:false,
                message:"Passwords do not match.Try again",
            }
        )
    }
    //check userExist or not
    const existingUser=await User.findOne({email});
    if(existingUser)
    {
        return res.status(400).json(
            {
                success:false,
                message:"User already registered",
            }
        )
    }
    //find most recent otp for the user(might be possible generated many a times)
    const recentOtp=await OTP.find({email}).sort({createdAt:-1}).limit(1);
    console.log(recentOtp);

    //validate input otp and otp from db
    if(recentOtp.length==0)
    {
        //otp not found
        return res.status(400).json(
            {
                success:false,
                message:"OTP not found",
            }
        )
    }
    else if(otp!=recentOtp.otp)
    {
        //invalid otp
        return res.status(400).json(
            {
                success:false,
                message:"OTP not matched",
            }
        )
    }
    //hash passowrd--bcrypt library
    const hashedPassword=await bcrypt.has(password,10);

    //create entry in db
    const profileDetails=await Profiler.create(
        {
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        }
    );
    const user=await User.create(
        {
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType,
            additionalDetails:profileDetails._id,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstname}${lastName}`,
        }
    )
    //return response
    return res.status(200).json(
            {
                success:true,
                message:"Sign up successful",
                user,
            }
        );
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).json(
            {
                success:false,
                message:"User cannot be registered.try again later",
            }
        );
    }
}

//login handler
exports.login=async(req,res)=>{
    try{
        //fetch data from req body
        const{email,password}=req.body;
        //validate data
        if(!email || !password)
        {
            return res.status(403).json(
            {
                success:false,
                message:"All fields are required.Please fill all",
            }
            );
        }
        //user not registered then?
        const user=await User.findOne({email}).populate("additionalDetails");
        if(!user)
        {
            return res.status(401).json(
            {
                success:false,
                message:"User is not registered.Please sign up first",
            }
            );
        }
        //if user already registered generate JWT,after password matching amd send response
        if(await bcrypt.compare(password,user.password))
        {
            const payload={
                email:user.email,
                id:user._id,
                role:user.accountType,
            }
            const token=jwt.sign(payload,process.env.JWT_SECRET,{
                expiresIn:'2h',
            })
            user.token=token;
            user.password=undefined;
        
            //create cookie
            const options={
                expires:new Date(Date.now()+3*24*60*60*100),
                httpOnly:true,
            }
            res.cookie("token",token,options).status(200).json(
                {
                    success:true,
                    token,
                    user,
                }
            )
        }
        else
        {
            return res.status(401).json(
                {
                    success:false,
                    message:"Password incorrect",
                }
            )
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).json(
                {
                    success:false,
                    message:"Login failure.Please try again",
                }
            )
    }
}


//change password

