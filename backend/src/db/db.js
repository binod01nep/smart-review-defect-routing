const mongoose=require('mongoose');

async function connectDB(){
    try{
        mongoose.connect(process.env.MONGOOSE_URI);
        console.log("database connected successfully");
        
    }
    catch(err){
        console.log("database error:",err);
        
    }
}

module.exports=connectDB