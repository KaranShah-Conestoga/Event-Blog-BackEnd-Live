// import mongoose from 'mongoose ';
import mongoose from 'mongoose';
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: true
    },
    hash_password: {
        type: String,
    },
    userType: {
        type: String,
        default:"User",
        enum: ["User", "Admin"]
    },
    created: {
        type: Date,
        default: Date.now
    },
    UpdatedDate: Date,
    Token: String,
    status: {
        type: Boolean,
        default: true
    }

}, {
    versionKey: false   // __v: 0 hide 
})

UserSchema.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.hash_password);
};

const User = mongoose.model('User', UserSchema);
export default User