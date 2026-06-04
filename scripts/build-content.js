#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');

/**
 * Build script to convert markdown content to JSON data
 * This runs at build time to create static data files
 */

const CONTENT_DIR = path.join(__dirname, '../src/content');
const OUTPUT_DIR = path.join(__dirname, '../src/data');
const PUBLIC_DIR = path.join(__dirname, '../public');

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

function getGitCommitDate(filePath) {
  try {
    const result = execSync(`git log --follow -1 --format="%aI" -- "${filePath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return result ? new Date(result) : new Date();
  } catch {
    return new Date();
  }
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
      directory,
      gitDate: getGitCommitDate(filePath),
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    throw error;
  }
}

async function buildRssFeed(calendarData) {
  const SITE_URL = process.env.SITE_URL || 'https://shiftingcorridors.com';
  const now = new Date();

  const items = calendarData
    .filter(item => item.meta.date && item.meta.url)
    .map(item => {
      const eventUrl = `${SITE_URL}${item.meta.url}`;
      const pubDate = (item.gitDate || now).toUTCString();

      const descParts = [item.meta.title];
      if (item.meta.date) {
        const d = new Date(item.meta.date);
        descParts.push(d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }));
      }
      if (item.meta.location) descParts.push(item.meta.location);
      if (item.meta.address) descParts.push(item.meta.address);

      return `    <item>
      <title>${escapeXml(item.meta.title)}</title>
      <link>${escapeXml(eventUrl)}</link>
      <guid isPermaLink="true">${escapeXml(eventUrl)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(descParts.join(' — '))}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Shifting Corridors Lodge - Calendar</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Upcoming Pathfinder and Starfinder Society events from the Shifting Corridors Lodge</description>
    <language>en-us</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${SITE_URL}/feed.xml`)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  const outputPath = path.join(PUBLIC_DIR, 'feed.xml');
  await fs.writeFile(outputPath, xml);
  console.log(`✅ Created ${outputPath} with ${calendarData.length} items`);
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
  
  const builtData = {};
  for (const directory of directories) {
    console.log(`📁 Processing ${directory}...`);
    const data = await processDirectory(directory);
    builtData[directory] = data;
    const outputPath = path.join(OUTPUT_DIR, `${directory}.json`);
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Created ${outputPath} with ${data.length} items`);
  }

  console.log('📡 Building RSS feed...');
  await buildRssFeed(builtData.calendar);

  console.log('🎉 Content build complete!');
}

if (require.main === module) {
  buildContent().catch(console.error);
}

module.exports = { buildContent };