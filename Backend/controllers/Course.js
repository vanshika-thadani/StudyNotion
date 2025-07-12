const Course=require('../models/Course');
const Tag=require('../models/tags');
const User=require('../models/User');
const {uploadImageToCloudinary}=require('../utils/imageUploader')

//course create handler function
exports.createCourse=async(req,res)=>{
    try{
        //fetch data
        const{courseName,courseDescription,whatYouWillLearn,price,tag}=req.body;
        //fetch thumbnail
        const thumbnail=req.files.thumbnailImage;
        //validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail)
        {
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            })
        }
        //instructor based validation(actually not validation extracting id of user to store in this course)
        const userId=req.user.id;
        const instructorDetails=User.findById(userId);
        console.log(instructorDetails);
        if(!userId)
        {
            return res.status(400).json(
                {
                    success:false,
                    message:"Instructor Details not found",
                }
            )
        }

        //tag came with course is valid or not(extra)--since choosing tag from drop down no case of invalid tag
        //in Course model tag is stored as an obj id so received from req.body is an objectID
        const tagDetails=await Tag.findById(tag);
        if(!tagDetails)
        {
            return res.status(400).json(
                {
                    success:false,
                    message:"Tag Details not found",
                }
            )
        }
        //upload image on cloudinary
        const thumbnailImage=await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME);

        //create entry in DB for new course
        const newCourse=await Course.create({
            courseName,
            courseDescription,
            instructor:instructorDetails._id,//since in Course model instructor is obj ID so to here store , fetched id and in db stored
            whatYouWillLearn:whatYouWillLearn,
            price,
            tag,//tag ki object id hi req me mili hai 
            thumbnail:thumbnailImage.secure_url,
        })


        //in User model it has Courses for students courses that a student buy for instructor courses he offers
        //add this new course to course list of instructor
        await User.findByIdAndUpdate({_id:instructorDetails._id},{
            $push:{
                courses:newCourse._id,
            }
        }
        );

        //add course entry in tag
        await Tag.findByIdAndUpdate({_id:tag},{
            $push:{
                course:newCourse._id,
            }
        }
        );

        //return response
        return res.status(200).json(
                {
                    success:false,
                    message:"Course craeted successfully",
                    data:newCourse,
                }
            )

    }
    catch(err)
    {
        console.err(err);
        return res.status(500).json(
                {
                    success:false,
                    message:"Course creation failed",
                }
            )
    }
}


//get all courses
exports.showAllCourses=async(req,res)=>{
    try{
        const allCourses=await Course.find({},{courseName:true,courseDescription:true,price:true,thumbnail:true,instructor:true,ratingAndReviews:true,studentsEnrolled:true}
        ).populate('instructor').exec();

        return res.status(200).json(
                {
                    success:true,
                    message:"all courses fetched",
                    data:allCourses,
                }
            )

    }
    catch(err)
    {
        return res.status(500).json(
                {
                    success:false,
                    message:"Cannot fetch courses",
                    error:err.message,
                }
            )
    }
}