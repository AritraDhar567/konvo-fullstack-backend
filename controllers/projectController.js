// Create project
const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.userId;

    const { data: project, error } = await req.supabase
      .from('projects')
      .insert([
        {
          title,
          description: description || '',
          user_id: userId,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Failed to create project' });
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all projects for user
const getUserProjects = async (req, res) => {
  try {
    const userId = req.userId;

    const { data: projects, error } = await req.supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch projects' });
    }

    res.status(200).json({
      success: true,
      projects,
      count: projects.length,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single project
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const { data: project, error } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch project' });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const userId = req.userId;

    // Check if project belongs to user
    const { data: existingProject } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingProject) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const { data: project, error } = await req.supabase
      .from('projects')
      .update({
        title,
        description,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Failed to update project' });
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Check if project belongs to user
    const { data: existingProject } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingProject) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    // Delete all tasks associated with project
    await req.supabase
      .from('tasks')
      .delete()
      .eq('project_id', id);

    // Delete project
    const { error } = await req.supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to delete project' });
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
