import tokenDecode from "../common/TokenDecode.js";
import User from "../models/User.js";
import asyncWrapper from "./async.js"


const  accoutStatus = asyncWrapper(async (req, res, next) => {
    const userData = tokenDecode(req.headers.authorization);
    if(userData.status == false){
        return res.send("Your account is blocked");
    }
    return next();
})

export default accoutStatus;