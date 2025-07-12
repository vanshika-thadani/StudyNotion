const Tag=require('../models/tags');

//create tag handler function
exports.createTag=async(req,res)=>{
    try{
        //fetch data
        const {name,description}=req.body;
        //validation
        if(!name || !description)
        {
            return res.status(400).json(
            {
                success:false,
                message:"All fields are required",
            }
            )   
        }
        //create entry in db
        const tagDetails=await Tag.create({name:name,description:description});
        console.log(tagDetails);

        return res.status(200).json(
            {
                success:true,
                message:"Tag created successfully",
            }
        )
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
}

//handler for getAll tags
exports.showAlltags=async(req,res)=>{
    try{
        const allTags=await Tag.find({},{name:true,description:true});//no criteria to fetch just bring all tags necessary having title and description include
        res.status(200).json(
            {
                success:true,
                message:"All tags returned successfully",
                allTags,
            }
        )
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
}

