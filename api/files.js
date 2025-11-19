const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  try {
    const { directory } = req.query;
    
    if (!directory) {
      return res.status(400).json({ error: 'Directory parameter is required' });
    }
    
    // Ensure the directory is within the project
    const normalizedDir = path.normalize(directory);
    if (normalizedDir.startsWith('..') || path.isAbsolute(normalizedDir)) {
      return res.status(403).json({ error: 'Invalid directory path' });
    }
    
    const dirPath = path.join(process.cwd(), normalizedDir);
    
    // Check if the directory exists
    try {
      await fs.access(dirPath);
    } catch (error) {
      return res.status(404).json({ error: 'Directory not found' });
    }
    
    // Get the list of files
    const files = await fs.readdir(dirPath);
    
    // Filter for markdown files
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    res.json(markdownFiles);
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
};