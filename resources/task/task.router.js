const  express = require ('express');

const { createTask, getAllTasks, updateTask, deleteTask } = require('./task.controller.js')

const router = express.Router();

router.post('/:accountId/:projectId/tasks', createTask);
router.get('/:accountId/:projectId/tasks', getAllTasks);
router.patch('/:accountId/:projectId/tasks/:id', updateTask);
router.delete('/:accountId/:projectId/tasks/:id', deleteTask);

module.exports = router;