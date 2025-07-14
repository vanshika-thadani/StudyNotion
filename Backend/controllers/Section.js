const Course=require('../models/Course');
const Section=require('../models/Section');

exports.createSection=async(req,res)=>{
    try{
        //fetch data--i.e name
        const {sectionName,courseId}=req.body;//after creating course response 200 OK has sent newCourse details and that contains courseID so frontend developer hasto extract it manually 
        //validation of data
        if(!sectionName || !courseId)
        {
            return res.status(400).json(
                {
                    success:false,
                    message:'Missing properties',
                }
            )
        }
        //create section
        const newSection=Section.create({sectionName});

        //push objID of section into Course schemaa(update course)
        const updatedCourseDetails=await Course.findByIdAndUpdate({courseId},{
            $push:{
                courseContent:(await newSection)._id,
            }
        },
        {new:true});
        //use populate to replace sections,subsections both in the updatedCourseDetails

        //return successful response
        return res.status(200).json(
            {
                success:true,
                message:"Section created successfully",
                updatedCourseDetails,
            }
        )
    }
    catch(err)
    {
        return res.status(500).json(
                {
                    success:false,
                    message:'Unable to create a section.Please try again!!',
                }
            );
    }
}

exports.updateSection=async(req,res)=>{
    try{
        //fetch data 
        const {sectionName,sectionId}=req.body;
        //validation of data
        if(!sectionName || !sectionId)
        {
            return res.status(400).json(
                {
                    success:false,
                    message:'Missing properties',
                }
            )
        }
        //update section
        const section=await Section.findByIdAndUpdate({sectionId},{sectionName},{new:true});

        //do we need to update Course?--NO course contains section ID and not section data
        //send response 
        return res.status(200).json(
            {
                success:true,
                message:"Section updated successfully",
                updatedCourseDetails,
            }
        )
        
    }
    catch(err)
    {
        return res.status(500).json(
                {
                    success:false,
                    message:'Unable to update a section.Please try again!!',
                }
            );
    }
}

exports.deleteSection=async(req,res)=>{
    try{
        //fetch id--assuming we are sending id in params
        const {sectionId,courseId}=req.params;
        
        // Validation
        if (!sectionId || !courseId) {
        return res.status(400).json({
            success: false,
            message: "Section ID and Course ID are required",
        });
        }
        //findbyIDandDelete
        await Section.findByIdAndDelete(sectionId);

        //delete its id from Course schema
        await Course.findByIdAndUpdate(courseId, {
            $pull: { courseContent: sectionId },
        });
        
        //return response
        return res.status(200).json(
            {
                success:true,
                message:"Section deleted successfully",
            }
        )
    }
    catch(err)
    {
         return res.status(500).json(
                {
                    success:false,
                    message:'Unable to delete a section.Please try again!!',
                }
            );
    }
}