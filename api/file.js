const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    // Ensure the file is within the project
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
      return res.status(403).json({ error: 'Invalid file path' });
    }
    
    const fullPath = path.join(process.cwd(), normalizedPath);
    
    // Check if the file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Read the file content
    const content = await fs.readFile(fullPath, 'utf-8');
    
    res.send(content);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
};