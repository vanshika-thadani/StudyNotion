//npm i razorpay
const {instance}=require('../config/razorpay');
const Course=require('../models/Course');
const User=require('../models/User');
const mailSender=require('../utils/mailSender');
const {courseEnrollmentEmail}=require('../mail-templates/courseEnrollmentEmail');
const mongoose=require('mongoose');
const { default: payments } = require('razorpay/dist/types/payments');

//capture the payment and initiate the Razorpay order
exports.capturePayment=async(req,res)=>{
    //fetch user id and course id
    const {course_id}=req.body;
    const userId=req.user.id;
    //validation
    //valid courseId
    if(!course_id)
    {
        return res.json(
            {
                success:false,
                message:'Please provide valid Course id'
            }
        )
    }
    //valid courseDetail
    let course;
    try{
        course=await Course.findById(course_id);
        if(!course)
        {
            return res.json(
            {
                success:false,
                message:'Could not find the course'
            }
            )
        }
        //user already paid or this course?
        //here id is in string but in course model it is object id
        //so convert
        const uid=new mongoose.Types.ObjectId(userId);
        if(course.studentsEnrolled.includes(uid))
        {
            return res.status(300).json(
                {
                    success:false,
                    message:"Student already enrolled",
                }
            )
        }
    }
    catch(err)
    {
        return res.status(500).json(
            {
                success:false,
                message:err.message,
            }
        )
    }
    

    //create order
    const amount=course.price;
    const currency='INR';
    const options={
        amount:amount*100,
        currency,
        receipt:Math.random(Date.now()).toString(),
        notes:{
            courseId:course_id,
            userId,
        }
    }
    try{
        //initiate the payment using razorpay
        const paymentResponse=await instance.orders.create(options);
        console.log(paymentResponse);

        //return response
        return res.status(200).json(
            {
                success:true,
                courseName:course.courseName,
                courseDescription:course.courseDescription,
                thumbnail:course.thumbnail,
                orderId:paymentResponse.id,
                currency:paymentResponse.currency,
                amount:paymentResponse.amount,

            }
        )
    }
    catch(err)
    {
        console.log(err);
        res.json(
            {
                success:false,
                message:"Could not initiate Order",
            }
        );
    }
}

//verify signature of razorpay and server
exports.verifySignature=async(req,res)=>{
    const webhookSecret='12345678';//server pr jo hai
    const signature=req.headers['x-razorpay-signature'];//sent by razorpay

    const shasum=crypto.createHmac("sha256",webhookSecret);
    //convert into string
    shasum.update(JSON.stringify(req.body));
    const digest=shasum.digest("hex");

    if(signature===digest)
    {
        console.log("Payment is authorized");

        const {courseId,userId}=req.body.payload.payment.entity.notes;

        try{
            //action
            //find the course and enroll the student in it
            const enrolledCourse=await Course.findOneAndUpdate({_id:courseId},
                {
                    $push:{
                        studentsEnrolled:userId,
                    }
                },
                {new:true},
            );

            if(!enrolledCourse)
            {
                return res.status(500).json(
                    {
                        success:false,
                        message:'Course not found',
                    }
                )
            }
            console.log(enrolledCourse);

            //find the user and update this course in his/her list of courses
            const enrolledStudent=await User.findOneAndUpdate({_id:userId},{
                $push:{
                    courses:courseId,
                }
            },{new:true});

            console.log(enrolledStudent);

            //send mail of confirmation
            const emailResponse=await mailSender(enrolledStudent.email,"Confirmation mail of Confirmed Course Buy","Congratulations,you are onboarded into this Course");

            console.log(emailResponse);
            return res.status(200).json(
                {
                    success:true,
                    message:"Signature verification and course added",
                }
            )
        }
        catch(err)
        {
            console.log(err);
            return res.status(500).json(
                    {
                        success:false,
                        message:err.message,
                    }
                )
        }
    }
    else{
        return res.status(400).json(
                    {
                        success:false,
                        message:"Invalid request",
                    }
                )
    }


;
}
