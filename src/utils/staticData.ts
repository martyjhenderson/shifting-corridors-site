/**
 * Static data utilities for the SPA
 * Replaces the API-based markdown utilities with build-time generated JSON data
 */

// Import the generated JSON data
import calendarData from '../data/calendar.json';
import newsData from '../data/news.json';
import gamemastersData from '../data/gamemasters.json';

export interface MarkdownMeta {
  title?: string;
  date?: string;
  url?: string;
  location?: string;
  address?: string;
  firstName?: string;
  lastInitial?: string;
  organizedPlayNumber?: string;
  games?: string[];
  id?: string;
  [key: string]: any;
}

export interface MarkdownContent {
  meta: MarkdownMeta;
  content: string;
  slug: string;
  directory: string;
}

/**
 * Get all content for a specific directory
 * @param directory The directory to get content from (calendar, news, gamemasters)
 * @returns An array of MarkdownContent objects
 */
export const getMarkdownFiles = async (directory: string): Promise<MarkdownContent[]> => {
  switch (directory) {
    case 'calendar':
      return calendarData as MarkdownContent[];
    case 'news':
      return newsData as MarkdownContent[];
    case 'gamemasters':
      return gamemastersData as MarkdownContent[];
    default:
      console.warn(`Unknown directory: ${directory}`);
      return [];
  }
};

/**
 * Get a specific markdown file by slug
 * @param directory The directory to search in
 * @param slug The slug of the file to find
 * @returns A MarkdownContent object or null if not found
 */
export const getMarkdownFile = async (directory: string, slug: string): Promise<MarkdownContent | null> => {
  const files = await getMarkdownFiles(directory);
  return files.find(file => file.slug === slug) || null;
};

/**
 * Get calendar events sorted by date
 * @returns Calendar events sorted by date (most recent first)
 */
export const getCalendarEvents = async (): Promise<MarkdownContent[]> => {
  const events = await getMarkdownFiles('calendar');
  return events.sort((a, b) => {
    const dateA = new Date(a.meta.date || '1970-01-01');
    const dateB = new Date(b.meta.date || '1970-01-01');
    return dateB.getTime() - dateA.getTime();
  });
};

/**
 * Get upcoming calendar events (future dates only)
 * @returns Upcoming calendar events sorted by date
 */
export const getUpcomingEvents = async (): Promise<MarkdownContent[]> => {
  const events = await getCalendarEvents();
  const now = new Date();
  return events.filter(event => {
    const eventDate = new Date(event.meta.date || '1970-01-01');
    return eventDate >= now;
  });
};

/**
 * Get news articles sorted by date
 * @returns News articles sorted by date (most recent first)
 */
export const getNewsArticles = async (): Promise<MarkdownContent[]> => {
  const articles = await getMarkdownFiles('news');
  return articles.sort((a, b) => {
    const dateA = new Date(a.meta.date || '1970-01-01');
    const dateB = new Date(b.meta.date || '1970-01-01');
    return dateB.getTime() - dateA.getTime();
  });
};

/**
 * Get game masters sorted by name
 * @returns Game masters sorted by first name
 */
export const getGameMasters = async (): Promise<MarkdownContent[]> => {
  const gamemasters = await getMarkdownFiles('gamemasters');
  return gamemasters.sort((a, b) => {
    const nameA = a.meta.firstName || '';
    const nameB = b.meta.firstName || '';
    return nameA.localeCompare(nameB);
  });
};

// Legacy compatibility - parseMarkdownFile function for existing code
export const parseMarkdownFile = async (filePath: string): Promise<MarkdownContent> => {
  // Extract directory and filename from path
  const pathParts = filePath.split('/');
  const directory = pathParts[pathParts.length - 2]; // e.g., 'calendar'
  const filename = pathParts[pathParts.length - 1].replace('.md', ''); // e.g., 'event-name'
  
  const file = await getMarkdownFile(directory, filename);
  
  if (!file) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  return file;
};