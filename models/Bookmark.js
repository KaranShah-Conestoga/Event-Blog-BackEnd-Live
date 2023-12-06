// import mongoose from 'mongoose ';
import mongoose from 'mongoose';
const { Schema } = mongoose;


const BookmarkSchema = new mongoose.Schema({
    userId: Schema.Types.ObjectId,
    postId: Schema.Types.ObjectId,
    
    isBookmark: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    versionKey: false
})

const Bookmark = mongoose.model('Bookmark', BookmarkSchema);
export default Bookmark