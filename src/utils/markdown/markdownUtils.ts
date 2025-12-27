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
    // Check if we should use fallback data
    if (process.env.REACT_APP_USE_FALLBACK === 'true') {
      return getFallbackData(directory);
    }

    // Use API in development and production, fallback only on error
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
    const response = await fetch(`${apiBaseUrl}/api/files?directory=src/content/${directory}`);

    if (!response.ok) {
      console.warn(`API call failed for directory ${directory}, using fallback data`);
      return getFallbackData(directory);
    }

    const files = await response.json();

    if (!files || files.length === 0) {
      console.warn(`No files found for directory ${directory}, using fallback data`);
      return getFallbackData(directory);
    }

    // Parse each file
    const markdownContents = await Promise.all(
      files.map((file: string) => parseMarkdownFile(`src/content/${directory}/${file}`))
    );

    return markdownContents;
  } catch (error) {
    console.error(`Error fetching markdown files for ${directory}:`, error);
    // Fallback to hardcoded data on error
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
    // Check if we should use fallback data
    if (process.env.REACT_APP_USE_FALLBACK === 'true') {
      const fileName = filePath.split('/').pop()?.replace(/\.md$/, '') || '';
      const directory = filePath.split('/').slice(-2, -1)[0];
      const fallbackData = getFallbackData(directory);
      const matchingFallback = fallbackData.find(item => item.slug === fileName);
      
      if (matchingFallback) {
        return matchingFallback;
      }
    }

    // Fetch the file content
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
    const response = await fetch(`${apiBaseUrl}/api/file?path=${encodeURIComponent(filePath)}`);

    if (!response.ok) {
      // For development/testing, try to extract the filename and check if we have fallback data
      const fileName = filePath.split('/').pop()?.replace(/\.md$/, '') || '';

      // Extract directory from filePath
      const directory = filePath.split('/').slice(-2, -1)[0];
      const fallbackData = getFallbackData(directory);
      const matchingFallback = fallbackData.find(item => item.slug === fileName);

      if (matchingFallback) {
        return matchingFallback;
      }

      return {
        meta: { title: '', date: '' },
        content: '',
        slug: ''
      };
    }

    const fileContent = await response.text();

    // Parse the frontmatter and content
    const { data, content } = matter(fileContent);

    // Extract the slug from the file path
    const slug = filePath.split('/').pop()?.replace(/\.md$/, '') || '';

    return {
      meta: data as MarkdownMeta,
      content,
      slug
    };
  } catch (error) {
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
          title: 'Pathfinder Society at Tempest Games - In the Footsteps of Horror',
          date: '2025-08-07',
          url: '/events/tempest-footsteps-horror',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** August 7, 2025
- **Time:** 5:30 PM - 7:30 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405

## Available Scenarios

1. **In the Footsteps of Horror** - [Sign up here](https://www.rpgchronicles.net/session/d219533f-7c5f-4c3b-a1e2-d0cc5a4ba738/pregame)

## Registration

Please register in advance using the link above. Space is limited, so sign up early!
        `,
        slug: 'tempest-footsteps-horror'
      },
      {
        meta: {
          title: 'Pathfinder Society at Tempest Games - Friends in Need',
          date: '2025-08-21',
          url: '/events/tempest-friends-need',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** August 21, 2025
- **Time:** 5:30 PM - 7:30 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405

## Available Scenarios

1. **Friends in Need** - [Sign up here](https://www.rpgchronicles.net/session/ad20d81b-0f4d-489f-b32b-0fe903c61ce7/pregame)

## Registration

Please register in advance using the link above. Space is limited, so sign up early!
        `,
        slug: 'tempest-friends-need'
      },
      {
        meta: {
          title: 'Pathfinder Society at Diversions - August 13',
          date: '2025-08-13',
          url: '/events/diversions-aug-13-2025',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Pathfinder Society at Diversions

Join us for Pathfinder Society games at Diversions in Coralville!

## Details

- **Date:** August 13, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

1. **Equal Exchanges - Necessary Introductions** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/07a089df-0586-45f3-b32d-58424e83932b/pregame)
2. **Escaping the Grave** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/c8527f0c-c2dd-415f-adb4-7859171f2930/pregame)

## Registration

Please register in advance using the links above. Space is limited, so sign up early!
        `,
        slug: 'diversions-aug-13-2025'
      },
      {
        meta: {
          title: 'Pathfinder & Starfinder Society at Diversions - August 27',
          date: '2025-08-27',
          url: '/events/diversions-aug-27-2025',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Pathfinder & Starfinder Society at Diversions

Join us for Pathfinder and Starfinder Society games at Diversions in Coralville!

## Details

- **Date:** August 27, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

### Pathfinder Society
1. **The Arclord Who Never Was** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/23a3535e-127b-4eef-8b3e-b6b1ceb3ea77/pregame)
2. **Enough is Enough** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/0f44070c-3ae2-44d0-b666-8a6ffc52e38c/pregame)

### Starfinder Society
1. **Mystery of the Frozen Moon** (Levels 1-2, 5:30 PM - 8:30 PM) - [Sign up here](https://www.rpgchronicles.net/session/eb62c1ba-2514-4981-9c95-b3250b4ac763/pregame)

## Registration

Please register in advance using the links above. Space is limited, so sign up early!
        `,
        slug: 'diversions-aug-27-2025'
      },
      {
        meta: {
          title: 'Pathfinder Society at Tempest Games - The Dacilane Academy\'s Show Must Go On',
          date: '2025-09-04',
          url: '/events/tempest-dacilane-academy',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** September 4, 2025
- **Time:** 5:30 PM - 7:30 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405
- **Players:** 6 players
- **Level Range:** 1-2

## Available Scenarios

1. **The Dacilane Academy's Show Must Go On** - [Sign up here](https://www.rpgchronicles.net/session/3028ffc6-0f67-45e7-ba77-a70e3c741a29/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'tempest-dacilane-academy'
      },
      {
        meta: {
          title: 'Pathfinder Society at Geek City Games - Sewer Dragon Crisis',
          date: '2025-09-07',
          url: '/events/gcg-sewer-dragon-crisis',
          location: 'Geek City Games',
          address: '365 Beaver Kreek Center suite b, North Liberty, IA 52317'
        },
        content: `
# Pathfinder Society at Geek City Games

Join us for Pathfinder Society games at Geek City Games in North Liberty!

## Details

- **Date:** September 7, 2025
- **Time:** 12:00 noon - 4:00 PM Central Time
- **Location:** Geek City Games
- **Address:** 365 Beaver Kreek Center suite b, North Liberty, IA 52317
- **Players:** 6 players
- **Level Range:** 1-4

## Available Scenarios

1. **Sewer Dragon Crisis** - [Sign up here](https://www.rpgchronicles.net/session/010e5942-8722-48f0-b380-e839fecdce13/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'gcg-sewer-dragon-crisis'
      },
      {
        meta: {
          title: 'Pathfinder Society at Diversions - September 10',
          date: '2025-09-10',
          url: '/events/diversions-sep-10-2025',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Pathfinder Society at Diversions

Join us for Pathfinder Society games at Diversions in Coralville!

## Details

- **Date:** September 10, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

1. **Shipyard Sabotage** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/59aa83e4-ae3a-4177-b1f5-d208c3ce05ce/pregame)
2. **Return to the Grave** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/64171021-1b29-4b7d-afc1-9292d2fe14c0/pregame)

## Registration

Please register in advance using the links above. Space is limited, so sign up early!
        `,
        slug: 'diversions-sep-10-2025'
      },
      {
        meta: {
          title: 'Pathfinder Society at Tempest Games - Infernal Infiltration',
          date: '2025-09-18',
          url: '/events/tempest-infernal-infiltration',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** September 18, 2025
- **Time:** 5:30 PM - 7:30 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405
- **Players:** 6 players
- **Level Range:** 1-4

## Available Scenarios

1. **Infernal Infiltration** - [Sign up here](https://www.rpgchronicles.net/session/c93bb5bf-97cb-4072-a922-80c018db3cf9/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'tempest-infernal-infiltration'
      },
      {
        meta: {
          title: 'Pathfinder Society at Geek City Games - Fury\'s Toll',
          date: '2025-09-21',
          url: '/events/gcg-furys-toll',
          location: 'Geek City Games',
          address: '365 Beaver Kreek Center suite b, North Liberty, IA 52317'
        },
        content: `
# Pathfinder Society at Geek City Games

Join us for Pathfinder Society games at Geek City Games in North Liberty!

## Details

- **Date:** September 21, 2025
- **Time:** 12:00 noon - 4:00 PM Central Time
- **Location:** Geek City Games
- **Address:** 365 Beaver Kreek Center suite b, North Liberty, IA 52317
- **Players:** 6 players

## Available Scenarios

1. **Fury's Toll** - [Sign up here](https://www.rpgchronicles.net/session/7244b682-41d9-4e50-8dcc-cc8e9744e3e1/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'gcg-furys-toll'
      },
      {
        meta: {
          title: 'Pathfinder & Starfinder Society at Diversions - September 24',
          date: '2025-09-24',
          url: '/events/diversions-sep-24-2025',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Pathfinder & Starfinder Society at Diversions

Join us for Pathfinder and Starfinder Society games at Diversions in Coralville!

## Details

- **Date:** September 24, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

### Starfinder Society
1. **Dreamlink Labs** (Levels 1-2) - [Sign up here](https://www.rpgchronicles.net/session/95a103df-13cc-4cee-8a07-8d7dea9130c7/pregame)

### Pathfinder Society
1. **Arclord's Abode** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/bd1565cf-86cf-446f-ba4a-8d5a6da32c2e/pregame)
2. **United in Purpose** (Levels 1-2) - [Sign up here](https://www.rpgchronicles.net/session/3b79f283-8380-4709-b0c6-fa74506ea0ef/pregame)

## Registration

Please register in advance using the links above. Space is limited, so sign up early!
        `,
        slug: 'diversions-sep-24-2025'
      },
      {
        meta: {
          title: 'Pathfinder Society at Tempest Games - The Winter Queen\'s Dollhouse',
          date: '2025-10-02',
          url: '/events/tempest-winter-queen-dollhouse',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** October 2, 2025
- **Time:** 5:30 PM - 7:30 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405
- **Players:** 6 players

## Available Scenarios

1. **The Winter Queen's Dollhouse** - [Sign up here](https://www.rpgchronicles.net/session/22928d9b-3beb-4b6c-ad50-e7a60c8142cc/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'tempest-winter-queen-dollhouse'
      },
      {
        meta: {
          title: 'Pathfinder Society at Geek City Games - Fury\'s Toll',
          date: '2025-10-19',
          url: '/events/gcg-furys-toll-oct',
          location: 'Geek City Games',
          address: '365 Beaver Kreek Center suite b, North Liberty, IA 52317'
        },
        content: `
# Pathfinder Society at Geek City Games

Join us for Pathfinder Society games at Geek City Games in North Liberty!

## Details

- **Date:** October 19, 2025
- **Time:** 12:00 noon - 4:00 PM Central Time
- **Location:** Geek City Games
- **Address:** 365 Beaver Kreek Center suite b, North Liberty, IA 52317
- **Players:** 6 players
- **Level Range:** 1-4

## Available Scenarios

1. **Fury's Toll** - [Sign up here](https://www.rpgchronicles.net/session/c0653e80-7642-4bcb-ab93-b6b8e6563d72/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'gcg-furys-toll-oct'
      },
      {
        meta: {
          title: 'Pathfinder & Starfinder Society at Diversions - October 22',
          date: '2025-10-22',
          url: '/events/diversions-oct-22-2025',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Pathfinder & Starfinder Society at Diversions

Join us for Pathfinder and Starfinder Society games at Diversions in Coralville!

## Details

- **Date:** October 22, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

### Starfinder Society
1. **Invasion's Edge** (Levels 1-2) - [Sign up here](https://www.rpgchronicles.net/session/83ebcbe8-2a3d-44b8-b79a-64c9bdaa15d6/pregame)

### Pathfinder Society
1. **Intro to Unfettered Exploration** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/28f5a541-caa1-4b2b-a48a-0ed8c9d3ce6a/pregame)
2. **The Blooming Catastrophe** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/7772298d-53b6-478f-a948-ddef572fd43a/pregame)

## Registration

Please register in advance using the links above. Space is limited, so sign up early!
        `,
        slug: 'diversions-oct-22-2025'
      },
      {
        meta: {
          title: 'Pathfinder Society at Tempest Games - The Swordlord\'s Challenge',
          date: '2025-10-30',
          url: '/events/tempest-swordlords-challenge',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** October 30, 2025
- **Time:** 5:30 PM - 7:30 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405
- **Players:** 6 players
- **Level Range:** 1-4

## Available Scenarios

1. **The Swordlord's Challenge** - [Sign up here](https://www.rpgchronicles.net/session/00cd2e81-8e12-4b5f-a54c-f35ace35cfc5/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'tempest-swordlords-challenge'
      },
      {
        meta: {
          title: 'Pathfinder Society at Geek City Games - Mark of the Mantis',
          date: '2025-11-02',
          url: '/events/gcg-mark-of-mantis',
          location: 'Geek City Games',
          address: '365 Beaver Kreek Center suite b, North Liberty, IA 52317'
        },
        content: `
# Pathfinder Society at Geek City Games

Join us for Pathfinder Society games at Geek City Games in North Liberty!

## Details

- **Date:** November 2, 2025
- **Time:** 12:00 noon - 4:00 PM Central Time
- **Location:** Geek City Games
- **Address:** 365 Beaver Kreek Center suite b, North Liberty, IA 52317
- **Players:** 4 players
- **Special Note:** This module uses pregenerated characters

## Available Scenarios

1. **Mark of the Mantis** (Module) - [Sign up here](https://www.rpgchronicles.net/session/2f44004f-f629-427e-a8c4-c58f4ed009d0/pregame)

## Registration

Please register in advance using the link above. Space is limited to 4 players, so sign up early!
        `,
        slug: 'gcg-mark-of-mantis'
      },
      {
        meta: {
          title: 'Pathfinder Society at Tempest Games - Student Exchange',
          date: '2025-11-06',
          url: '/events/tempest-student-exchange',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** November 6, 2025
- **Time:** 5:30 PM - 7:30 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405
- **Players:** 6 players
- **Level Range:** 1-4

## Available Scenarios

1. **Student Exchange** (Quest) - [Sign up here](https://www.rpgchronicles.net/session/ecb255d5-a0f5-4584-ac8d-e73d374b69cb/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'tempest-student-exchange'
      },
      {
        meta: {
          title: 'Pathfinder Society at Diversions - November 12',
          date: '2025-11-12',
          url: '/events/diversions-nov-12-2025',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Pathfinder Society at Diversions

Join us for Pathfinder Society games at Diversions in Coralville!

## Details

- **Date:** November 12, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

1. **Citadel of Corruption** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/574e7556-6d40-469a-8e35-6f7377603788/pregame)
2. **Symposium on a Fallen God** (Levels 3-6) - [Sign up here](https://www.rpgchronicles.net/session/a437ca12-e16e-4074-8a2d-69610773e865/pregame)

## Registration

Please register in advance using the links above. Space is limited to 6 players per game, so sign up early!
        `,
        slug: 'diversions-nov-12-2025'
      },
      {
        meta: {
          title: 'Pathfinder Society at Tempest Games - The Sandstone Secret',
          date: '2025-11-20',
          url: '/events/tempest-sandstone-secret',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** November 20, 2025
- **Time:** 5:30 PM - 7:30 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405
- **Players:** 6 players
- **Level Range:** 1-4

## Available Scenarios

1. **The Sandstone Secret** (Quest) - [Sign up here](https://www.rpgchronicles.net/session/9f171bb2-db9d-46f8-9c10-043157a3f517/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'tempest-sandstone-secret'
      },
      {
        meta: {
          title: 'Pathfinder Society at Diversions - November 26',
          date: '2025-11-26',
          url: '/events/diversions-nov-26-2025',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Pathfinder Society at Diversions

Join us for Pathfinder Society games at Diversions in Coralville!

## Details

- **Date:** November 26, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

1. **Necessary Introductions** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/b56f8691-8983-4b55-8065-cb1bf6f7a593/pregame)
2. **Sulfuric Negotiations** (Levels 3-6) - [Sign up here](https://www.rpgchronicles.net/session/d0c86bf3-d8b8-47ee-bdf4-03a33e241606/pregame)

## Registration

Please register in advance using the links above. Space is limited to 6 players per game, so sign up early!
        `,
        slug: 'diversions-nov-26-2025'
      },
      {
        meta: {
          title: 'Pathfinder Society at Tempest Games - Second Confirmation',
          date: '2025-11-23',
          url: '/events/tempest-second-confirmation-nov',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** November 23, 2025
- **Time:** 12:00 noon - 4:00 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405
- **Players:** 6 players
- **Level Range:** 1-4

## Available Scenarios

1. **Second Confirmation** - [Sign up here](https://www.rpgchronicles.net/session/13cdf4e6-24f4-4e27-946a-1d6a0ccb3b20/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'tempest-second-confirmation-nov'
      },
      {
        meta: {
          title: 'Pathfinder Society at Tempest Games - The Greengold Dilemma',
          date: '2025-12-04',
          url: '/events/tempest-greengold-dilemma',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** December 4, 2025
- **Time:** 5:30 PM - 7:30 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405
- **Players:** 6 players
- **Level Range:** 1-4

## Available Scenarios

1. **The Greengold Dilemma** (Quest) - [Sign up here](https://www.rpgchronicles.net/session/5736cf43-1cd9-4a6e-b5bf-20c9f61beaf4/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'tempest-greengold-dilemma'
      },
      {
        meta: {
          title: 'Pathfinder Society at Geek City Games - Dinner at Lionlodge',
          date: '2025-12-07',
          url: '/events/gcg-dinner-lionlodge',
          location: 'Geek City Games',
          address: '365 Beaver Kreek Center suite b, North Liberty, IA 52317'
        },
        content: `
# Pathfinder Society at Geek City Games

Join us for Pathfinder Society games at Geek City Games in North Liberty!

## Details

- **Date:** December 7, 2025
- **Time:** 12:00 noon - 4:00 PM Central Time
- **Location:** Geek City Games
- **Address:** 365 Beaver Kreek Center suite b, North Liberty, IA 52317
- **Players:** 4 players
- **Special Note:** This one-shot uses pregenerated characters. XP and Treasure can be applied to any Pathfinder Society character.

## Available Scenarios

1. **Dinner at Lionlodge** (One-Shot) - [Sign up here](https://www.rpgchronicles.net/session/283c0326-6f55-43b4-a1a6-694d47b41a6b/pregame)

## Registration

Please register in advance using the link above. Space is limited to 4 players, so sign up early!
        `,
        slug: 'gcg-dinner-lionlodge'
      },
      {
        meta: {
          title: 'Pathfinder Society at Diversions - December 10',
          date: '2025-12-10',
          url: '/events/diversions-dec-10-2025',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Pathfinder Society at Diversions

Join us for Pathfinder Society games at Diversions in Coralville!

## Details

- **Date:** December 10, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

1. **Catastrophe's Spark** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/e17e8663-91be-4f93-9275-a8240797476c/pregame)
2. **Brastlewark at War Part 1: The Gnome Defection** (Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/70617ede-7a42-4982-b0cc-b03e8b02500a/pregame)

## Registration

Please register in advance using the links above. Space is limited to 6 players per game, so sign up early!
        `,
        slug: 'diversions-dec-10-2025'
      },
      {
        meta: {
          title: 'Pathfinder Society at Tempest Games - The Elsewhere Feast',
          date: '2025-12-18',
          url: '/events/tempest-dragon-evoking-day',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** December 18, 2025
- **Time:** 5:30 PM - 7:30 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405
- **Players:** 6 players
- **Level Range:** 1-4

## Available Scenarios

1. **The Elsewhere Feast** (Quest) - [Sign up here](https://www.rpgchronicles.net/session/cee04d36-433b-4d5e-8693-8c35df46d96b/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'tempest-dragon-evoking-day'
      },
      {
        meta: {
          title: 'Pathfinder & Starfinder Society at Diversions - December 24',
          date: '2025-12-24',
          url: '/events/diversions-dec-24-2025',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Pathfinder & Starfinder Society at Diversions

Join us for Pathfinder and Starfinder Society games at Diversions in Coralville!

## Details

- **Date:** December 24, 2025
- **Time:** 4:30 PM - 7:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241
- **Special Note:** Games start at an earlier time than normal (4:30 PM) and will last only 2-3 hours.

## Available Scenarios

### Starfinder Society
1. **Seize and Destroy** (Levels 1-2) - [Sign up here](https://www.rpgchronicles.net/session/0e6916da-cde8-4760-b382-4ff36cf21e68/pregame)

### Pathfinder Society
1. **Dragon's Plea** (Quest, Levels 1-4) - [Sign up here](https://www.rpgchronicles.net/session/5e3150d6-3117-432b-9d3b-ddf496be5554/pregame)

## Registration

Please register in advance using the links above. Space is limited, so sign up early!
        `,
        slug: 'diversions-dec-24-2025'
      },
      {
        meta: {
          title: 'Pathfinder Society at Tempest Games - Silver Bark, Golden Blades',
          date: '2026-01-01',
          url: '/events/tempest-jan-01-2026',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** January 1, 2026
- **Time:** 12:00 noon - 4:00 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405
- **Game Master:** Eli Farmer

## Available Scenarios

1. **Silver Bark, Golden Blades** - [Sign up here](https://www.rpgchronicles.net/session/6ab4e6f4-555b-415f-b537-dd531aac65e0/pregame)

## Registration

Please register in advance using the link above. Space is limited, so sign up early!
        `,
        slug: 'tempest-jan-01-2026'
      },
      {
        meta: {
          title: 'Pathfinder Society at Geek City Games - Intro: Year of Shattered Sanctuaries',
          date: '2026-01-04',
          url: '/events/gcg-jan-04-2026',
          location: 'Geek City Games',
          address: '365 Beaver Kreek Center suite b, North Liberty, IA 52317'
        },
        content: `
# Pathfinder Society at Geek City Games

Join us for Pathfinder Society games at Geek City Games in North Liberty!

## Details

- **Date:** January 4, 2026
- **Time:** 12:00 noon - 4:00 PM Central Time
- **Location:** Geek City Games
- **Address:** 365 Beaver Kreek Center suite b, North Liberty, IA 52317

## Available Scenarios

1. **Intro: Year of Shattered Sanctuaries** - [Sign up here](https://www.rpgchronicles.net/session/b36977ba-f2ec-477b-9559-984874a9cf07/pregame)

## Registration

Please register in advance using the link above. Space is limited, so sign up early!
        `,
        slug: 'gcg-jan-04-2026'
      },
      {
        meta: {
          title: 'Pathfinder Society at Tempest Games - Within the Glacier',
          date: '2026-01-15',
          url: '/events/tempest-jan-15-2026',
          location: 'Tempest Games',
          address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
        },
        content: `
# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** January 15, 2026
- **Time:** 5:30 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405

## Available Scenarios

1. **Within the Glacier** - [Sign up here](https://www.rpgchronicles.net/session/1f272ada-19a3-4ac9-9359-b2496bf2c04a/pregame)

## Registration

Please register in advance using the link above. Space is limited, so sign up early!
        `,
        slug: 'tempest-jan-15-2026'
      },
      {
        meta: {
          title: 'Pathfinder Society at Geek City Games - The East Hill Haunting',
          date: '2026-01-18',
          url: '/events/gcg-jan-18-2026',
          location: 'Geek City Games',
          address: '365 Beaver Kreek Center suite b, North Liberty, IA 52317'
        },
        content: `
# Pathfinder Society at Geek City Games

Join us for Pathfinder Society games at Geek City Games in North Liberty!

## Details

- **Date:** January 18, 2026
- **Time:** 12:00 noon - 4:00 PM Central Time
- **Location:** Geek City Games
- **Address:** 365 Beaver Kreek Center suite b, North Liberty, IA 52317

## Available Scenarios

1. **The East Hill Haunting** - [Sign up here](https://www.rpgchronicles.net/session/35595f4c-00bb-40c7-8e2d-fffe7140acf7/pregame)

## Registration

Please register in advance using the link above. Space is limited, so sign up early!
        `,
        slug: 'gcg-jan-18-2026'
      }
    ];
  } else if (directory === 'news') {
    return [
      {
        meta: {
          title: 'No Show and Timeliness Policy',
          date: '2025-12-05',
          id: 'no-show-timeliness-policy'
        },
        content: `
# No Show and Timeliness Policy

We're implementing a new policy across all our gaming locations to ensure fair access to tables for all players.

## Policy Details

Effective immediately, Diversions, Tempest Games, and Geek City Games are implementing a timeliness policy for organized play sessions:

**If a player is more than 10 minutes late and there is a waitlist, their spot at the table will be given to the next person on the waitlist.**

## Why This Policy?

This policy helps ensure that:
- Players on waitlists have a fair opportunity to play
- Game Masters can start sessions on time
- All players who commit to attending are respectful of everyone's time

## What This Means for You

- **Arrive on time** - We recommend arriving 10-15 minutes early to get settled
- **Communicate** - If you're running late, contact the Game Master or venue as soon as possible
- **Sign up responsibly** - Only register for games you can commit to attending

## Questions?

If you have questions about this policy, please reach out to your Game Master or join us on Discord at [https://discord.gg/X6gmXYVDJA](https://discord.gg/X6gmXYVDJA) in the #iowa-corridor channel. We appreciate your understanding and cooperation in making our organized play sessions enjoyable for everyone.

Thank you for being part of our gaming community!
        `,
        slug: 'no-show-timeliness-policy'
      },
      {
        meta: {
          title: 'Shifting Corridors Lodge at Gamicon Bromine 2026',
          date: '2025-11-25',
          id: 'gamicon-bromine-2026'
        },
        content: `
# Shifting Corridors Lodge at Gamicon Bromine 2026

We're thrilled to announce that the Shifting Corridors Lodge will be hosting organized play at Gamicon Bromine, taking place March 6-8, 2026 in Coralville, Iowa!

## Event Highlights

This is going to be our biggest convention presence yet. We'll be running an impressive 19 tables of organized play throughout the weekend, featuring both Pathfinder Society and Starfinder Society games. Whether you're a seasoned adventurer or new to organized play, there will be something for everyone.

## Special Guest: Hilary Moon Murphy

We're honored to have special guest Hilary Moon Murphy joining us at the convention! Hilary is a talented author who has written scenarios for Paizo, and she'll be personally running three of her own scenarios during the event. This is a rare opportunity to experience her work firsthand with the author herself at the table.

## Both Systems Represented

Players will have the chance to dive into adventures across both game systems:
- **Pathfinder Society** - Fantasy adventures in the world of Golarion
- **Starfinder Society** - Science fiction exploration across the galaxy

## Convention Information

Gamicon Bromine will be held in Coralville, Iowa. For complete convention details, schedules, and registration information, visit [Gamicon.org](https://gamicon.org).

We can't wait to see you there! Mark your calendars for March 6-8, 2026, and get ready for an unforgettable weekend of gaming.
        `,
        slug: 'gamicon-bromine-2026'
      },
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
      },
      {
        meta: {
          title: 'Game Master: Josh E.',
          date: '2025-07-03',
          firstName: 'Josh',
          lastInitial: 'E',
          organizedPlayNumber: '8591',
          games: ['Pathfinder', 'Starfinder']
        },
        content: `
Josh E is an experienced game master who runs both Pathfinder Society and Starfinder Society games. With organized play number 8591, Josh brings expertise in both fantasy and science fiction RPG systems to create engaging adventures for players of all experience levels.
        `,
        slug: 'josh-e'
      },
      {
        meta: {
          title: 'Game Master: Scott L.',
          date: '2025-07-14',
          firstName: 'Scott',
          lastInitial: 'L',
          organizedPlayNumber: '339339',
          games: ['Starfinder']
        },
        content: `
Scott is a dedicated Game Master who specializes in running Starfinder scenarios. With his organized play number 339339, Scott brings enthusiasm for science fiction adventures and helps players explore the vast universe of Starfinder Society games.
        `,
        slug: 'scott-l'
      },
      {
        meta: {
          title: 'Game Master: Sam H.',
          date: '2025-08-15',
          firstName: 'Sam',
          lastInitial: 'H',
          organizedPlayNumber: '5689143',
          games: ['Pathfinder']
        },
        content: `
Sam is a dedicated Game Master who runs Pathfinder Society scenarios. With organized play number 5689143, Sam brings enthusiasm and expertise to create engaging adventures for players of all experience levels.
        `,
        slug: 'sam-h'
      },
      {
        meta: {
          title: 'Game Master: Steve S.',
          date: '2025-10-07',
          firstName: 'Steve',
          lastInitial: 'S',
          organizedPlayNumber: '21564',
          games: ['Pathfinder']
        },
        content: `
Steve is a dedicated Game Master who runs Pathfinder Society scenarios. With organized play number 21564, Steve brings enthusiasm and expertise to create engaging adventures for players of all experience levels.
        `,
        slug: 'steve-s'
      },
      {
        meta: {
          title: 'Game Master: Eli F.',
          date: '2025-12-14',
          firstName: 'Eli',
          lastInitial: 'F',
          organizedPlayNumber: '6385146',
          games: ['Pathfinder']
        },
        content: `
Eli is a dedicated Game Master who runs Pathfinder Society scenarios. With organized play number 6385146, Eli brings enthusiasm and expertise to create engaging adventures for players of all experience levels.
        `,
        slug: 'eli-f'
      }
    ];
  }

  return [];
};