// import mongoose from 'mongoose ';
import mongoose from 'mongoose';
const Schema = mongoose.Schema

const LikeSchema = new mongoose.Schema({
    likedBy: Schema.Types.ObjectId,
    postId: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        enum: [-1, 0, 1]
    },
    created: {
        type: Date,
        default: Date.now
    },
}, {
    versionKey: false
})

const Like = mongoose.model('Like', LikeSchema);
export default Like