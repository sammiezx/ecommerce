const mongoose = require("mongoose")
const validator = require("validator")
const bcryptjs = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")



const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Please Enter your name"],
        maxlength:[30, "Name cannot exceed 30 characters "],
        minlength:[4, "Name should be atleast 4 characters"],
    },
    email:{
        type:String,
        required:[true, "Please Enter your Email"],
        unique:true,
        validate:[validator.isEmail, "Please Enter a valid email"],
    },
    password:{
        type:String,
        required:[true, "Please Enter your password"],
        minlength:[8,"Password should be greater than 8 characters"],
        select:false
    },
    avatar:{
        public_id:{
            type:String,
            required:true
            },
        url:{
            type:String,
            required:true
        }
    },
    role:{
        type:String,
        default: "user"
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date, 
})

userSchema.pre("save", async function(next){

    if(!this.isModified("password")){
        next()
    }    
    this.password = await bcryptjs.hash(this.password, 10)
})

//JWT TOKEN
userSchema.methods.getJWTToken = function(){
    return jwt.sign({id:this._id}, process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRE
    })
}

// Compare Password
userSchema.methods.comparePassword = async function(enteredPassword){
    const flag = await bcryptjs.compare(enteredPassword, this.password)
    return flag
}

//Generating Password Reset token
userSchema.methods.getResetPasswordToken = function(){

    //Generating Token
    const resetToken = crypto.randomBytes(20).toString("hex")
    
    //Hashing and add to userSchema
    this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")

    this.resetPasswordExpire = Date.now() + 15*60*1000

    return resetToken  

}

module.exports =  mongoose.model("User", userSchema)