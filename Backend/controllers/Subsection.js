const SubSection=require('../models/SubSection');
const Section=require('../models/Section');
const { uploadImageToCloudinary } = require('../utils/imageUploader');
require('dotenv').config();

exports.createSubSection=async(req,res)=>{
    try{
        //fetch data from req body
        const {sectionId,title,timeDuration,description}=req.body;
        //fetch video 
        const video=req.files.videoFile;

        //validation
        if(!sectionId || !title || !timeDuration || !description )
        {
             return res.status(400).json(
                {
                    success:false,
                    message:'All fields are req',
                }
            )
        }

        //upload video on cloudinary
        const uploadDetails=uploadImageToCloudinary(video,process.env.FOLDER_NAME);

        //create subsection
        const subSectionDetails=await SubSection.create(
            {
                title:title,
                timeDuration:timeDuration,
                description:description,
                videoUrl:(await uploadDetails).secure_url,
            }
        )
        //update subsection id in section
        const updatedSection=await Section.findByIdAndUpdate({_id:sectionId},{
            $push:{
                subSection:subSectionDetails._id,
            }
        },{new:true});
        //populate


        //send successfull response
        return res.status(200).json(
            {
                success:true,
                message:"SubSection created successfully",
                updatedSection,
            }
        )
    }
    catch(err)
    {
        return res.status(500).json(
                {
                    success:false,
                    message:'Unable to create a sub-section.Please try again!!',
                    error:err.message,
                }
            );
    }
}