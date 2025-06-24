// Simple script to check if the build directory exists and contains index.html
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, '..', 'build');
const indexPath = path.join(buildDir, 'index.html');

console.log('Checking build directory...');

if (fs.existsSync(buildDir)) {
  console.log('✅ Build directory exists');
  
  const files = fs.readdirSync(buildDir);
  console.log(`Found ${files.length} files/directories in build:`);
  files.forEach(file => {
    console.log(`- ${file}`);
  });
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ index.html exists');
    const stats = fs.statSync(indexPath);
    console.log(`index.html size: ${stats.size} bytes`);
    
    // Read the first few bytes to verify it's an HTML file
    const fileContent = fs.readFileSync(indexPath, 'utf8').substring(0, 100);
    
    console.log('First 100 bytes of index.html:');
    console.log(fileContent);
  } else {
    console.log('❌ index.html does not exist');
  }
} else {
  console.log('❌ Build directory does not exist');
}