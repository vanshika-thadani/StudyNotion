const Profile=require('../models/Profile');
const User=require('../models/User');

//no need of create Profile since profile is created at the signup handler where everything is stored to NULL

//update Profile handler when new profile data has come
exports.updateProfile=async(req,res)=>{
    try{
        //fetch User id and data
        const {dateOfBirth="",about="",contactNumber,gender}=req.body;
        const id=req.user.id;//in middleware auh.js decode data stored back to req,payload contains user id while signing up ,see Auth.js contoller

        //validate the data
        if(!contactNumber || !gender || !id)
        {
            return res.status(400).json(
                {
                    success:false,
                    message:'All fields required',
                }
            );
        }

        //find profile
        const userDetails=await User.findById(id);
        const profileId=userDetails.additionalDetails;
        const profileDetails=await Profile.findById(profileId);

        //update profile
        profileDetails.dateOfBirth=dateOfBirth;
        profileDetails.about=about;
        profileDetails.contactNumber=contactNumber;
        profileDetails.gender=gender;

        //since obj was earlier created to save in Db we will not use Create we will sue Save
        await profileDetails.save();

        //return response
        return res.status(200).json(
                {
                    success:true,
                    message:'Profile Updated successfully',
                    profileDetails,
                }
            );

    }
    catch(err)
    {
        return res.status(500).json(
                {
                    success:false,
                    error:err.message,
                    message:'Unable to update Profile.Please try again',
                }
            );
    }
}


//delete Account
//user logged in already that is why has come to this page (Edit Profile) to delete my account
//req has user id
exports.deleteAccount=async(req,res)=>{
    try{
        //fetch UserId
        const id=req.user.id;
        //validate id
        const userDetails=await User.findById(id);
        if(!userDetails)
        {
            return res.status(400).json(
                {
                    success:false,
                    message:'User does not exist',
                }
            );
        }

        //delete Profile inside user
        await Profile.findByIdAndDelete({_id:userDetails.additionalDetails});

        //delete use
        await User.findByIdAndDelete(id);

        //decrease enrolled students from course---do it(see Course schema)
        //explore--how to schedule deletion --delete acc req sent but acc delete after some number of days

        //return response
        return res.status(200).json(
                {
                    success:true,
                    message:'Profile deleted',
                }
            );
    }
    catch{
        return res.status(500).json(
                {
                    success:false,
                    error:err.message,
                    message:'Unable to delete Account.Please try again',
                }
            );
    }
}


//get all user details
exports.getAllUserDetails=async(req,res)=>{
    try{
        const id=req.user.id;
        const userDetails=await User.findById(id).populate('additionalDetails').exec();
        if(!userDetails)
        {
            return res.status(400).json(
                {
                    success:false,
                    message:'User does not exist',
                }
            );
        }

        return res.status(200).json(
                {
                    success:true,
                    message:'User fetched successfully',
                }
            );
    }
    catch(err)
    {
        return res.status(500).json(
                {
                    success:false,
                    message:'err.message',
                }
            );
    }

}



exports.getEnrolledCourses=async (req,res) => {
	try {
        const id = req.user.id;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const enrolledCourses = await User.findById(id).populate({
			path : "courses",
				populate : {
					path: "courseContent",
			}
		}
		).populate("courseProgress").exec();
        // console.log(enrolledCourses);
        res.status(200).json({
            success: true,
            message: "User Data fetched successfully",
            data: enrolledCourses,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

//updateDisplayPicture
exports.updateDisplayPicture = async (req, res) => {
	try {

		const id = req.user.id;
	const user = await User.findById(id);
	if (!user) {
		return res.status(404).json({
            success: false,
            message: "User not found",
        });
	}
	const image = req.files.pfp;
	if (!image) {
		return res.status(404).json({
            success: false,
            message: "Image not found",
        });
    }
	const uploadDetails = await uploadImageToCloudinary(
		image,
		process.env.FOLDER_NAME
	);
	console.log(uploadDetails);

	const updatedImage = await User.findByIdAndUpdate({_id:id},{image:uploadDetails.secure_url},{ new: true });

    res.status(200).json({
        success: true,
        message: "Image updated successfully",
        data: updatedImage,
    });
		
	} catch (error) {
		return res.status(500).json({
            success: false,
            message: error.message,
        });
		
	}



}

//instructor dashboard
exports.instructorDashboard = async (req, res) => {
	try {
		const id = req.user.id;
		const courseData = await Course.find({instructor:id});
		const courseDetails = courseData.map((course) => {
			totalStudents = course?.studentsEnrolled?.length;
			totalRevenue = course?.price * totalStudents;
			const courseStats = {
				_id: course._id,
				courseName: course.courseName,
				courseDescription: course.courseDescription,
				totalStudents,
				totalRevenue,
			};
			return courseStats;
		});
		res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: courseDetails,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
}