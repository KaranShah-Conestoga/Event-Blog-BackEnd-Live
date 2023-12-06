// import mongoose from 'mongoose ';
import mongoose from 'mongoose';
const { Schema } = mongoose;


const PostHitCountSchema = new mongoose.Schema({
    userId: Schema.Types.ObjectId,
    postId: Schema.Types.ObjectId,
    viewed: {
        type: Date,
        default: Date.now
    },
}, {
    versionKey: false
})

const PostHitCount = mongoose.model('PostHitCount', PostHitCountSchema);
export default PostHitCount

