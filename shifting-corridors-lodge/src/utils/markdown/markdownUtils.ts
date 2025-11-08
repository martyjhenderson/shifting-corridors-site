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
    // Always use fallback data in production to avoid API issues
    if (process.env.NODE_ENV === 'production') {
      return getFallbackData(directory);
    }

    // Get a list of files in the directory
    const response = await fetch(`/api/files?directory=src/content/${directory}`);

    if (!response.ok) {
      return getFallbackData(directory);
    }

    const files = await response.json();

    if (!files || files.length === 0) {
      return getFallbackData(directory);
    }

    // Parse each file
    const markdownContents = await Promise.all(
      files.map((file: string) => parseMarkdownFile(`src/content/${directory}/${file}`))
    );

    return markdownContents;
  } catch (error) {
    // Fallback to hardcoded data for demo purposes
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
    // Fetch the file content
    const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);

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
      },
      {
        meta: {
          title: 'Pathfinder Society at Geek City Games',
          date: '2025-07-13',
          url: '/events/gcg-13Jul2025',
          location: 'Geek City Games',
          address: '365 Beaver Kreek Center suite b, North Liberty, IA 52317'
        },
        content: `
# Pathfinder Society at Geek City Games

Join us for Pathfinder Society games at Geek City Games in North Liberty!

## Details

- **Date:** July 13, 2025
- **Time:** 12:00 noon - 5:00pm
- **Location:** Geek City Games
- **Address:** 365 Beaver Kreek Center suite b, North Liberty, IA 52317

## Available Scenarios

1. **Within the Prairies** - [Sign up here](https://www.rpgchronicles.net/session/5a519ffb-56a6-4eab-982f-9b8da8d232e2/pregame)

## Registration

Please register in advance using the links above. Space is limited, so sign up early!
        `,
        slug: 'gcg-13-july'
      },
      {
        meta: {
          title: 'Pathfinder Society at Diversions - Year of Immortal Influence Intro',
          date: '2025-07-09',
          url: '/events/diversions-symposium-fallen-god',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Pathfinder Society at Diversions 

Join us for Pathfinder Society games at Diversions in Coralville!

## Details

- **Date:** July 9, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

1. **Year of Immortal Influence: Intro** - [Sign up here](https://www.rpgchronicles.net/session/cabe4362-50e0-4447-b5fc-b7361b3d586c/pregame)

## Registration

Please register in advance using the link above. Space is limited, so sign up early!
        `,
        slug: 'diversions-symposium-fallen-god'
      },
      {
        meta: {
          title: 'Pathfinder Society at Diversions - Second Confirmation',
          date: '2025-07-09',
          url: '/events/diversions-second-confirmation',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241',
          gamemaster: 'Josh E'
        },
        content: `
# Pathfinder Society at Diversions - Second Confirmation

Join us for Pathfinder Society games at Diversions in Coralville!

## Details

- **Date:** July 9, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241
- **Game Master:** Josh E

## Available Scenarios

1. **Second Confirmation** - [Sign up here](https://www.rpgchronicles.net/session/64258560-7190-4e5e-a167-1e6478b88482/pregame)

## Registration

Please register in advance using the link above. Space is limited, so sign up early!
        `,
        slug: 'diversions-second-confirmation'
      },
      {
        meta: {
          title: 'Starfinder Society at Diversions - Battle for Nova Rush',
          date: '2025-07-23',
          url: '/events/diversions-battle-nova-rush',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Starfinder Society at Diversions - Battle for Nova Rush

Join us for Starfinder Society games at Diversions in Coralville!

## Details

- **Date:** July 23, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

1. **Battle for Nova Rush** - [Sign up here](https://www.rpgchronicles.net/session/3793181b-71db-4409-91b3-b4a2cd28d469/pregame)

## Special Note

**This is the first Starfinder Second Edition game available for Organized Play credit!** Don't miss this opportunity to be among the first to play Starfinder 2E in an official Organized Play setting.

## Registration

Please register in advance using the link above. Space is limited, so sign up early!
        `,
        slug: 'diversions-battle-nova-rush'
      },
      {
        meta: {
          title: 'Pathfinder Society at Diversions - Mischief in the Maze',
          date: '2025-07-23',
          url: '/events/diversions-mischief-maze',
          location: 'Diversions',
          address: '119 2nd St #300, Coralville, IA 52241'
        },
        content: `
# Pathfinder Society at Diversions - Mischief in the Maze

Join us for Pathfinder Society games at Diversions in Coralville!

## Details

- **Date:** July 23, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241
- **Seats Available:** 6 players

## Available Scenarios

1. **Mischief in the Maze** - [Sign up here](https://www.rpgchronicles.net/session/049f7cb9-9dcf-498b-9cff-40813af5ec5d/pregame)

## Registration

Please register in advance using the link above. Space is limited to 6 players, so sign up early!
        `,
        slug: 'diversions-mischief-maze'
      },

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
      }
    ];
  }

  return [];
};