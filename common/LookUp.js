const lookup = (from, localField, foreignField, as) => {
    const returnResponse = [
        {
            $lookup: {
                from: `${from}`,
                localField: `${localField}`,
                foreignField: `${foreignField}`,
                as: `${as}`
            }
        },
        {
            $unwind: {
                path: `$${as}`,
                preserveNullAndEmptyArrays: true
            }
        }
    ]
    return returnResponse;
}

export default lookup