import Task from "../models/Task.js"
import asyncWrapper from "../middleware/async.js"

class Tasks {

    static getAllTasks = asyncWrapper(async (req, res) => {
        const getAllTasks = await Task.find()
        res.status(200).json({ getAllTasks })
    })

    static createTask = asyncWrapper(async (req, res) => {
        const task = await Task.create(req.body)
        res.status(200).json({ task })
    })

    static updateTask = asyncWrapper(async (req, res) => {
        // res.send('Update Task')
        const updateTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.status(200).json({ updateTask })
    })

    static deleteTask = asyncWrapper(async (req, res) => {
        const deleteTask = await Task.findByIdAndDelete(req.params.id)
        res.json({ deleteTask })
        // res.send('Delete Task')
    })

    static getTaskById = asyncWrapper(async (req, res) => {
        const task = await Task.findById(req.params.id)
        res.json({ task })
        // res.send('Get Task By Id')
    })

}

export default Tasks;


  // static getAllTasks = async (req, res) => {
    //     try {
    //         const getAllTasks = await Task.find()
    //         res.status(200).json({ getAllTasks })
    //     } catch (error) {
    //         res.status(500).json({ error })
    //     }
    //     // res.send('Get All Tasks')
    // }

    //! This is the same as the above code
    //we are using asyncWrapper because we are using async middlerware and with this we don't need to use try catch every time 