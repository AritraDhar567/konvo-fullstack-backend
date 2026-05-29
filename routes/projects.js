const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { validateProject } = require('../middleware/validation');

// Create project
router.post('/', validateProject, projectController.createProject);

// Get all projects for user
router.get('/', projectController.getUserProjects);

// Get single project
router.get('/:id', projectController.getProjectById);

// Update project
router.put('/:id', validateProject, projectController.updateProject);

// Delete project
router.delete('/:id', projectController.deleteProject);

module.exports = router;
