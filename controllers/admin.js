// import Task from "../models/Task.js"
import asyncWrapper from "../middleware/async.js"
import User from "../models/User.js"
import Response from "../common/Response.js"
import Constants from "../common/Constants.js"
import Report from "../models/Report.js"
import Post from "../models/Post.js"
import Bookmark from "../models/Bookmark.js"
import mongoose from "mongoose"
import delay from "../common/Delay.js"
import UnblockReq from "../models/UnblockReq.js"
import lookup from "../common/LookUp.js"
import Notification from "../models/Notification.js"
import PostHitCount from "../models/PostHitCount.js"
import DummyPost from "../models/DummyPost.js"
import Like from "../models/Like.js"
import Comment from "../models/Comment.js"
import tokenDecode from "../common/TokenDecode.js"

class Admin {

  static allUser = asyncWrapper(async (req, res) => {
    let filter = { "$match": { $and: [{ userType: "User", status: true }] } };
    const searchField = ["fullName", "email"];

    if (req.body.Searchby != '' && req.body.Searchby != null) {

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

    User.aggregate([filter])
      .then((users) => {
        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', users);
        return res.send(data);
      })
  })

  static getUserCount = asyncWrapper(async (req, res) => {

    User.aggregate([
      { "$match": { $and: [{ userType: "User", status: true }] } },
      { "$group": { _id: null, TotalUsercount: { $sum: 1 } } }
    ])
      .then((users) => {
        var diffMonth = 0 + (req.body.month != '' ? req.body.month : 1);
        var date = new Date(), y = date.getFullYear(), m = date.getMonth();
        var firstDay = new Date(y, m - (diffMonth - 1), 1);
        var lastDay = new Date(y, m + 1, 2);
        User.find({
          created: {
            $gte: firstDay,
            $lt: lastDay
          }

        })
          .then((users1) => {
            users[0]["filterCount"] = users1.length
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', { users });
            return res.send(data);
          })

        // let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', users);
        // return res.send(data);
      })
  })

  static getUserPostCount = asyncWrapper(async (req, res) => {

    const year = req.body.year || new Date().getFullYear();
    const user = []; const post = []; const reportData = [];


    for (let i = 0; i <= 11; i++) {
      const start = new Date(year, i, 1);
      const end = new Date(year, i + 1, 1);
      // const start = new Date(year, i, 2);
      // const end = new Date(year, i+1 , 1);


      User.find({
        "userType": "User",
        "created": {
          "$gt": start,
          "$lte": end
        }
        // created: {$gt: start,$lt: end},userType:"User"
      })
        .then(async (res) => {

          user.splice(i, 0,
            res.length
          );
          await delay(500)
        })

      Post.find({
        "created": {
          "$gt": start,
          "$lte": end
        }
      })
        .then(async (res) => {
          post.splice(i, 0,
            res.length
          );
          await delay(500)
        })

      Report.find({
        "created": {
          "$gt": start,
          "$lte": end
        }
      })
        .then(async (res) => {
          reportData.splice(i, 0,
            res.length
          );
          await delay(500)
        })
    }

    await delay(500)
    const count = { user, post, reportData }
    let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', count);
    return res.send(data);

  })

  static getPostCount = asyncWrapper(async (req, res) => {
    const user = [];
    const count = [];
    Post.aggregate([{
      $group: {
        _id: '$createdBy',
        count: {
          $sum: 1
        }
      }
    }, {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    }, {
      $sort: {
        count: -1
      }
    }, {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true
      }
    }, {
      $project: {
        name: '$user.fullName',
        count: '$count'
      }
    }]).then((value) => {
      // value.forEach((element) => {
      //   user.push(element.name);
      //   count.push(element.count);
      // });
      value.map((name, i) => {
        user.splice(i, 0,
          name.name
        );
        count.splice(i, 0,
          name.count
        );
      })
      let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', { user, count });
      return res.send(data);
    })
  })

  static blockUser = asyncWrapper(async (req, res) => {
    let filter = { "$match": { $and: [{ userType: "User", status: false }] } };
    const searchField = ["fullName", "email"];


    if (req.body.Searchby != '' && req.body.Searchby != null) {

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

    User.aggregate([filter])
      .then((users) => {
        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', users);
        return res.send(data);
      })
  })

  static reportedPost = asyncWrapper(async (req, res) => {
    Report.aggregate(
      [{ $match: { status: true } },
      {
        $group: {
          _id: { postId: '$postId' },
          count: { $sum: 1 }
        }
      },
      ...lookup("posts", "_id.postId", "_id", "post"),
      ...lookup("users", "post.createdBy", "_id", "user"),
      {
        $project: {
          _id: '$_id.postId',
          title: '$post.title',
          description: '$post.description',
          tags: '$post.tags',
          createdBy: '$post.createdBy',
          created: '$post.created',
          status: '$post.status',
          likes: '$post.likes',
          dislikes: '$post.dislikes',
          TotalReport: '$count',
          name: "$user.fullName",
          email: "$user.email",
        }
      },
      { $sort: { TotalReport: -1 } }]

    ).then((reportData) => {
      // I don't want the data which has accountId but i only want postId data
      reportData = reportData.filter((item) => {
        return item.createdBy !== undefined;  
      })

      let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', reportData);
      return res.send(data);
    })
  })

  static reviewPost = asyncWrapper(async (req, res) => {
    await Post.findByIdAndUpdate(req.params.postId, { status: req.body.status, blocked: !req.body.status })
      .then(async (reportPost) => {
        await delay(500);
        await Bookmark.updateMany({ postId: mongoose.Types.ObjectId(req.params.postId) }, { status: req.body.status }, { new: true })
        // Bookmark.aggregate([
        //   {
        //     $match: {
        //       postId: mongoose.Types.ObjectId(req.params.postId)
        //     }
        //   }
        // ]).then(async (j) => {
        //   await delay(500);
        //   j.map(async (item) => {
        //     await Bookmark.findByIdAndUpdate(item._id, { status: req.body.status }, { new: true });
        //   })
        // })

        // Report.aggregate([
        //   {
        //     $match: {
        //       postId: mongoose.Types.ObjectId(req.params.postId)
        //     }
        //   }
        // ]).then(async (reports) => {
        //   await delay(500);
        //   reports.map(async (item) => {
        //     await Report.findByIdAndUpdate(item._id, { status: false }, { new: true });
        //   })
        // })
        await Report.updateMany({ postId: mongoose.Types.ObjectId(req.params.postId) }, { status: false }, { new: true })
          .then(async (nofion) => {
            const notification = new Notification({
              owner: reportPost.createdBy,
              postId: req.params.postId,
              description: (req.body.status === true) ? `Your post ${reportPost.title} is enable` : `Your post ${reportPost.title} violate policy`
            })
            try {
              await notification.save();
            } catch (err) {
              let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
              return res.send(data);
            }
          })
        await UnblockReq.findOneAndUpdate({ postId: mongoose.Types.ObjectId(req.params.postId) },
          { status: !req.body.status }, { new: true }
        )
        await delay(500);
        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your updated status', reportPost);
        return res.send(data);
      })
      .catch((err) => {
        let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
        return res.send(data);
      })
  })





  static getAllReq = asyncWrapper(async (req, res) => {
    UnblockReq.aggregate([
      {
        $match: {
          type: 'Post',
          status: true
        }
      },
      ...lookup("users", "userId", "_id", "user"),
      {
        $project: {
          _id: '$_id',
          postId: '$postId',
          name: '$user.fullName',
          email: '$user.email',
          type: "$type",
          ReqDescription: "$description"
        }
      }]).then((allreq) => {
        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', allreq);
        return res.send(data);
      })
  })

  static getLikeViewCount = asyncWrapper(async (req, res) => {
    const user = [];
    const likeCount = [];
    const viewCount = [];
    const userList = [];
    Post.aggregate([{
      $group: {
        _id: '$createdBy',
        count: {
          $sum: '$likes'
        },
        postId: { $first: "$_id" }
      }
    },
    ...lookup("users", "_id", "_id", "user"),
    {
      $project: {
        name: '$user.fullName',
        count: '$count',
        postId: "$postId",
        ownerId: "$user._id"

      }
    }, { $sort: { count: -1 } }])
      .then(async (value) => {
        value.map((name, i) => {
          user.splice(i, 0, name.name);
          likeCount.splice(i, 0, name.count);
          Post.find({ createdBy: name.ownerId.toHexString(), status: true }
          ).then((posts) => {
            posts.map((userPost, x) => {
              const add = 0;
              PostHitCount.aggregate([{
                $match: {
                  postId: mongoose.Types.ObjectId(userPost._id)
                }
              }, {
                $group: {
                  _id: '$postId',
                  count: {
                    $sum: 1
                  }
                }

              }]).then(async (views) => {
                let xyz = {
                  postId: userPost._id.toHexString(),
                  count: (views.length) ? views[0].count : 0,
                  User: i
                }
                await userList.push(xyz)
              }
              )
            })
          })
        })
        await delay(500);
        for (var i = 0; i < userList.length; i++) {
          var obj = userList[i];
          viewCount[obj.User] = viewCount[obj.User] === undefined ? 0 : viewCount[obj.User];
          viewCount[obj.User] += parseInt(obj.count);
        }
        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', { user, likeCount, viewCount });
        return res.send(data);
      })
  })

  static getAllAccReq = asyncWrapper(async (req, res) => {
    UnblockReq.aggregate([{
      $match: {
        type: 'Account'
      }
    },
    ...lookup("users", "accountId", "_id", "user"),
    {
      $project: {
        _id: '$_id',
        name: '$user.fullName',
        email: '$user.email',
        accountId: "$accountId",
        type: '$type',
        ReqDescription: '$description'
      }
    }]).then((allreq) => {
      let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', allreq);
      return res.send(data);
    })
  })

  static getDecadeReport = asyncWrapper(async (req, res) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const count = [];
    const year = req.body.year || new Date().getFullYear();
    const data =
      // console.log('date', new Date(year - 10, new Date().getMonth(), 1), new Date())
      DummyPost.aggregate([
        {
          $match: {
            created: {
              $gte: new Date(year - 10, new Date().getMonth(), 1),
              $lte: new Date()
            },
          },
        },
        {
          $addFields: {
            date: {
              $month: '$created'
            }
          }
        }, {
          $group: {
            _id: '$date',
            Totalcount: {
              $sum: 1
            }
          }
        }, {
          $sort: {
            _id: 1
          }
        }]).then((allPost) => {
          allPost.map((item, i) => {
            count.splice(i, 0, item.Totalcount);
          })
          let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', { months, count });
          return res.send(data);
        })
        .catch((e) => {
          let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, e);
          return res.send(data);
        })
  })

  static getMaxPostUser = asyncWrapper(async (req, res) => {
    const orCondition = []
    const months = req.body.monthArry;
    if (months.length) {
      months.map((item) => {
        orCondition.push({ month: { $eq: item } })
      })
    }
    else {
      orCondition.push({})
    }
    DummyPost.aggregate([{
      $addFields: {
        month: {
          $month: '$created'
        }
      }
    }, {
      $match: {
        $or: orCondition
      }
    }, {
      $group: {
        _id: '$createdBy',
        count: {
          $sum: 1
        }
      }
    }, {
      $sort: {
        count: -1
      },
    }, {
      $project: {
        userId: '$_id',
        count: '$count'
      }
    }, {
      $limit: 3
    }
    ]).then((allPost) => {
      let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', allPost);
      return res.send(data);
    })

  })

  static getHighestReportedUser = asyncWrapper(async (req, res) => {
    Report.aggregate([{
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
      $group: {
        _id: '$post.createdBy',
        count: {
          $sum: 1
        }
      }
    }, {
      $sort: {
        count: -1
      }
    }, {
      $project: {
        count: '$count'
      }
    }, {
      $lookup: {
        from: 'users',
        localField: '_id',
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
        email: '$user.email',
        count: '$count',
        userId: '$_id'
      }
    }]).then((reporteduser) => {
      reporteduser = reporteduser.filter((item) => {
        return item.name !== undefined;
      })
      let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', reporteduser);
      return res.send(data);
    })
  })
  // get inactive user who not post, like, comment in last month
  static getInactiveUser = asyncWrapper(async (req, res) => {
    const users = [];
    const year = req.body.year || new Date().getFullYear();
    const start = new Date(year, new Date().getMonth() - 1, 1);
    const end = new Date()
   
    User.find({ "userType": "User", }).then(async (user) => {
      user.map((item, i) => {
        Post.find({
          created: {
            $gt: start,
            $lte: end
          },
          createdBy: mongoose.Types.ObjectId(item._id)
        }).then((post) => {
          if (post.length === 0) {
            Like.find({
              created: {
                $gt: start,
                $lte: end
              },
              likedBy: mongoose.Types.ObjectId(item._id)
            })
              .then((like) => {
                if (like.length === 0) {
                  Comment.find({
                    created: {
                      $gt: start,
                      $lte: end
                    },
                    userId: mongoose.Types.ObjectId(item._id)
                  })
                    .then((comment) => {
                      if (comment.length === 0) {
                        users.push(item)
                      }
                    }
                    )
                }
              }
              )
          }
        })
      })
      await delay(500);
      let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', users);
      return res.send(data);
    })

  })

  static deleteOpenReq = asyncWrapper(async (req, res) => {
    const userData = tokenDecode(req.headers.authorization);
    UnblockReq.find({ _id: req.params.reqId }, async function (err, userReq) {
      // if (userReq.length > 0 && userData.userType === "Admin") {    //only Admin can delete the req
      if (userReq.length > 0) {    // all user can delete req
        await UnblockReq.findByIdAndDelete({ _id: mongoose.Types.ObjectId(req.params.reqId) }).then(async (delRes) => {
          const notification = new Notification({
            owner: userReq[0].userId,
            postId: userReq[0].postId,
            description: (userReq.type === "Post") ? `your repopen request for Post ${userReq[0].postId} has been terminated` : `Yoar account reopen request has been terminated`,
          })
          try {
            await notification.save();
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Request deleted successfully');
            return res.send(data);
          } catch (err) {
            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
          }
        })
      }
      else {
        let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, 'No Post Found');
        return res.send(data);
      }
    })
  })
}

export default Admin;
