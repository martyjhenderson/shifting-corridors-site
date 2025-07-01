import { 
  ValidationResult, 
  EventFrontmatter, 
  GameMasterFrontmatter, 
  NewsFrontmatter,
  CalendarEvent,
  GameMaster,
  NewsArticle
} from '../types';

/**
 * Validation utilities for markdown frontmatter and content
 */

/**
 * Validate event frontmatter and provide defaults
 */
export const validateEventFrontmatter = (frontmatter: any): { 
  result: ValidationResult; 
  validated: EventFrontmatter 
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const validated: EventFrontmatter = {
    title: '',
    date: new Date()
  };

  // Validate title
  if (!frontmatter.title || typeof frontmatter.title !== 'string') {
    errors.push('Event title is required and must be a string');
    validated.title = 'Untitled Event';
  } else {
    validated.title = frontmatter.title.trim();
  }

  // Validate date
  if (!frontmatter.date) {
    errors.push('Event date is required');
    validated.date = new Date();
  } else {
    const parsedDate = parseDate(frontmatter.date);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Event date must be a valid date');
      validated.date = new Date();
    } else {
      validated.date = parsedDate;
    }
  }

  // Validate gameType
  const validGameTypes = ['Pathfinder', 'Starfinder', 'Legacy'];
  if (frontmatter.gameType) {
    if (!validGameTypes.includes(frontmatter.gameType)) {
      warnings.push(`Invalid game type "${frontmatter.gameType}", will be auto-detected`);
    } else {
      validated.gameType = frontmatter.gameType;
    }
  }
  // If no gameType is provided, leave it undefined so it can be auto-detected

  // Optional fields with validation
  if (frontmatter.gamemaster && typeof frontmatter.gamemaster === 'string') {
    validated.gamemaster = frontmatter.gamemaster.trim();
  }

  if (frontmatter.maxPlayers) {
    const maxPlayers = parseInt(frontmatter.maxPlayers);
    if (!isNaN(maxPlayers) && maxPlayers > 0) {
      validated.maxPlayers = maxPlayers;
    } else {
      warnings.push('maxPlayers must be a positive number');
    }
  }

  if (frontmatter.location && typeof frontmatter.location === 'string') {
    validated.location = frontmatter.location.trim();
  }

  if (frontmatter.address && typeof frontmatter.address === 'string') {
    validated.address = frontmatter.address.trim();
  }

  if (frontmatter.url && typeof frontmatter.url === 'string') {
    validated.url = frontmatter.url.trim();
  }

  return {
    result: {
      isValid: errors.length === 0,
      errors,
      warnings
    },
    validated
  };
};

/**
 * Validate game master frontmatter and provide defaults
 */
export const validateGameMasterFrontmatter = (frontmatter: any): {
  result: ValidationResult;
  validated: GameMasterFrontmatter;
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const validated: GameMasterFrontmatter = {
    firstName: '',
    lastInitial: '',
    organizedPlayNumber: '00000',
    games: ['Pathfinder']
  };

  // Handle new format (name field) or old format (firstName/lastInitial)
  if (frontmatter.name && typeof frontmatter.name === 'string') {
    // New format: full name provided
    const nameParts = frontmatter.name.trim().split(' ');
    validated.firstName = nameParts[0] || '';
    validated.lastInitial = nameParts[1]?.charAt(0) || '';
  } else {
    // Old format: individual name fields
    if (!frontmatter.firstName || typeof frontmatter.firstName !== 'string') {
      errors.push('Game master first name is required');
      validated.firstName = 'Unknown';
    } else {
      validated.firstName = frontmatter.firstName.trim();
    }

    if (!frontmatter.lastInitial || typeof frontmatter.lastInitial !== 'string') {
      warnings.push('Game master last initial is recommended');
      validated.lastInitial = '';
    } else {
      validated.lastInitial = frontmatter.lastInitial.trim().charAt(0).toUpperCase();
    }
  }

  // Handle new format (organizedPlayId) or old format (organizedPlayNumber)
  const opNumber = frontmatter.organizedPlayId || frontmatter.organizedPlayNumber;
  if (!opNumber) {
    warnings.push('Organized play ID is recommended');
    validated.organizedPlayNumber = '00000';
  } else {
    validated.organizedPlayNumber = String(opNumber).trim();
  }

  // Validate games array
  if (!frontmatter.games || !Array.isArray(frontmatter.games)) {
    warnings.push('Games array is recommended, defaulting to Pathfinder');
    validated.games = ['Pathfinder'];
  } else {
    const validGames = ['Pathfinder', 'Starfinder', 'Legacy'];
    const filteredGames = frontmatter.games.filter((game: any) => 
      typeof game === 'string' && validGames.includes(game)
    );
    
    if (filteredGames.length === 0) {
      warnings.push('No valid games found, defaulting to Pathfinder');
      validated.games = ['Pathfinder'];
    } else {
      validated.games = filteredGames;
    }
  }

  // Optional avatar
  if (frontmatter.avatar && typeof frontmatter.avatar === 'string') {
    validated.avatar = frontmatter.avatar.trim();
  }

  return {
    result: {
      isValid: errors.length === 0,
      errors,
      warnings
    },
    validated
  };
};

/**
 * Validate news frontmatter and provide defaults
 */
export const validateNewsFrontmatter = (frontmatter: any): {
  result: ValidationResult;
  validated: NewsFrontmatter;
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const validated: NewsFrontmatter = {
    title: '',
    date: new Date(),
    excerpt: ''
  };

  // Validate title
  if (!frontmatter.title || typeof frontmatter.title !== 'string') {
    errors.push('News article title is required');
    validated.title = 'Untitled Article';
  } else {
    validated.title = frontmatter.title.trim();
  }

  // Validate date
  if (!frontmatter.date) {
    warnings.push('News article date not provided, using current date');
    validated.date = new Date();
  } else {
    const parsedDate = parseDate(frontmatter.date);
    if (isNaN(parsedDate.getTime())) {
      warnings.push('Invalid news article date, using current date');
      validated.date = new Date();
    } else {
      validated.date = parsedDate;
    }
  }

  // Optional fields
  if (frontmatter.author && typeof frontmatter.author === 'string') {
    validated.author = frontmatter.author.trim();
  }

  if (frontmatter.excerpt && typeof frontmatter.excerpt === 'string') {
    validated.excerpt = frontmatter.excerpt.trim();
  }

  if (frontmatter.id && typeof frontmatter.id === 'string') {
    validated.id = frontmatter.id.trim();
  }

  return {
    result: {
      isValid: errors.length === 0,
      errors,
      warnings
    },
    validated
  };
};

/**
 * Validate complete content objects
 */
export const validateCalendarEvent = (event: Partial<CalendarEvent>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!event || typeof event !== 'object') {
    errors.push('Event must be a valid object');
    return { isValid: false, errors, warnings };
  }

  if (!event.id || typeof event.id !== 'string') {
    errors.push('Event ID is required');
  }

  if (!event.title || typeof event.title !== 'string') {
    errors.push('Event title is required');
  }

  if (!event.date || !(event.date instanceof Date) || isNaN(event.date.getTime())) {
    errors.push('Event date must be a valid Date object');
  }

  if (!event.content || typeof event.content !== 'string') {
    warnings.push('Event content is empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateGameMaster = (gm: Partial<GameMaster>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!gm || typeof gm !== 'object') {
    errors.push('Game master must be a valid object');
    return { isValid: false, errors, warnings };
  }

  if (!gm.id || typeof gm.id !== 'string') {
    errors.push('Game master ID is required');
  }

  if (!gm.name || typeof gm.name !== 'string') {
    errors.push('Game master name is required');
  }

  if (!gm.organizedPlayId || typeof gm.organizedPlayId !== 'string') {
    warnings.push('Organized play ID is recommended');
  }

  if (!gm.games || !Array.isArray(gm.games) || gm.games.length === 0) {
    warnings.push('At least one game should be specified');
  }

  if (!gm.bio || typeof gm.bio !== 'string') {
    warnings.push('Game master bio is recommended');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateNewsArticle = (article: Partial<NewsArticle>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!article || typeof article !== 'object') {
    errors.push('News article must be a valid object');
    return { isValid: false, errors, warnings };
  }

  if (!article.id || typeof article.id !== 'string') {
    errors.push('News article ID is required');
  }

  if (!article.title || typeof article.title !== 'string') {
    errors.push('News article title is required');
  }

  if (!article.date || !(article.date instanceof Date) || isNaN(article.date.getTime())) {
    errors.push('News article date must be a valid Date object');
  }

  if (!article.content || typeof article.content !== 'string') {
    warnings.push('News article content is empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Parse date from various formats, handling timezone issues
 */
export const parseDate = (dateInput: any): Date => {
  if (dateInput instanceof Date) {
    return dateInput;
  }

  if (typeof dateInput === 'string') {
    // Handle YYYY-MM-DD format specifically to avoid timezone issues
    const isoDateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch;
      // Create date in local timezone to avoid UTC conversion issues
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Handle MM/DD/YYYY format
    const usDateMatch = dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (usDateMatch) {
      const [, month, day, year] = usDateMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Handle MM-DD-YYYY format
    const dashDateMatch = dateInput.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dashDateMatch) {
      const [, month, day, year] = dashDateMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Try other formats as fallback
    const fallbackDate = new Date(dateInput);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }
  }

  if (typeof dateInput === 'number') {
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Return invalid date if parsing fails
  return new Date(NaN);
};

/**
 * Sanitize content to prevent XSS
 */
export const sanitizeContent = (content: string): string => {
  if (typeof content !== 'string') {
    return '';
  }

  // Basic HTML sanitization - remove script tags and dangerous attributes
  let sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '');

  // Remove event handlers - handle quoted and unquoted values
  // This regex matches: space + on + word characters + = + quoted or unquoted value
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
  
  return sanitized.trim();
};

/**
 * Extract excerpt from content
 */
export const extractExcerpt = (content: string, maxLength: number = 150): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  const sanitized = sanitizeContent(content);
  const cleanContent = sanitized
    .replace(/^#.*$/gm, '') // Remove headers
    .replace(/\n\s*\n/g, '\n') // Remove extra newlines
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .trim();

  return cleanContent.length > maxLength 
    ? cleanContent.substring(0, maxLength).trim() + '...'
    : cleanContent;
};