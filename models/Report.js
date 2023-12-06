// import mongoose from 'mongoose ';
import mongoose from 'mongoose';
const { Schema } = mongoose;


const ReportSchema = new mongoose.Schema({
    userId: Schema.Types.ObjectId,
    postId: Schema.Types.ObjectId,
    accountId: Schema.Types.ObjectId,
    description: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    created: {
        type: Date,
        default: Date.now
    },
}, {
    versionKey: false
})

const Report = mongoose.model('Report', ReportSchema);
export default Report

