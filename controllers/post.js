import Post from "../models/Post.js"
import Like from "../models/Like.js"
import Bookmark from "../models/Bookmark.js"
import asyncWrapper from "../middleware/async.js"
import User from "../models/User.js"
import delay from "../common/Delay.js"
import mongoose from 'mongoose';
import Comment from "../models/Comment.js"
import Report from "../models/Report.js"
import Response from "../common/Response.js"
import Constants from "../common/Constants.js"
import UnblockReq from "../models/UnblockReq.js"
import Notification from "../models/Notification.js"
import tokenDecode from "../common/TokenDecode.js"
import PostHitCount from "../models/PostHitCount.js"
import lookup from "../common/LookUp.js"

class Posts {
    static create = asyncWrapper(async (req, res) => {
        const post = new Post({
            title: req.body.title,
            description: req.body.description,
            tags: req.body.tags || [],
            createdBy: req.body.createdBy,
            UpdatedDate: new Date(),
            // imagePath: req.file.filename
        });
        try {
            await post.save();
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', post);
            return res.send(data);
        } catch (err) {
            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
        }
    })

    static getSinglePost = asyncWrapper(async (req, res) => {
      
        Post.countDocuments({ _id: req.params.postId }, function (err, count) {
            if (count > 0) {
                Post.aggregate([
                    {
                        $match: {
                            _id: mongoose.Types.ObjectId(req.params.postId)
                        }
                    },
                    ...lookup("users", "createdBy", "_id", "user"),
                    {
                        $project: {
                            _id: '$_id',
                            title: '$title',
                            description: '$description',
                            tags: '$tags',
                            likes: '$likes',
                            dislikes: '$dislikes',
                            created: '$created',
                            name: '$user.fullName',
                            email: '$user.email',
                            createdBy: '$createdBy',
                            status: '$status',
                            blocked: '$blocked',
                        }
                    }]
                )
                    .then(async (post) => {
                        const userData = tokenDecode(req.headers.authorization);
                        // const likeOrnot = await Like.findOne({ postId: req.params.postId, userId: userData._id });
                        await Like.findOne({ postId: req.params.postId, likedBy: mongoose.Types.ObjectId(userData._id) }).then((data) => {
                            if (data) {
                                post[0].isLiked = data.status;
                            } else {
                                post[0].isLiked = 0;
                            }
                        }).catch((e) => {
                            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, e);
                            return res.send(data);
                        });
                        await delay(100);

                        await Bookmark.findOne({
                            postId: req.params.postId,
                            userId: mongoose.Types.ObjectId(userData._id)
                        }).then((data) => {
                            if (data) {
                                post[0].isBookmarked = data.isBookmark;
                            }
                            else {
                                post[0].isBookmarked = false;
                            }
                        }).catch((e) => {
                            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, e);
                            return res.send(data);
                        });
                        await delay(100);
                        await PostHitCount.aggregate([{
                            $match: {
                                $and: [
                                    {
                                        postId: mongoose.Types.ObjectId(req.params.postId)
                                    },
                                    {
                                        userId: mongoose.Types.ObjectId(userData._id)
                                    }
                                ]
                            }
                        }]).then(async (data) => {
                            await delay(100);
                            if (data.length > 0) {
                                post[0].isViewed = true;
                            } else {
                                const postHitCount = new PostHitCount({
                                    postId: req.params.postId,
                                    userId: userData._id
                                });
                                try {
                                    await delay(100);
                                    PostHitCount.findOne({ $and: [{ postId: mongoose.Types.ObjectId(req.params.postId) }, { userId: mongoose.Types.ObjectId(userData._id) }] }).then(async (count) => {
                                        if (!count) {
                                            await delay(100);
                                            if (userData.userType !== "Admin" ) {
                                                await postHitCount.save();
                                            }
                                        }
                                    });
                                } catch (err) {
                                    let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                                    return res.send(data);
                                }
                            }
                        }).catch((e) => {
                            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, e);
                            return res.send(data);
                        });
                        // PostHitCount.findOne({ postId: mongoose.Types.ObjectId(req.params.postId), userId: mongoose.Types.ObjectId(userData._id) }).then(async (hitCount) => {
                        //     if (!hitCount) {
                        //         const postHitCount = new PostHitCount({
                        //             postId: req.params.postId,
                        //             userId: userData._id
                        //         });
                        //         console.log('postHitCount', postHitCount)
                        //         try {
                        //             await delay(100);
                        //             PostHitCount.findOne({ $and: [{ postId: mongoose.Types.ObjectId(req.params.postId) }, { userId: mongoose.Types.ObjectId(userData._id) }] }).then(async (count) => {
                        //                 if (!count) {
                        //                     await delay(100);
                        //                     await postHitCount.save();
                        //                 }
                        //             });
                        //         } catch (err) {
                        //             let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                        //             return res.send(data);
                        //         }
                        //     }
                        // })
                        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', ...post);
                        return res.send(data);
                    })
                    .catch((e) => {
                        let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, e);
                        return res.send(data);
                    });
            }

            else {
                let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, 'No Post Found');
                return res.send(data);
            }

        });

    })

    static getPosts = asyncWrapper(async (req, res) => {
        let filter = { "$match": { $and: [{ status: true, blocked:false }] } };
        const searchField = ["title", "description", "tags"];

        if (req.body.Searchby != '' && req.body.Searchby != null) {
            // let regex = new RegExp(req.body.Searchby, 'i');
            // filter = { "$match": { $and: [{ $or: [{ "title": regex }, { "description": regex }, { "tags": regex }] }, { status: true }] } }
            const Searchbys = (typeof req.body.Searchby === 'object') ? req.body.Searchby : [req.body.Searchby];
            const matchField = searchField.map((field) => {
                return { [field]: { "$regex": Searchbys.join('|'), "$options": 'i' } };
            });
            if (filter['$match']['$and'] !== undefined) {
                filter['$match']['$and'].push({ $or: matchField });
            } else {
                filter = { "$match": { $and: [{ $or: matchField }] } }
            }
        }

        Post.aggregate([
            ...lookup("users", "createdBy", "_id", "user"),

            filter,
            {
                $project: {
                    _id: "$_id",
                    title: '$title',
                    description: '$description',
                    tags: '$tags',
                    createdBy: '$createdBy',
                    created: "$created",
                    status: "$status",
                    likes: "$likes",
                    dislikes: "$dislikes",
                    name: "$user.fullName",
                    email: "$user.email",
                    // imagePath: "$imagePath",
                }
            },

            { $sort: { created: -1 } }
        ]).then(async (allPost) => {
            allPost.map(async (item, i) => {
                const count = await PostHitCount.countDocuments({ postId: mongoose.Types.ObjectId(item._id) })
                item['count'] = count;
            })
            await delay(500)
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', allPost);
            return res.send(data);
        }).catch((err) => {
            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
        })
    });

    static getUserPosts = asyncWrapper(async (req, res) => {
        const userData = tokenDecode(req.headers.authorization);
        // const owner = (req.params.userId != userData._id) ? true : '';
        const owner = '';
        // let filter = { "$match": { $and: [{ status: true }] } };
        let filter = (req.params.userId != userData._id) ? { "$match": { $and: [{ status: true }, { createdBy: mongoose.Types.ObjectId(req.params.userId) }] } } : { "$match": { $and: [{ createdBy: (mongoose.Types.ObjectId(req.params.userId)) }] } };
        Post.aggregate(
            [
                // { $match: { createdBy: (mongoose.Types.ObjectId(req.params.userId)) } },
                filter,
                {
                    $project: {
                        title: '$title',
                        description: '$description',
                        tags: '$tags',
                        createdBy: '$createdBy',
                        created: "$created",
                        status: "$status",
                        likes: "$likes",
                        dislikes: "$dislikes",
                        blocked: "$blocked",

                        // imagePath: "$imagePath"
                    }
                },
                { $sort: { created: -1 } }
            ]
        ).then(async(userPost) => {
            userPost.map(async (item, i) => {
                const count = await PostHitCount.countDocuments({ postId: mongoose.Types.ObjectId(item._id) })
                item['count'] = count;
            })
            await delay(500)
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', userPost);
            return res.send(data);
        }).catch((err) => {
            let data = Response(Constants.RESULT_CODE.NOTFOUND, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
        })
    });

    static updatePost = asyncWrapper(async (req, res) => {
        const count = await Report.countDocuments({ postId: mongoose.Types.ObjectId(req.params.postId) })
        if (count > 3) {
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.FAIL, 'Post has been removed due to multiple reports');
            return res.send(data);
        } else {
            await Post.findByIdAndUpdate({ _id: req.params.postId }, {
                title: req.body.title,
                description: req.body.description,
                tags: req.body.tags || [],
                createdBy: req.body.createdBy,
                UpdatedDate: new Date(),
                status: req.body.status,
                // imagePath: req.file.filename
            }, { new: true })
                .then(async (newPost) => {
                    await delay(500);
                    await Bookmark.updateMany({ postId: mongoose.Types.ObjectId(req.params.postId) }, { status: req.body.status }, { new: true })
                    // Bookmark.aggregate([
                    //     {
                    //         $match: {
                    //             postId: mongoose.Types.ObjectId(req.params.postId)
                    //         }
                    //     }
                    // ]).then(async (j) => {
                    //     await delay(500);
                    //     j.map(async (item) => {
                    //         // Bookmark.findByIdAndUpdate({item._id }, { status: req.body.status }, { new: true })
                    //         await Bookmark.findByIdAndUpdate(item._id, { status: req.body.status }, { new: true });
                    //     })
                    // })
                    let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', newPost);
                    return res.send(data);
                })
                .catch((err) => {
                    let data = Response(Constants.RESULT_CODE.NOTFOUND, Constants.RESULT_FLAG.FAIL, err);
                    return res.send(data);
                })
        }
    })

    static deletePost = asyncWrapper(async (req, res) => {
        Post.findByIdAndDelete({ _id: req.params.postId }, { new: true }).then(async (postDelete) => {
            // await PostHitCount.findByIdAndDelete({ postId: mongoose.Types.ObjectId(req.params.postId) }, { new: true })
            // await Bookmark.findByIdAndDelete({ postId: mongoose.Types.ObjectId(req.params.postId) }, { new: true })
            await PostHitCount.deleteMany({ postId: mongoose.Types.ObjectId(req.params.postId) }, { new: true })
            await Bookmark.deleteMany({ postId: mongoose.Types.ObjectId(req.params.postId) }, { new: true })
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your post is successfully delete', postDelete);
            return res.send(data);
        })
    })

    static likePost = asyncWrapper(async (req, res) => {

        Like.aggregate([
            { $match: { $and: [{ postId: req.body.postId }, { likedBy: mongoose.Types.ObjectId(req.body.likedBy) }] } },
        ]).then(async (likeData) => {
            let status = req.body.status;
            if (likeData.length) {
                let oldStatus = likeData[0].status;
                if (-1 <= status && status <= 1) {
                    if (likeData[0].status != status && (-1 <= status <= 1)) {
                        Like.findOneAndDelete({ likedBy: mongoose.Types.ObjectId(req.body.likedBy), postId: req.body.postId }).then(async (data) => {
                            const like = new Like({
                                likedBy: req.body.likedBy,
                                postId: req.body.postId,
                                status: req.body.status
                            });
                            try {
                                await like.save().then(async (i) => {
                                    if (status === 1) {
                                        await Post.findByIdAndUpdate(req.body.postId,
                                            ((oldStatus != 0) ? { $inc: { likes: 1, dislikes: -1 } } : { $inc: { likes: 1 } })
                                        )
                                    }
                                    else if (status === 0) {
                                        await Post.findByIdAndUpdate(req.body.postId,
                                            ((oldStatus === 1) ? { $inc: { likes: -1 } } : { $inc: { dislikes: -1 } })
                                        )
                                    }
                                    else {
                                        await Post.findByIdAndUpdate(req.body.postId,
                                            ((oldStatus != 0) ? { $inc: { dislikes: 1, likes: -1 } } : { $inc: { dislikes: 1 } })
                                        )
                                    }
                                });
                                let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your like is successfully updated', like);
                                return res.send(data);
                            } catch (err) {
                                let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                                return res.send(data);
                            }
                        })
                    }
                    else {
                        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'You have already liked this post');
                        return res.send(data);
                    }
                }
                else {
                    let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, 'Invalid data');
                    return res.send(data);
                }
            }
            else {
                const like = new Like({
                    likedBy: req.body.likedBy,
                    postId: req.body.postId,
                    status: status
                });
                try {
                    await like.save().then(async (i) => {
                        if (status === 1) {
                            await Post.findByIdAndUpdate(req.body.postId,
                                ({ $inc: { likes: 1 } })
                            )
                        }
                        else if (status === -1) {
                            await Post.findByIdAndUpdate(req.body.postId,
                                ({ $inc: { dislikes: 1 } })
                            )
                        }
                    });
                    let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', like);
                    return res.send(data);
                } catch (err) {
                    let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                    return res.send(data);
                }
            }
        })
    })

    static likeUsers = asyncWrapper(async (req, res) => {
        Like.aggregate([
            { $match: { $and: [{ postId: req.params.postId }, { status: 1 }] } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'likedBy',
                    foreignField: '_id',
                    as: 'user'
                }
            }, {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            }, {
                $project: {
                    name: '$user.fullName',
                    email: '$user.email'
                }
            }
        ]).then((userlist) => {
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', userlist);
            return res.send(data);
        })
    })

    static bookmark = asyncWrapper(async (req, res) => {
        Bookmark.aggregate([{ $match: { userId: mongoose.Types.ObjectId(req.body.userId), postId: mongoose.Types.ObjectId(req.body.postId) } }
        ]).then(async (data) => {

            if (data.length && req.body.isBookmark === false) {
                Bookmark.findByIdAndDelete(data[0]._id).then(async (delBookmark) => {
                    let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your bookmark is successfully removed', delBookmark);
                    return res.send(data);
                })
            }
            else if (data.length && data[0].isBookmark === req.body.isBookmark) {
                let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'You can not pass same data');
                return res.send(data);
            }
            else {
                if (req.body.isBookmark === true) {
                    const bookmark = new Bookmark({
                        userId: req.body.userId,
                        postId: req.body.postId,
                        isBookmark: req.body.isBookmark,
                    });
                    try {
                        await bookmark.save();
                        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your bookmark is successfully added', bookmark);
                        return res.send(data);
                    } catch (err) {
                        let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                        return res.send(data);
                    }
                }
                else {
                    let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, 'Wrong data');
                    return res.send(data);
                }
            }
        })
    })

    // static userBookmark = asyncWrapper(async (req, res) => {
    //     Bookmark.find({ userId: req.params.userId, status: true }).then((data) => {
    //         res.send(data)
    //     })
    // })


    static userBookmark = asyncWrapper(async (req, res) => {
        // Bookmark.find({ userId: req.params.userId, status: true }).populate('postId').then((userBM) => {
        //     let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', userBM);
        //     return res.send(data);
        // })
        const userData = tokenDecode(req.headers.authorization);
        Bookmark.aggregate([{
            $match: {
                userId: mongoose.Types.ObjectId(userData._id)
            }
        }, {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        }, {
            $lookup: {
                from: 'posts',
                localField: 'postId',
                foreignField: '_id',
                as: 'post'
            }
        }, {
            $unwind: {
                path: '$post',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $project: {
                _id: '$post._id',
                title: '$post.title',
                description: '$post.description',
                tags: '$post.tags',
                likes: '$post.likes',
                dislikes: '$post.dislikes',
                created: '$post.created',
                name: '$user.fullName',
                email: '$user.email'
            }
        }]).then(async (userBook) => {
            userBook.map(async (item, i) => {
                const count = await PostHitCount.countDocuments({ postId: mongoose.Types.ObjectId(item._id) })
                item['count'] = count;
            })
            await delay(500)
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', userBook);
            return res.send(data);
        })
    })

    static comment = asyncWrapper(async (req, res) => {
        const comment = new Comment({
            userId: req.body.userId,
            parentId: req.body.parentId,
            comment: req.body.comment,
            parentCommentId: req.body.parentCommentId,
        });
        try {
            await comment.save();
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your comment is successfully added', comment);
            return res.send(data);
        } catch (err) {
            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
        }
    })

    static getComment = asyncWrapper(async (req, res) => {
        Comment.aggregate([{
            $match: {
                parentId: mongoose.Types.ObjectId(req.params.postId)
            }
        },
        ...lookup("users", "userId", "_id", "user"),
        {
            $project: {
                name: '$user.fullName',
                email: '$user.email',
                comment: '$comment',
                created: '$created',
                parentId: '$_id',
                parentCommentId: '$_id',
            }
        }]).then(async (comments) => {
            comments.map(async (item, i) => {

                Comment.aggregate([{
                    $match: {
                        parentId: mongoose.Types.ObjectId(item._id)
                    }
                },
                ...lookup("users", "userId", "_id", "user"),
                {
                    $project: {
                        name: '$user.fullName',
                        email: '$user.email',
                        comment: '$comment',
                        parentId: '$parentId',
                        parentCommentId: '$parentCommentId',
                        created: '$created',
                    }
                }]).then((re) => {
                    item['subComments'] = re;
                    re.map((item1, i) => {
                        if (item1.parentCommentId) {
                            Comment.aggregate([{
                                $match: {
                                    _id: mongoose.Types.ObjectId(item1.parentCommentId)
                                }
                            },
                            ...lookup("users", "userId", "_id", "parent"),
                            {
                                $project: {
                                    name: '$user.fullName',
                                    email: '$user.email',
                                    parentName: '$parent.fullName',
                                    comment: '$comment',
                                    parentCommentId: '$parentCommentId',
                                    created: '$created',
                                }
                            }]).then((re1) => {
                                item1['parent'] = re1[0].parentName;
                            })


                        }
                    })
                })


            })
            await delay(500)
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', comments);
            return res.send(data);
        })
    })

    static postReport = asyncWrapper(async (req, res) => {

        Report.findOne({
            userId: mongoose.Types.ObjectId(req.body.userId),
            postId: mongoose.Types.ObjectId(req.body.postId)
        }).then(async (reportData) => {
            if (reportData) {
                let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, "You already reported this post");
                return res.send(data);
            }
            else {
                const report = new Report({
                    userId: req.body.userId,
                    postId: req.body.postId,
                    description: req.body.description,
                });
                try {
                    await report.save().then(async (da) => {
                        const count = await Report.countDocuments({ postId: mongoose.Types.ObjectId(req.body.postId) })
                        if (count > 3) {
                            await Post.findByIdAndUpdate(mongoose.Types.ObjectId(req.body.postId), { blocked: true })
                            await Post.findByIdAndUpdate(mongoose.Types.ObjectId(req.body.postId), { status: false })
                                .then(async (reportPost) => {
                                    await delay(500);
                                    // Bookmark.aggregate([
                                    //     {
                                    //         $match: {
                                    //             postId: mongoose.Types.ObjectId(req.body.postId)
                                    //         }
                                    //     }
                                    // ]).then(async (j) => {
                                    //     await delay(500);
                                    //     j.map(async (item) => {
                                    //         await Bookmark.findByIdAndUpdate(item._id, { status: false }, { new: true });
                                    //     })
                                    // })
                                    await Bookmark.updateMany({ postId: mongoose.Types.ObjectId(req.params.postId) }, { status: false }, { new: true })
                                        .then(async (nofion) => {
                                            const notification = new Notification({
                                                owner: reportPost.createdBy,
                                                postId: req.body.postId,
                                                description: `Your post ${reportPost.title} has been blocked due to multiple reports`
                                            })
                                            try {
                                                await notification.save();
                                            } catch (err) {
                                                let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                                                return res.send(data);
                                            }
                                        })

                                    let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your report is successfully added', reportPost);
                                    return res.send(data);


                                })
                                .catch((err) => {
                                    let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                                    return res.send(data);
                                })
                        }
                        else {
                            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your report is successfully added', da);
                            return res.send(data);
                        }
                    })
                    // res.send(report);
                } catch (err) {
                    let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                    return res.send(data);
                }
            }
        })
    })

    static accReport = asyncWrapper(async (req, res) => {
        Report.findOne({
            $and: [{ userId: mongoose.Types.ObjectId(req.body.userId), }, { accountId: mongoose.Types.ObjectId(req.body.accountId) }]
        }).then(async (reportData) => {
            if (reportData) {
                let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, "You already reported this Account");
                return res.send(data);
            }
            else {
                const report = new Report({
                    userId: req.body.userId,
                    accountId: req.body.accountId,
                    description: req.body.description,
                });
                try {
                    await report.save().then(async (da) => {
                        const count = await Report.countDocuments({ accountId: mongoose.Types.ObjectId(req.body.accountId) })
                        if (count > 0) {
                            await Post.updateMany({ createdBy: mongoose.Types.ObjectId(req.body.accountId) }, { status: false })
                            await User.findByIdAndUpdate(mongoose.Types.ObjectId(req.body.accountId), { status: false })
                                .then(async (reportAccount) => {
                                    await delay(500);
                                    const notification = new Notification({
                                        owner: reportAccount._id,
                                        accountId: req.body.accountId,
                                        description: `Your account has been blocked due to multiple reports`
                                    })
                                    try {
                                        await notification.save();
                                    } catch (err) {
                                        let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                                        return res.send(data);
                                    }

                                })
                                .catch((err) => {
                                    let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                                    return res.send(data);
                                })
                        }
                        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your report is successfully added', da);
                        return res.send(data);
                    })

                } catch (err) {
                    let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                    return res.send(data);
                }
            }
        })
    })

    static unblockReq = asyncWrapper(async (req, res) => {
        const unblockReq = new UnblockReq({
            postId: req.body.postId,
            accountId: req.body.accountId,
            userId: req.body.userId,
            description: req.body.description,
            type: req.body.type
            // imagePath: req.file.filename
        });
        try {
            await unblockReq.save();
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', unblockReq);
            return res.send(data);
        } catch (err) {
            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
        }
    })

    static getNotification = asyncWrapper(async (req, res) => {
        Notification.aggregate(
            [{
                $match: {
                    owner: mongoose.Types.ObjectId(req.params.userId)
                }
            },
            ...lookup('posts', 'postId', '_id', 'post'),
            {
                $sort: {
                    created: -1
                }
            }, {
                $project: {
                    id: "$id",
                    owner: "$owner",
                    postId: "$postId",
                    description: "$description",
                    created: "$created",
                    title: "$post.title",
                }
            }]
        ).then((notification) => {
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', notification);
            return res.send(data);
        })
    })

    static deleteNotification = asyncWrapper(async (req, res) => {
        Notification.findByIdAndDelete(req.params.notificationId).then((del) => {
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Notification deleted', del);
            return res.send(data);
        }).catch((err) => {
            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
        })
    })
}

export default Posts;

