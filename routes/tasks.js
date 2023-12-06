import express from 'express';
const router = express.Router();
import Tasks from "../controllers/task.js";

router.get('/', Tasks.getAllTasks);
router.post('/', Tasks.createTask);
router.get('/:id', Tasks.getTaskById);
router.put('/:id', Tasks.updateTask);
router.delete('/:id', Tasks.deleteTask);



export default router;
