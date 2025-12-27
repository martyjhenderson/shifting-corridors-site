#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

/**
 * Build script to convert markdown content to JSON data
 * This runs at build time to create static data files
 */

const CONTENT_DIR = path.join(__dirname, '../src/content');
const OUTPUT_DIR = path.join(__dirname, '../src/data');

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function processMarkdownFile(filePath, directory) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: meta, content: markdownContent } = matter(content);
    
    const fileName = path.basename(filePath, '.md');
    
    return {
      meta,
      content: markdownContent,
      slug: fileName,
      directory
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    throw error;
  }
}

async function processDirectory(directory) {
  const dirPath = path.join(CONTENT_DIR, directory);
  const files = await fs.readdir(dirPath);
  const markdownFiles = files.filter(file => file.endsWith('.md'));
  
  const processedFiles = await Promise.all(
    markdownFiles.map(file => 
      processMarkdownFile(path.join(dirPath, file), directory)
    )
  );
  
  // Sort by date for calendar and news
  if (directory === 'calendar' || directory === 'news') {
    processedFiles.sort((a, b) => {
      const dateA = new Date(a.meta.date);
      const dateB = new Date(b.meta.date);
      return dateB - dateA; // Most recent first
    });
  }
  
  return processedFiles;
}

async function buildContent() {
  console.log('🔄 Building static content data...');
  
  await ensureDir(OUTPUT_DIR);
  
  const directories = ['calendar', 'news', 'gamemasters'];
  
  for (const directory of directories) {
    console.log(`📁 Processing ${directory}...`);
    const data = await processDirectory(directory);
    const outputPath = path.join(OUTPUT_DIR, `${directory}.json`);
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Created ${outputPath} with ${data.length} items`);
  }
  
  console.log('🎉 Content build complete!');
}

if (require.main === module) {
  buildContent().catch(console.error);
}

module.exports = { buildContent };