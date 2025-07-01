import { contentLoader } from './contentLoader';

describe('ContentLoader Integration Tests', () => {
  it('should load all content types successfully', async () => {
    // Test that all content types can be loaded without errors
    const [events, gameMasters, articles] = await Promise.all([
      contentLoader.loadCalendarEvents(),
      contentLoader.loadGameMasters(),
      contentLoader.loadNewsArticles()
    ]);

    // Verify we have content
    expect(events.length).toBeGreaterThan(0);
    expect(gameMasters.length).toBeGreaterThan(0);
    expect(articles.length).toBeGreaterThan(0);

    // Verify content structure
    expect(events[0]).toHaveProperty('title');
    expect(events[0]).toHaveProperty('date');
    expect(events[0]).toHaveProperty('content');
    expect(events[0]).toHaveProperty('gameType');

    expect(gameMasters[0]).toHaveProperty('name');
    expect(gameMasters[0]).toHaveProperty('organizedPlayId');
    expect(gameMasters[0]).toHaveProperty('games');
    expect(gameMasters[0]).toHaveProperty('bio');

    expect(articles[0]).toHaveProperty('title');
    expect(articles[0]).toHaveProperty('date');
    expect(articles[0]).toHaveProperty('content');
    expect(articles[0]).toHaveProperty('excerpt');
  });

  it('should handle concurrent requests efficiently', async () => {
    const startTime = Date.now();
    
    // Make multiple concurrent requests
    const requests = Array(5).fill(null).map(() => Promise.all([
      contentLoader.loadCalendarEvents(),
      contentLoader.loadGameMasters(),
      contentLoader.loadNewsArticles()
    ]));

    const results = await Promise.all(requests);
    const endTime = Date.now();

    // All requests should return the same data (due to caching)
    for (let i = 1; i < results.length; i++) {
      expect(results[i][0]).toBe(results[0][0]); // Same calendar events reference
      expect(results[i][1]).toBe(results[0][1]); // Same game masters reference
      expect(results[i][2]).toBe(results[0][2]); // Same news articles reference
    }

    // Should be fast due to caching (less than 100ms for all requests)
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should provide realistic content data', async () => {
    const events = await contentLoader.loadCalendarEvents();
    const gameMasters = await contentLoader.loadGameMasters();
    const articles = await contentLoader.loadNewsArticles();

    // Check for expected content
    expect(events.some(e => e.title.includes('Pathfinder'))).toBe(true);
    expect(events.some(e => e.title.includes('Starfinder'))).toBe(true);
    expect(events.some(e => e.gameType === 'Pathfinder')).toBe(true);
    expect(events.some(e => e.gameType === 'Starfinder')).toBe(true);

    expect(gameMasters.some(gm => gm.name.includes('Marty'))).toBe(true);
    expect(gameMasters.some(gm => gm.name.includes('Josh'))).toBe(true);
    expect(gameMasters.some(gm => gm.games.includes('Pathfinder'))).toBe(true);
    expect(gameMasters.some(gm => gm.games.includes('Starfinder'))).toBe(true);

    expect(articles.some(a => a.title.includes('Website'))).toBe(true);
  });

  it('should maintain data consistency across multiple loads', async () => {
    // Clear cache to ensure fresh loads
    contentLoader.clearCache();

    const load1 = await Promise.all([
      contentLoader.loadCalendarEvents(),
      contentLoader.loadGameMasters(),
      contentLoader.loadNewsArticles()
    ]);

    contentLoader.clearCache();

    const load2 = await Promise.all([
      contentLoader.loadCalendarEvents(),
      contentLoader.loadGameMasters(),
      contentLoader.loadNewsArticles()
    ]);

    // Data should be consistent across loads
    expect(load1[0]).toEqual(load2[0]);
    expect(load1[1]).toEqual(load2[1]);
    expect(load1[2]).toEqual(load2[2]);
  });
});