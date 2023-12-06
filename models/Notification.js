// import mongoose from 'mongoose ';
import mongoose from 'mongoose';
const Schema = mongoose.Schema

const NotificationSchema = new mongoose.Schema({
    owner: Schema.Types.ObjectId,
    postId: {
        type: Schema.Types.ObjectId
    },
    created: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
    },
    
}, {
    versionKey: false
})

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification