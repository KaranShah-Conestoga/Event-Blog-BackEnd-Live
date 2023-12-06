const Response = (code, flag, message, data, pagination) => {
    var returnResponse = {};
    returnResponse.code = code;
    returnResponse.flag = flag;
    returnResponse.message = message;
    returnResponse.data = data;
    returnResponse.pagination  = pagination;
    return returnResponse;
}

export default Response