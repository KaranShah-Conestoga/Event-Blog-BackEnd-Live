// import mongoose from 'mongoose ';
import mongoose from 'mongoose';
const { Schema } = mongoose;


const CommentSchema = new mongoose.Schema({
    userId: {      //User Who comment on post
        type: Schema.Types.ObjectId,
        required: true
    },
    parentId: {   // post Id or Unique comment Id
        type: Schema.Types.ObjectId,
        required: true
    },
    parentCommentId: {   // parent comment Id
        type: Schema.Types.ObjectId,
    },
    comment: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
}, {
    versionKey: false
})

const Comment = mongoose.model('Comment', CommentSchema);
export default Comment

