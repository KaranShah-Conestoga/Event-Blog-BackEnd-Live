// import mongoose from 'mongoose ';
import mongoose from 'mongoose';
const Schema = mongoose.Schema


const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    createdBy: Schema.Types.ObjectId,
    created: {
        type: Date,
        default: Date.now
    },
    tags: {
        type: Array,
        "default": []
    },
    UpdatedDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: Boolean,
        default: true
    },
    likes: {
        type: Number,
        default: 0
    },
    dislikes: {
        type: Number,
        default: 0
    },
    imagePath: {
        type: String,
    },
    blocked: {
        type: Boolean,
        default: false
    },
}, {
    versionKey: false
})

const Post = mongoose.model('Post', PostSchema);
export default Post