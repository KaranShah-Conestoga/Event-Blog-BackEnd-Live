import jwt from "jsonwebtoken"

const tokenDecode = (token) => {
    try {
        const decoded = jwt.verify(token.replace('JWT ', ''), 'RESTFULAPIs');
        return decoded;
    } catch (err) {
        console.log(err);
        return err;
    }
}

export default tokenDecode;
