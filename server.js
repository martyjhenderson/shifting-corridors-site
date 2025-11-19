const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// API endpoint to get a list of files in a directory
app.get('/api/files', async (req, res) => {
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
    
    const dirPath = path.join(__dirname, normalizedDir);
    
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
});

// API endpoint to get the content of a file
app.get('/api/file', async (req, res) => {
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
    
    const fullPath = path.join(__dirname, normalizedPath);
    
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
});

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});