const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { validateTask } = require('../middleware/validation');

// Create task
router.post('/', validateTask, taskController.createTask);

// Get all tasks for user
router.get('/', taskController.getUserTasks);

// Get tasks by project
router.get('/project/:projectId', taskController.getTasksByProject);

// Get single task
router.get('/:id', taskController.getTaskById);

// Update task
router.put('/:id', taskController.updateTask);

// Toggle task completion
router.patch('/:id/toggle', taskController.toggleTaskCompletion);

// Delete task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
