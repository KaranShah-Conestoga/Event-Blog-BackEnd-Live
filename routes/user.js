import express from 'express';
import Posts from '../controllers/post.js';
const router = express.Router();
import Users from "../controllers/user.js";
import Auth from "../middleware/authentication.js"
import IsBlock from "../middleware/accountStatus.js";


//add IsBlock after Auth 

router.post('/register', Users.register);
router.post('/sign_in', Users.sign_in);
router.get('/profile/:userId', Auth, Users.profile);
router.get('/history', Auth, Users.userHistory);
router.get('/notification/:userId', Auth, Posts.getNotification);
router.delete('/notification/:notificationId', Auth, Posts.deleteNotification);



export default router;
