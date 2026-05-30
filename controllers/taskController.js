// Create task
const createTask = async (req, res) => {
  try {
    const { title, project_id, due_date } = req.body;
    const userId = req.userId;
    console.log(`[TASKS] CREATE request - User ID: ${userId}, Project ID: ${project_id}, Title: "${title}"`);

    // Verify project belongs to user
    const { data: project } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', userId)
      .single();

    if (!project) {
      console.log(`[TASKS] CREATE failed - Not authorized for Project ID: ${project_id} (User ID: ${userId})`);
      return res.status(403).json({ message: 'Not authorized to create task in this project' });
    }

    const { data: task, error } = await req.supabase
      .from('tasks')
      .insert([
        {
          title,
          project_id,
          due_date: due_date || null,
          completed: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(`[TASKS] CREATE database error:`, error.message);
      return res.status(500).json({ message: 'Failed to create task' });
    }

    console.log(`[TASKS] CREATE success - Task ID: ${task.id} created in Project: ${project_id}`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all tasks for user
const getUserTasks = async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`[TASKS] GET_USER_TASKS request - User ID: ${userId}`);

    // Get all tasks from user's projects
    const { data: tasks, error } = await req.supabase
      .from('tasks')
      .select(
        `
        *,
        projects (id, title, user_id)
      `
      )
      .eq('projects.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`[TASKS] GET_USER_TASKS database error:`, error.message);
      return res.status(500).json({ message: 'Failed to fetch tasks' });
    }

    console.log(`[TASKS] GET_USER_TASKS success - User ID: ${userId}, Count: ${tasks.length}`);

    res.status(200).json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get tasks by project
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;
    console.log(`[TASKS] GET_BY_PROJECT request - User ID: ${userId}, Project ID: ${projectId}`);

    // Verify project belongs to user
    const { data: project } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!project) {
      console.log(`[TASKS] GET_BY_PROJECT failed - Not authorized for Project: ${projectId} (User ID: ${userId})`);
      return res.status(403).json({ message: 'Not authorized to view these tasks' });
    }

    const { data: tasks, error } = await req.supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`[TASKS] GET_BY_PROJECT database error:`, error.message);
      return res.status(500).json({ message: 'Failed to fetch tasks' });
    }

    console.log(`[TASKS] GET_BY_PROJECT success - User ID: ${userId}, Project ID: ${projectId}, Count: ${tasks.length}`);

    res.status(200).json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single task
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    console.log(`[TASKS] GET_BY_ID request - User ID: ${userId}, Task ID: ${id}`);

    const { data: task, error } = await req.supabase
      .from('tasks')
      .select(
        `
        *,
        projects (id, title, user_id)
      `
      )
      .eq('id', id)
      .eq('projects.user_id', userId)
      .single();

    if (!task) {
      console.log(`[TASKS] GET_BY_ID failed - Task not found: ${id} for User ID: ${userId}`);
      return res.status(404).json({ message: 'Task not found' });
    }

    if (error) {
      console.error(`[TASKS] GET_BY_ID database error:`, error.message);
      return res.status(500).json({ message: 'Failed to fetch task' });
    }

    console.log(`[TASKS] GET_BY_ID success - User ID: ${userId}, Task ID: ${id}`);

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, due_date, completed } = req.body;
    const userId = req.userId;
    console.log(`[TASKS] UPDATE request - User ID: ${userId}, Task ID: ${id}`);

    // Verify task belongs to user's project
    const { data: task } = await req.supabase
      .from('tasks')
      .select(
        `
        *,
        projects (id, title, user_id)
      `
      )
      .eq('id', id)
      .eq('projects.user_id', userId)
      .single();

    if (!task) {
      console.log(`[TASKS] UPDATE failed - Not authorized for Task: ${id} (User ID: ${userId})`);
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const updatedTask = {};
    if (title) updatedTask.title = title;
    if (due_date) updatedTask.due_date = due_date;
    if (completed !== undefined) updatedTask.completed = completed;

    const { data: updatedTaskData, error } = await req.supabase
      .from('tasks')
      .update(updatedTask)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[TASKS] UPDATE database error:`, error.message);
      return res.status(500).json({ message: 'Failed to update task' });
    }

    console.log(`[TASKS] UPDATE success - Task ID: ${id} updated by User ID: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTaskData,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle task completion
const toggleTaskCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    console.log(`[TASKS] TOGGLE request - User ID: ${userId}, Task ID: ${id}`);

    // Get current task
    const { data: task } = await req.supabase
      .from('tasks')
      .select(
        `
        *,
        projects (id, title, user_id)
      `
      )
      .eq('id', id)
      .eq('projects.user_id', userId)
      .single();

    if (!task) {
      console.log(`[TASKS] TOGGLE failed - Not authorized for Task: ${id} (User ID: ${userId})`);
      return res.status(403).json({ message: 'Not authorized to toggle this task' });
    }

    // Toggle completion status
    const { data: updatedTask, error } = await req.supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[TASKS] TOGGLE database error:`, error.message);
      return res.status(500).json({ message: 'Failed to toggle task' });
    }

    console.log(`[TASKS] TOGGLE success - Task ID: ${id} completion toggled to ${updatedTask.completed} by User ID: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Task toggled successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    console.log(`[TASKS] DELETE request - User ID: ${userId}, Task ID: ${id}`);

    // Verify task belongs to user's project
    const { data: task } = await req.supabase
      .from('tasks')
      .select(
        `
        *,
        projects (id, title, user_id)
      `
      )
      .eq('id', id)
      .eq('projects.user_id', userId)
      .single();

    if (!task) {
      console.log(`[TASKS] DELETE failed - Not authorized for Task: ${id} (User ID: ${userId})`);
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    const { error } = await req.supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[TASKS] DELETE database error:`, error.message);
      return res.status(500).json({ message: 'Failed to delete task' });
    }

    console.log(`[TASKS] DELETE success - Task ID: ${id} deleted by User ID: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTask,
  getUserTasks,
  getTasksByProject,
  getTaskById,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
};
