const Course=require('../models/Course');
const Category=require('../models/Category');
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




//Edit Course Details
exports.editCourse = async (req, res) => {
	try {
	  const { courseId } = req.body
	  const updates = req.body
	  const course = await Course.findById(courseId)
  
	  if (!course) {
		return res.status(404).json({ error: "Course not found" })
	  }
  
	  // If Thumbnail Image is found, update it
	  if (req.files) {
		console.log("thumbnail update")
		const thumbnail = req.files.thumbnailImage
		const thumbnailImage = await uploadImageToCloudinary(
		  thumbnail,
		  process.env.FOLDER_NAME
		)
		course.thumbnail = thumbnailImage.secure_url
	  }
  
	  // Update only the fields that are present in the request body
	  for (const key in updates) {
		if (updates.hasOwnProperty(key)) {
		  if (key === "tag" || key === "instructions") {
			course[key] = JSON.parse(updates[key])
		  } else {
			course[key] = updates[key]
		  }
		}
	  }
  
	  await course.save()
  
	  const updatedCourse = await Course.findOne({
		_id: courseId,
	  })
		.populate({
		  path: "instructor",
		  populate: {
			path: "additionalDetails",
		  },
		})
		.populate("category")
		.populate("ratingAndReviews")
		.populate({
		  path: "courseContent",
		  populate: {
			path: "subSection",
		  },
		})
		.exec()
  
	  res.json({
		success: true,
		message: "Course updated successfully",
		data: updatedCourse,
	  })
	} catch (error) {
	  console.error(error)
	  res.status(500).json({
		success: false,
		message: "Internal server error",
		error: error.message,
	  })
	}
  }




  //get full course details
  exports.getFullCourseDetails = async (req, res) => {
	try {
	  const { courseId } = req.body
	  const userId = req.user.id
	  const courseDetails = await Course.findOne({
		_id: courseId,
	  })
		.populate({
		  path: "instructor",
		  populate: {
			path: "additionalDetails",
		  },
		})
		.populate("category")
		.populate("ratingAndReviews")
		.populate({
		  path: "courseContent",
		  populate: {
			path: "subSection",
		  },
		})
		.exec()

		
	  let courseProgressCount = await CourseProgress.findOne({
		courseID: courseId,
		userID: userId,
	  })
  
	  console.log("courseProgressCount : ", courseProgressCount)
  
	  if (!courseDetails) {
		return res.status(400).json({
		  success: false,
		  message: `Could not find course with id: ${courseId}`,
		})
	  }
  
	  // if (courseDetails.status === "Draft") {
	  //   return res.status(403).json({
	  //     success: false,
	  //     message: `Accessing a draft course is forbidden`,
	  //   });
	  // }
  
	  let totalDurationInSeconds = 0
	  courseDetails.courseContent.forEach((content) => {
		content.subSection.forEach((subSection) => {
		  const timeDurationInSeconds = parseInt(subSection.timeDuration)
		  totalDurationInSeconds += timeDurationInSeconds;
		})
	  })
  
	  const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
  
	  return res.status(200).json({
		success: true,
		data: {
		  courseDetails,
		  totalDuration,
		  completedVideos: courseProgressCount?.completedVideos
			? courseProgressCount?.completedVideos
			: ["none"],
		},
	  })
	} catch (error) {
	  return res.status(500).json({
		success: false,
		message: error.message,
	  })
	}
  }


//Delete Course
exports.deleteCourse = async (req, res) => {
	try {
	  const { courseId } = req.body
	  // Find the course
	  const course = await Course.findById(courseId)
	  if (!course) {
		return res.status(404).json({ message: "Course not found" })
	  }
  
	  // Unenroll students from the course
	  const studentsEnrolled = course.studentsEnrolled
	  for (const studentId of studentsEnrolled) {
		await User.findByIdAndUpdate(studentId, {
		  $pull: { courses: courseId },
		})
	  }
  
	  // Delete sections and sub-sections
	  const courseSections = course.courseContent
	  for (const sectionId of courseSections) {
		// Delete sub-sections of the section
		const section = await Section.findById(sectionId)
		if (section) {
		  const subSections = section.subSection
		  for (const subSectionId of subSections) {
			await SubSection.findByIdAndDelete(subSectionId);
		  }
		}
  
		// Delete the section
		await Section.findByIdAndDelete(sectionId)
	  }
  
	  // Delete the course
	  await Course.findByIdAndDelete(courseId)

	  //Delete course id from Category
	  await Category.findByIdAndUpdate(course.category._id, {
		$pull: { courses: courseId },
	     })
	
	//Delete course id from Instructor
	await User.findByIdAndUpdate(course.instructor._id, {
		$pull: { courses: courseId },
		 })
  
	  return res.status(200).json({
		success: true,
		message: "Course deleted successfully",
	  })
	} catch (error) {
	  console.error(error)
	  return res.status(500).json({
		success: false,
		message: "Server error",
		error: error.message,
	  })
	}
  }



  //search course by title,description and tags array
  exports.searchCourse = async (req, res) => {
	try {
	  const  { searchQuery }  = req.body
	//   console.log("searchQuery : ", searchQuery)
	  const courses = await Course.find({
		$or: [
		  { courseName: { $regex: searchQuery, $options: "i" } },
		  { courseDescription: { $regex: searchQuery, $options: "i" } },
		  { tag: { $regex: searchQuery, $options: "i" } },
		],
  })
  .populate({
	path: "instructor",  })
  .populate("category")
  .populate("ratingAndReviews")
  .exec();

  return res.status(200).json({
	success: true,
	data: courses,
	  })
	} catch (error) {
	  return res.status(500).json({
		success: false,
		message: error.message,
	  })
	}		
}					

//mark lecture as completed
exports.markLectureAsComplete = async (req, res) => {
	const { courseId, subSectionId, userId } = req.body
	if (!courseId || !subSectionId || !userId) {
	  return res.status(400).json({
		success: false,
		message: "Missing required fields",
	  })
	}
	try {
	progressAlreadyExists = await CourseProgress.findOne({
				  userID: userId,
				  courseID: courseId,
				})
	  const completedVideos = progressAlreadyExists.completedVideos
	  if (!completedVideos.includes(subSectionId)) {
		await CourseProgress.findOneAndUpdate(
		  {
			userID: userId,
			courseID: courseId,
		  },
		  {
			$push: { completedVideos: subSectionId },
		  }
		)
	  }else{
		return res.status(400).json({
			success: false,
			message: "Lecture already marked as complete",
		  })
	  }
	  await CourseProgress.findOneAndUpdate(
		{
		  userId: userId,
		  courseID: courseId,
		},
		{
		  completedVideos: completedVideos,
		}
	  )
	return res.status(200).json({
	  success: true,
	  message: "Lecture marked as complete",
	})
	} catch (error) {
	  return res.status(500).json({
		success: false,
		message: error.message,
	  })
	}

}