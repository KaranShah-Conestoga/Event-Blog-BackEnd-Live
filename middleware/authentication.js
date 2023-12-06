import asyncWrapper from "./async.js"
import jwt from "jsonwebtoken"


const  authentication = asyncWrapper(async (req, res, next) => {
    const token =
        req.body.token || req.query.token || req.headers["authorization"];

    if (!token) {
        return res.send("No Token");
        //  return res.status(403).send("A token is required for authentication");
    }
    try {
        const decoded = jwt.verify(token.replace('JWT ', ''), 'RESTFULAPIs');
        //  console.log(decoded);
        req.user = decoded;
    } catch (err) {
        console.log(err);
        return res.send("Invalid Token");
        //  return res.status(401).send("Invalid Token");
    }
    return next();
})

export default authentication;