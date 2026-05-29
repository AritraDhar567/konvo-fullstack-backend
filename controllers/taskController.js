// Create task
const createTask = async (req, res) => {
  try {
    const { title, project_id, due_date } = req.body;
    const userId = req.userId;

    // Verify project belongs to user
    const { data: project } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', userId)
      .single();

    if (!project) {
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
      return res.status(500).json({ message: 'Failed to create task' });
    }

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
      return res.status(500).json({ message: 'Failed to fetch tasks' });
    }

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

    // Verify project belongs to user
    const { data: project } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!project) {
      return res.status(403).json({ message: 'Not authorized to view these tasks' });
    }

    const { data: tasks, error } = await req.supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch tasks' });
    }

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
      return res.status(404).json({ message: 'Task not found' });
    }

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch task' });
    }

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
      return res.status(500).json({ message: 'Failed to update task' });
    }

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
      return res.status(500).json({ message: 'Failed to toggle task' });
    }

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
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    const { error } = await req.supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to delete task' });
    }

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
