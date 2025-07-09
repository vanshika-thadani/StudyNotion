const User=require("../models/User");
const mailSender=require("../utils/mailSender");


//resetPasswordToken
exports.resetPasswordToken=async(req,res)=>{
    try{
        //fetch email from req.body
        const email=req.body.email;
        //check user for this email(what if no pwd for this email how will you reset it)
        const userExist=await User.findOne({email:email});
        if(!userExist)
        {
            return res.status(401).json(
            {
                success:false,
                message:"Your email is not regsitered with us",
            }
            );
        }
        //generate token
        const token=crypto.randomUUID();
        //update user model by adding token and expiration time--every user has own token which has own expiry date---token insert in user and this token will help to reset pwd (token extract and match)
        const updatedDetails=await User.findOneAndUpdate({email:email},
            {
            token:token,
            resetPasswordExpires:Date.now()+5*60*1000,
        },
        {
        new:true,//to get the updated response
        }  
        );

        //link generate
        const url=`http://localhost:3000/update-password/${token}`;//frontend at 3000 ---different token generated for diff user

        //send mail containing url
        await mailSender(email,"Password Reset Link",`Password reset link:${url}`);

        //return response
        return res.status(200).json(
            {
                success:true,
                message:"Email sent successfully .please check email and change pwd",
            }
            );
    }
    catch(err)  
    {
        console.log(err);
        return res.status(500).json(
            {
                success:false,
                message:"Something went wrong while sending reset link",
            }
            );
    }
}


//resetPassword(update in DB)
//at that page where you have to reset PASSWORD
exports.resetPassword=async(req,res)=>{
    try{
        //data fetch
        const {password,confirmPassword,token}=req.body;
        //validation
        if(password!=confirmPassword)
        {
            return res.json(
            {
                success:false,
                message:"Passwords did not match",
            }
            );
        }
        //get user details from db using token
        const userDetails=await User.findOne({token:token});
        //if no entry--invalid token
        if(!userDetails)
        {
            return res.json(
            {
                success:false,
                message:"Token is invalid",
            }
            );
        }
        //token time expired
        if(userDetails.resetPasswordExpires < Date.now())
        {
            return res.json(
            {
                success:false,
                message:"Token expired.regenerate your token",
            }
            );
        }
        //hash pwd
        const hashedPassword=await bcrypt.hash(password,10);
        //update password
        await User.findOneAndUpdate({token:token},{password:hashedPassword},{new:true});//first {}--searching criteria,second{}---what to update---third{}--return updated document
        //return response
        return res.status(200).json(
            {
                success:true,
                message:"Password reset successfull",
            }
            );

    }
    catch(err)
    {
        return res.status(500).json(
            {
                success:false,
                message:"Reset Password not successfull",
            }
            );
    }
}
