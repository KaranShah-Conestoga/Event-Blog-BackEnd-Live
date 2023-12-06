import express from 'express';
import Admin from '../controllers/admin.js';
import Auth from "../middleware/authentication.js";
const router = express.Router();

router.post('/', Auth, Admin.allUser);

router.get('/usercount', Auth, Admin.getUserCount); 

router.post('/userpostcount', Auth, Admin.getUserPostCount);

router.get('/postcount', Auth, Admin.getPostCount);

router.get('/blockusers', Auth, Admin.blockUser);

router.get('/repotedpost', Auth, Admin.reportedPost);

router.post('/repotedpost/:postId', Auth, Admin.reviewPost);

// router.get('/repotedaccount', Auth, Admin.reportedAccount);


router.get('/post/blockpost/req', Auth , Admin.getAllReq)

router.get('/user/likeviews/count', Auth , Admin.getLikeViewCount)   // userArry with like array ad view array

router.get('/post/blockaccount/req', Auth , Admin.getAllAccReq)

router.get('/post/tenyear/report', Auth , Admin.getDecadeReport) // number of post in 10 year 

router.post('/maxpost/tenyear/user', Auth , Admin.getMaxPostUser)

router.get('/highestreported/user', Auth , Admin.getHighestReportedUser)

router.get('/inactive/user', Auth , Admin.getInactiveUser)

router.delete('/openpost/req/:reqId' , Auth, Admin.deleteOpenReq)

// router.get('/post/block/req', Auth , Admin.getAllReq)





export default router;
