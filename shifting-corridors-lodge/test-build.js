// Comprehensive script to check the build directory and its contents
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, 'build');

// Function to recursively list all files in a directory
function listFilesRecursively(dir, baseDir = dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

console.log('=== BUILD DIRECTORY VERIFICATION ===');

if (fs.existsSync(buildDir)) {
  console.log('✅ Build directory exists');
  
  // List all files recursively
  const allFiles = listFilesRecursively(buildDir);
  console.log(`Found ${allFiles.length} files in build directory`);
  
  // Check for critical files
  const indexHtml = path.join(buildDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    console.log('✅ index.html exists');
    const stats = fs.statSync(indexHtml);
    console.log(`   Size: ${stats.size} bytes`);
    
    // Read the first few bytes to verify it's an HTML file
    const fileContent = fs.readFileSync(indexHtml, 'utf8').substring(0, 100);
    console.log('   First 100 bytes:');
    console.log(`   ${fileContent.replace(/\n/g, '\n   ')}`);
  } else {
    console.log('❌ index.html does not exist');
  }
  
  // Check for static directory
  const staticDir = path.join(buildDir, 'static');
  if (fs.existsSync(staticDir) && fs.statSync(staticDir).isDirectory()) {
    console.log('✅ static directory exists');
    
    // Count JS and CSS files
    const jsFiles = allFiles.filter(file => file.startsWith('static/js/') && file.endsWith('.js'));
    const cssFiles = allFiles.filter(file => file.startsWith('static/css/') && file.endsWith('.css'));
    
    console.log(`   Found ${jsFiles.length} JavaScript files`);
    console.log(`   Found ${cssFiles.length} CSS files`);
  } else {
    console.log('❌ static directory does not exist');
  }
  
  // List all top-level files and directories
  console.log('\nTop-level files and directories:');
  fs.readdirSync(buildDir, { withFileTypes: true }).forEach(entry => {
    const type = entry.isDirectory() ? 'Directory' : 'File';
    console.log(`- ${entry.name} (${type})`);
  });
  
  // Print all files (limited to first 20)
  console.log('\nAll files (first 20):');
  allFiles.slice(0, 20).forEach(file => {
    console.log(`- ${file}`);
  });
  
  if (allFiles.length > 20) {
    console.log(`... and ${allFiles.length - 20} more files`);
  }
} else {
  console.log('❌ Build directory does not exist');
}