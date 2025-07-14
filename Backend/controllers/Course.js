const Course=require('../models/Course');
const Category=require('../models/category');
const User=require('../models/User');
const {uploadImageToCloudinary}=require('../utils/imageUploader')

//course create handler function
exports.createCourse=async(req,res)=>{
    try{
        //fetch data
        const{courseName,courseDescription,whatYouWillLearn,price,category}=req.body;
        //fetch thumbnail
        const thumbnail=req.files.thumbnailImage;
        //validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !category || !thumbnail)
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

        //category came with course is valid or not(extra)--since choosing category from drop down no case of invalid category
        //in Course model category is stored as an obj id so received from req.body is an objectID
        const categoryDetails=await Category.findById(category);
        if(!categoryDetails)
        {
            return res.status(400).json(
                {
                    success:false,
                    message:"Category Details not found",
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
            category,//category ki object id hi req me mili hai 
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

        //add course entry in category
        await Category.findByIdAndUpdate({_id:category},{
            $push:{
                course:newCourse._id,
            }
        }
        );


        //return response
        return res.status(200).json(
                {
                    success:true,
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
            );
    }
}