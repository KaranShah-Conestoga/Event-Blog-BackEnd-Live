// import mongoose from 'mongoose ';
import mongoose, { Schema } from 'mongoose';

const UnblockReqSchema = new mongoose.Schema({
    userId: Schema.Types.ObjectId,
    postId: {
        type:Schema.Types.ObjectId,
        unique: true,
    },
    accountId:{
        type:Schema.Types.ObjectId,
        unique: true,
    },
    status: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
    },
    type:{
        type:String,
        enum:["Post","Account"]
    },
    created: {
        type: Date,
        default: Date.now
    },
}, {
    versionKey: false
})

const UnblockReq = mongoose.model('UnblockReq', UnblockReqSchema);
export default UnblockReq