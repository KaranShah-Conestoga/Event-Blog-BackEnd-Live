// import mongoose from 'mongoose ';
import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
},{
    versionKey: false
})

const Task = mongoose.model('Task', TaskSchema);
export default Task