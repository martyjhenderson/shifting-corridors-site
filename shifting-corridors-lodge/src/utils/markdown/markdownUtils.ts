import matter from 'gray-matter';

export interface MarkdownMeta {
  title: string;
  date: string;
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
}

/**
 * Get all markdown files from a directory
 * @param directory The directory to read from (calendar, news, gamemasters)
 * @returns An array of MarkdownContent objects
 */
export const getMarkdownFiles = async (directory: string): Promise<MarkdownContent[]> => {
  try {
    console.log(`Fetching markdown files from directory: ${directory}`);
    
    // Get a list of files in the directory
    const response = await fetch(`/api/files?directory=src/content/${directory}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch files from ${directory}:`, response.statusText);
      console.log(`Falling back to hardcoded data for ${directory}`);
      return getFallbackData(directory);
    }
    
    const files = await response.json();
    console.log(`Found ${files.length} files in ${directory}:`, files);
    
    if (!files || files.length === 0) {
      console.log(`No files found in ${directory}, using fallback data`);
      return getFallbackData(directory);
    }
    
    // Parse each file
    const markdownContents = await Promise.all(
      files.map((file: string) => parseMarkdownFile(`src/content/${directory}/${file}`))
    );
    
    console.log(`Parsed ${markdownContents.length} markdown files from ${directory}`);
    return markdownContents;
  } catch (error) {
    console.error(`Error fetching markdown files from ${directory}:`, error);
    
    // Fallback to hardcoded data for demo purposes
    console.log(`Using fallback data for ${directory} due to error`);
    return getFallbackData(directory);
  }
};

/**
 * Parse a markdown file
 * @param filePath The path to the markdown file
 * @returns A MarkdownContent object
 */
export const parseMarkdownFile = async (filePath: string): Promise<MarkdownContent> => {
  try {
    console.log(`Parsing markdown file: ${filePath}`);
    // Fetch the file content
    const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch file ${filePath}:`, response.statusText);
      // For development/testing, try to extract the filename and check if we have fallback data
      const fileName = filePath.split('/').pop()?.replace(/\.md$/, '') || '';
      console.log(`Attempting to find fallback data for: ${fileName}`);
      
      // Extract directory from filePath
      const directory = filePath.split('/').slice(-2, -1)[0];
      const fallbackData = getFallbackData(directory);
      const matchingFallback = fallbackData.find(item => item.slug === fileName);
      
      if (matchingFallback) {
        console.log(`Found fallback data for ${fileName}`);
        return matchingFallback;
      }
      
      return {
        meta: { title: '', date: '' },
        content: '',
        slug: ''
      };
    }
    
    const fileContent = await response.text();
    console.log(`File content received for ${filePath}`);
    
    // Parse the frontmatter and content
    const { data, content } = matter(fileContent);
    console.log(`Parsed frontmatter for ${filePath}:`, data);
    
    // Extract the slug from the file path
    const slug = filePath.split('/').pop()?.replace(/\.md$/, '') || '';
    
    return {
      meta: data as MarkdownMeta,
      content,
      slug
    };
  } catch (error) {
    console.error(`Error parsing markdown file ${filePath}:`, error);
    return {
      meta: { title: '', date: '' },
      content: '',
      slug: ''
    };
  }
};

/**
 * Get fallback data for a directory
 * @param directory The directory to get fallback data for
 * @returns An array of MarkdownContent objects
 */
const getFallbackData = (directory: string): MarkdownContent[] => {
  if (directory === 'calendar') {
    return [
      {
        meta: {
          title: 'Pathfinder Society at Diversions',
          date: '2025-06-25', // This will be parsed correctly with our new date handling
          url: '/events/diversions-game-night',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Pathfinder Society at Diversions

Join us for Pathfinder Society games at Diversions in Coralville!

## Details

- **Date:** June 25, 2025
- **Time:** 6:00 PM - 10:00 PM
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

1. **Silver Bark, Golden Blades** - [Sign up here](https://www.rpgchronicles.net/session/ec927ed1-61f4-4441-af7f-de92051b4367/pregame)
2. **All That Glitters** - [Sign up here](https://www.rpgchronicles.net/session/2d61cf38-9249-43b0-a514-5c849bd3d7e6/pregame)

## Registration

Please register in advance using the links above. Space is limited, so sign up early!
        `,
        slug: 'diversions-game-night'
      },
      {
        meta: {
          title: 'Pathfinder Society at Geek City Games',
          date: '2025-06-29', // This will be parsed correctly with our new date handling
          url: '/events/gcg-29Jun2025',
          location: 'Geek City Games',
          address: '365 Beaver Kreek Center suite b, North Liberty, IA 52317'
        },
        content: `
# Pathfinder Society at Geek City Games

Join us for Pathfinder Society games at Geek City Games in North Liberty!

## Details

- **Date:** June 29, 2025
- **Time:** 12:00 noon - 4:30pm
- **Location:** Geek City Games
- **Address:** 365 Beaver Kreek Center suite b, North Liberty, IA 52317

## Available Scenarios

1. **Negotiations for the Star Gun** - [Sign up here](https://www.rpgchronicles.net/session/1f7ab80c-4cdc-44c3-b13d-dcdb33d45d54/pregame)

## Registration

Please register in advance using the links above. Space is limited, so sign up early!
        `,
        slug: 'gcg-29Jun2025'
      }
    ];
  } else if (directory === 'news') {
    return [
      {
        meta: {
          title: 'New Lodge Website Launched',
          date: '2025-06-23',
          id: 'new-lodge-website'
        },
        content: `
# New Lodge Website Launched

We're excited to announce the launch of our new Shifting Corridors Lodge website!

This new site will help us better coordinate events and share information with our community.

## Features

- Event calendar with upcoming games
- List of Game Masters
- News updates
- Contact information

Stay tuned for more updates and events!
        `,
        slug: 'new-lodge-website'
      }
    ];
  } else if (directory === 'gamemasters') {
    return [
      {
        meta: {
          title: 'Game Master: Marty H.',
          date: '2025-06-23',
          firstName: 'Marty',
          lastInitial: 'H',
          organizedPlayNumber: '30480',
          games: ['Pathfinder', 'Starfinder']
        },
        content: `
Marty is the Corridor Venture-Lieutenant and a Game Master who runs scenarios for Pathfinder 2E and Starfinder 2E. He specializes in creating immersive roleplaying experiences and his collection of maps and lending of dice.
        `,
        slug: 'marty-h'
      },
      {
        meta: {
          title: 'Game Master: Josh G.',
          date: '2025-06-23',
          firstName: 'Josh',
          lastInitial: 'G',
          organizedPlayNumber: '13151',
          games: ['Pathfinder']
        },
        content: `
Josh is an experienced Game Master with a legacy of running games stretching back before Pathfinder existed. His sense of humor and desire to see the players laugh makes for a great experience.
        `,
        slug: 'josh-g'
      }
    ];
  }
  
  return [];
};