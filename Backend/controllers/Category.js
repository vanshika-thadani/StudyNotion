const Category=require('../models/category');

//create category handler function
exports.createCategory=async(req,res)=>{
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
        const categoryDetails=await Category.create({name:name,description:description});
        console.log(categoryDetails);

        return res.status(200).json(
            {
                success:true,
                message:"Category created successfully",
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

//handler for getAll categories
exports.showAllCategories=async(req,res)=>{
    try{
        const allCategory=await Category.find({},{name:true,description:true});//no criteria to fetch just bring all tags necessary having title and description include
        res.status(200).json(
            {
                success:true,
                message:"All Categories returned successfully",
                allCategory,
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

