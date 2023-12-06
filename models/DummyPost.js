// import mongoose from 'mongoose ';
import mongoose from 'mongoose';
const Schema = mongoose.Schema


const DummyPostSchema = new mongoose.Schema({
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
    blocked: {
        type: Boolean,
        default: false
    },
}, {
    versionKey: false
})

const DummyPost = mongoose.model('DummyPost', DummyPostSchema);
export default DummyPost