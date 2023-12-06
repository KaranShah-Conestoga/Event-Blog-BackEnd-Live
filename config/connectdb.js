import mongoose from "mongoose";

const connectDB = async (DATABASE_URL) => {
   
    try {
        const DB_OPTIONS = {
            dbName: 'event_blog'  //Enter you db name
        }
        await mongoose.connect(DATABASE_URL, DB_OPTIONS)
        mongoose.set('debug', false);
        console.log('DB Connected Successfully...')
    } catch (error) {
        console.log(error)
    }
}

export default connectDB