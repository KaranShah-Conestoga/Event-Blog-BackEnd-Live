import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import connectDB from './config/connectdb.js'
import tasks from './routes/tasks.js'
import admin from './routes/admin.js'
import notFound from './middleware/notFound.js'
import errorHandler from './middleware/error.js'
import users from './routes/user.js'
import posts from './routes/post.js'
import { Server } from 'socket.io'
import http from 'http'

const app = express()
const port = process.env.PORT
const DATABASE_URL = process.env.DATABASE_URL

app.use(cors())
const server = http.createServer(app);

app.use(express.json())
connectDB(DATABASE_URL)


const io = new Server(server, {
    cors: {
      origin: "event-blog-front-end-live-g2rxyw3zg-karan-shahs-projects.vercel.app",
      methods: ["GET", "POST"],
    },
  });

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("postId_connect", (postId) => {
        console.log('postId',postId)
        socket.join(postId);
    });

    socket.on("send_comment", (data) => {
        console.log('data', data)
        socket.to(data.postId).emit("receive_comment", data);
    });
});

app.get('/hello', (req, res) => {
    res.send('Hello World')
})
// app.use('/images', express.static('./images'))


app.use('/admin', admin)
app.use('/tasks', tasks)
app.use('/user', users)
app.use('/post', posts)
app.use(notFound)
app.use(errorHandler)



server.listen(port, () => {
    console.log(`Server listening at http://127.0.0.1:${port}`)
})



//To show image in browser

// http://localhost:8000/images/1680195535444--IMG_20210205_092212.jpg