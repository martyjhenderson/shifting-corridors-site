import {
  validateEventFrontmatter,
  validateGameMasterFrontmatter,
  validateNewsFrontmatter,
  validateCalendarEvent,
  validateGameMaster,
  validateNewsArticle,
  parseDate,
  sanitizeContent,
  extractExcerpt
} from '../validation';
import { CalendarEvent, GameMaster, NewsArticle } from '../../types';

describe('Validation Utilities', () => {
  describe('validateEventFrontmatter', () => {
    it('should validate complete and correct frontmatter', () => {
      const frontmatter = {
        title: 'Pathfinder Society Game',
        date: '2025-07-15',
        gameType: 'Pathfinder',
        gamemaster: 'john-doe',
        maxPlayers: 6,
        location: 'Game Store',
        address: '123 Main St',
        url: '/events/pathfinder-game'
      };

      const { result, validated } = validateEventFrontmatter(frontmatter);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(validated.title).toBe('Pathfinder Society Game');
      expect(validated.gameType).toBe('Pathfinder');
      expect(validated.gamemaster).toBe('john-doe');
      expect(validated.maxPlayers).toBe(6);
      expect(validated.location).toBe('Game Store');
      expect(validated.address).toBe('123 Main St');
      expect(validated.url).toBe('/events/pathfinder-game');
    });

    it('should handle missing required fields', () => {
      const frontmatter = {};

      const { result, validated } = validateEventFrontmatter(frontmatter);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event title is required and must be a string');
      expect(result.errors).toContain('Event date is required');
      expect(validated.title).toBe('Untitled Event');
      expect(validated.gameType).toBeUndefined(); // No default gameType, will be auto-detected
    });

    it('should handle invalid data types', () => {
      const frontmatter = {
        title: 123, // Should be string
        date: 'invalid-date',
        gameType: 'InvalidType',
        maxPlayers: 'not-a-number'
      };

      const { result, validated } = validateEventFrontmatter(frontmatter);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event title is required and must be a string');
      expect(result.errors).toContain('Event date must be a valid date');
      expect(result.warnings).toContain('Invalid game type "InvalidType", will be auto-detected');
      expect(result.warnings).toContain('maxPlayers must be a positive number');
      expect(validated.title).toBe('Untitled Event');
      expect(validated.gameType).toBeUndefined(); // Invalid gameType is ignored, will be auto-detected
      expect(validated.maxPlayers).toBeUndefined();
    });

    it('should trim whitespace from string fields', () => {
      const frontmatter = {
        title: '  Spaced Title  ',
        date: '2025-07-15',
        gamemaster: '  spaced-gm  ',
        location: '  Spaced Location  ',
        address: '  Spaced Address  ',
        url: '  /spaced-url  '
      };

      const { validated } = validateEventFrontmatter(frontmatter);

      expect(validated.title).toBe('Spaced Title');
      expect(validated.gamemaster).toBe('spaced-gm');
      expect(validated.location).toBe('Spaced Location');
      expect(validated.address).toBe('Spaced Address');
      expect(validated.url).toBe('/spaced-url');
    });

    it('should validate all game types', () => {
      const gameTypes = ['Pathfinder', 'Starfinder', 'Legacy'];
      
      gameTypes.forEach(gameType => {
        const frontmatter = {
          title: 'Test Event',
          date: '2025-07-15',
          gameType
        };

        const { result, validated } = validateEventFrontmatter(frontmatter);

        expect(result.isValid).toBe(true);
        expect(validated.gameType).toBe(gameType);
      });
    });
  });

  describe('validateGameMasterFrontmatter', () => {
    it('should validate complete and correct frontmatter', () => {
      const frontmatter = {
        firstName: 'John',
        lastInitial: 'D',
        organizedPlayNumber: '12345',
        games: ['Pathfinder', 'Starfinder'],
        avatar: '/images/john-d.jpg'
      };

      const { result, validated } = validateGameMasterFrontmatter(frontmatter);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(validated.firstName).toBe('John');
      expect(validated.lastInitial).toBe('D');
      expect(validated.organizedPlayNumber).toBe('12345');
      expect(validated.games).toEqual(['Pathfinder', 'Starfinder']);
      expect(validated.avatar).toBe('/images/john-d.jpg');
    });

    it('should handle full name parsing', () => {
      const frontmatter = {
        name: 'Jane Smith',
        organizedPlayNumber: '67890',
        games: ['Legacy']
      };

      const { result, validated } = validateGameMasterFrontmatter(frontmatter);

      expect(result.isValid).toBe(true);
      expect(validated.firstName).toBe('Jane');
      expect(validated.lastInitial).toBe('S');
    });

    it('should handle missing required fields', () => {
      const frontmatter = {};

      const { result, validated } = validateGameMasterFrontmatter(frontmatter);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Game master first name is required');
      expect(validated.firstName).toBe('Unknown');
      expect(validated.lastInitial).toBe('');
      expect(validated.organizedPlayNumber).toBe('00000');
      expect(validated.games).toEqual(['Pathfinder']);
    });

    it('should filter invalid games', () => {
      const frontmatter = {
        firstName: 'Test',
        lastInitial: 'T',
        games: ['Pathfinder', 'InvalidGame', 'Starfinder', 'AnotherInvalid', 'Legacy']
      };

      const { result, validated } = validateGameMasterFrontmatter(frontmatter);

      expect(validated.games).toEqual(['Pathfinder', 'Starfinder', 'Legacy']);
    });

    it('should handle non-array games field', () => {
      const frontmatter = {
        firstName: 'Test',
        lastInitial: 'T',
        games: 'Pathfinder' // Should be array
      };

      const { result, validated } = validateGameMasterFrontmatter(frontmatter);

      expect(result.warnings).toContain('Games array is recommended, defaulting to Pathfinder');
      expect(validated.games).toEqual(['Pathfinder']);
    });

    it('should normalize last initial', () => {
      const frontmatter = {
        firstName: 'Test',
        lastInitial: 'abc', // Should be single uppercase letter
        organizedPlayNumber: '12345'
      };

      const { validated } = validateGameMasterFrontmatter(frontmatter);

      expect(validated.lastInitial).toBe('A');
    });
  });

  describe('validateNewsFrontmatter', () => {
    it('should validate complete and correct frontmatter', () => {
      const frontmatter = {
        title: 'Important News',
        date: '2025-07-15',
        author: 'News Author',
        excerpt: 'This is a news excerpt',
        id: 'important-news'
      };

      const { result, validated } = validateNewsFrontmatter(frontmatter);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(validated.title).toBe('Important News');
      expect(validated.author).toBe('News Author');
      expect(validated.excerpt).toBe('This is a news excerpt');
      expect(validated.id).toBe('important-news');
    });

    it('should handle missing required fields', () => {
      const frontmatter = {};

      const { result, validated } = validateNewsFrontmatter(frontmatter);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('News article title is required');
      expect(validated.title).toBe('Untitled Article');
    });

    it('should handle missing optional fields with warnings', () => {
      const frontmatter = {
        title: 'Test Article'
        // Missing date
      };

      const { result, validated } = validateNewsFrontmatter(frontmatter);

      expect(result.warnings).toContain('News article date not provided, using current date');
      expect(validated.date).toBeInstanceOf(Date);
    });

    it('should handle invalid date', () => {
      const frontmatter = {
        title: 'Test Article',
        date: 'invalid-date'
      };

      const { result, validated } = validateNewsFrontmatter(frontmatter);

      expect(result.warnings).toContain('Invalid news article date, using current date');
      expect(validated.date).toBeInstanceOf(Date);
    });
  });

  describe('Complete Object Validation', () => {
    describe('validateCalendarEvent', () => {
      it('should validate complete event object', () => {
        const event: CalendarEvent = {
          id: 'test-event',
          title: 'Test Event',
          date: new Date('2025-07-15'),
          description: 'Test description',
          content: 'Test content',
          gameType: 'Pathfinder'
        };

        const result = validateCalendarEvent(event);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should catch missing required fields', () => {
        const event: Partial<CalendarEvent> = {
          title: 'Test Event'
          // Missing id, date, etc.
        };

        const result = validateCalendarEvent(event);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Event ID is required');
        expect(result.errors).toContain('Event date must be a valid Date object');
      });
    });

    describe('validateGameMaster', () => {
      it('should validate complete game master object', () => {
        const gm: GameMaster = {
          id: 'test-gm',
          name: 'Test GM',
          organizedPlayId: '12345',
          games: ['Pathfinder'],
          bio: 'Test bio'
        };

        const result = validateGameMaster(gm);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should provide warnings for missing recommended fields', () => {
        const gm: Partial<GameMaster> = {
          id: 'test-gm',
          name: 'Test GM',
          organizedPlayId: '',
          games: [],
          bio: ''
        };

        const result = validateGameMaster(gm);

        expect(result.warnings).toContain('Organized play ID is recommended');
        expect(result.warnings).toContain('At least one game should be specified');
        expect(result.warnings).toContain('Game master bio is recommended');
      });
    });

    describe('validateNewsArticle', () => {
      it('should validate complete news article object', () => {
        const article: NewsArticle = {
          id: 'test-article',
          title: 'Test Article',
          date: new Date('2025-07-15'),
          excerpt: 'Test excerpt',
          content: 'Test content'
        };

        const result = validateNewsArticle(article);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should catch invalid date objects', () => {
        const article: Partial<NewsArticle> = {
          id: 'test-article',
          title: 'Test Article',
          date: new Date('invalid-date'), // Invalid date
          content: 'Test content'
        };

        const result = validateNewsArticle(article);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('News article date must be a valid Date object');
      });
    });
  });

  describe('parseDate', () => {
    it('should parse various date formats', () => {
      const testCases = [
        { input: '2025-07-15', expected: new Date(2025, 6, 15) }, // Local timezone date
        { input: '07/15/2025', expected: new Date(2025, 6, 15) }, // Local timezone date
        { input: '07-15-2025', expected: new Date(2025, 6, 15) }, // Local timezone date
        { input: new Date('2025-07-15'), expected: new Date('2025-07-15') },
        { input: Date.now(), expected: new Date(Date.now()) }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseDate(input);
        expect(result.getTime()).toBeCloseTo(expected.getTime(), -1);
      });
    });

    it('should return invalid date for unparseable input', () => {
      const invalidInputs = [
        'not-a-date',
        'invalid-format',
        null,
        undefined,
        {},
        []
      ];

      invalidInputs.forEach(input => {
        const result = parseDate(input);
        expect(isNaN(result.getTime())).toBe(true);
      });
    });
  });

  describe('sanitizeContent', () => {
    it('should remove dangerous script tags', () => {
      const testCases = [
        {
          input: 'Safe content <script>alert("xss")</script> more content',
          expected: 'Safe content  more content'
        },
        {
          input: '<script type="text/javascript">malicious code</script>',
          expected: ''
        },
        {
          input: 'Before <SCRIPT>alert("XSS")</SCRIPT> after',
          expected: 'Before  after'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeContent(input)).toBe(expected);
      });
    });

    it('should remove dangerous event handlers', () => {
      const testCases = [
        {
          input: '<div onclick="alert(\'xss\')">Content</div>',
          expected: '<div>Content</div>'
        },
        {
          input: '<img src="x" onerror="alert(\'xss\')" />',
          expected: '<img src="x" />'
        },
        {
          input: '<a href="#" onmouseover="malicious()">Link</a>',
          expected: '<a href="#">Link</a>'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeContent(input)).toBe(expected);
      });
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(\'xss\')">Link</a>';
      const result = sanitizeContent(input);
      expect(result).not.toContain('javascript:');
    });

    it('should handle non-string input gracefully', () => {
      const invalidInputs = [null, undefined, 123, {}, []];
      
      invalidInputs.forEach(input => {
        expect(sanitizeContent(input as any)).toBe('');
      });
    });

    it('should preserve safe HTML', () => {
      const safeHtml = '<p>This is <strong>safe</strong> <em>content</em> with <a href="https://example.com">links</a>.</p>';
      expect(sanitizeContent(safeHtml)).toBe(safeHtml);
    });
  });

  describe('extractExcerpt', () => {
    it('should extract excerpt within specified length', () => {
      const longContent = 'This is a very long piece of content that should be truncated at some point to create a nice excerpt for display purposes. It contains multiple sentences and should be cut off appropriately.';
      
      const excerpt = extractExcerpt(longContent, 100);
      
      expect(excerpt.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(excerpt.endsWith('...')).toBe(true);
    });

    it('should not truncate short content', () => {
      const shortContent = 'This is short content.';
      const excerpt = extractExcerpt(shortContent, 100);
      
      expect(excerpt).toBe(shortContent);
      expect(excerpt.endsWith('...')).toBe(false);
    });

    it('should remove markdown formatting', () => {
      const markdownContent = '# Header\n\n**Bold text** and *italic text* with [link text](https://example.com) and `code`.';
      const excerpt = extractExcerpt(markdownContent);
      
      expect(excerpt).not.toContain('**');
      expect(excerpt).not.toContain('*');
      expect(excerpt).not.toContain('[');
      expect(excerpt).not.toContain('](');
      expect(excerpt).not.toContain('#');
      expect(excerpt).toContain('Bold text');
      expect(excerpt).toContain('italic text');
      expect(excerpt).toContain('link text');
    });

    it('should handle empty or invalid content', () => {
      expect(extractExcerpt('')).toBe('');
      expect(extractExcerpt(null as any)).toBe('');
      expect(extractExcerpt(undefined as any)).toBe('');
    });

    it('should remove extra whitespace', () => {
      const messyContent = '# Title\n\n\n\nThis   has    lots\n\n\nof    whitespace.\n\n\n';
      const excerpt = extractExcerpt(messyContent);
      
      expect(excerpt).toBe('This has lots of whitespace.');
    });

    it('should use default length when not specified', () => {
      const longContent = 'A'.repeat(200);
      const excerpt = extractExcerpt(longContent);
      
      expect(excerpt.length).toBeLessThanOrEqual(153); // 150 + '...'
    });
  });
});