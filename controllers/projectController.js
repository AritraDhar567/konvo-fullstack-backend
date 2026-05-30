// Create project
const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.userId;
    console.log(`[PROJECTS] CREATE request - User ID: ${userId}, Title: "${title}"`);

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
      console.error(`[PROJECTS] CREATE database error:`, error.message);
      return res.status(500).json({ message: 'Failed to create project' });
    }

    console.log(`[PROJECTS] CREATE success - Project ID: ${project.id} created for User ID: ${userId}`);

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
    console.log(`[PROJECTS] GET_USER_PROJECTS request - User ID: ${userId}`);

    const { data: projects, error } = await req.supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`[PROJECTS] GET_USER_PROJECTS DB error:`, error.message);
      return res.status(500).json({ message: 'Failed to fetch projects' });
    }

    console.log(`[PROJECTS] GET_USER_PROJECTS success - User ID: ${userId}, Count: ${projects.length}`);

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
    console.log(`[PROJECTS] GET_BY_ID request - User ID: ${userId}, Project ID: ${id}`);

    const { data: project, error } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!project) {
      console.log(`[PROJECTS] GET_BY_ID failed - Project not found: ${id} for User ID: ${userId}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    if (error) {
      console.error(`[PROJECTS] GET_BY_ID database error:`, error.message);
      return res.status(500).json({ message: 'Failed to fetch project' });
    }

    console.log(`[PROJECTS] GET_BY_ID success - User ID: ${userId}, Project ID: ${id}`);

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
    console.log(`[PROJECTS] UPDATE request - User ID: ${userId}, Project ID: ${id}`);

    // Check if project belongs to user
    const { data: existingProject } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingProject) {
      console.log(`[PROJECTS] UPDATE failed - Not authorized for Project ID: ${id} (User ID: ${userId})`);
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
      console.error(`[PROJECTS] UPDATE database error:`, error.message);
      return res.status(500).json({ message: 'Failed to update project' });
    }

    console.log(`[PROJECTS] UPDATE success - Project ID: ${id} updated by User ID: ${userId}`);

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
    console.log(`[PROJECTS] DELETE request - User ID: ${userId}, Project ID: ${id}`);

    // Check if project belongs to user
    const { data: existingProject } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingProject) {
      console.log(`[PROJECTS] DELETE failed - Not authorized for Project ID: ${id} (User ID: ${userId})`);
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
      console.error(`[PROJECTS] DELETE database error:`, error.message);
      return res.status(500).json({ message: 'Failed to delete project' });
    }

    console.log(`[PROJECTS] DELETE success - Project ID: ${id} deleted by User ID: ${userId}`);

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
