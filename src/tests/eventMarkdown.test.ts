import { describe, test, expect } from 'vitest';

// The parsers are CommonJS because they're shared with the build/migration
// scripts, which run under plain node.
import {
  parseTime,
  parseTimeRange,
  parseScenarioLine,
  parseDetailBullet,
  parseScenarioGroupHeading,
  isBoilerplateRegistration,
} from '../../scripts/lib/event-markdown';

describe('parseTime', () => {
  test('converts 12-hour times to 24-hour', () => {
    expect(parseTime('5:30 PM')).toBe('17:30');
    expect(parseTime('9:00 AM')).toBe('09:00');
  });

  test('handles the 12 o\'clock edge cases', () => {
    expect(parseTime('12:00 PM')).toBe('12:00');
    expect(parseTime('12:00 AM')).toBe('00:00');
  });

  test('returns null when there is no clock time', () => {
    expect(parseTime('All Day Event')).toBeNull();
    expect(parseTime('')).toBeNull();
  });
});

describe('parseTimeRange', () => {
  test('reads a start and end time', () => {
    expect(parseTimeRange('5:30 PM - 7:30 PM Central Time')).toEqual({
      startTime: '17:30',
      endTime: '19:30',
    });
  });

  test('reads a lone start time', () => {
    expect(parseTimeRange('5:30 PM Central Time')).toEqual({ startTime: '17:30' });
  });

  // Regression: 28 of 103 events spell midday "12:00 noon". Without
  // normalization "12:00 noon - 4:00 PM" matched only the 4 PM and silently
  // produced a 4 PM start with no end.
  test('understands "noon" as a clock time', () => {
    expect(parseTimeRange('12:00 noon - 4:00 PM Central Time')).toEqual({
      startTime: '12:00',
      endTime: '16:00',
    });
    expect(parseTimeRange('12:00 noon Central Time')).toEqual({ startTime: '12:00' });
  });

  test('handles lowercase meridiems', () => {
    expect(parseTimeRange('12:00 noon - 4:30pm')).toEqual({
      startTime: '12:00',
      endTime: '16:30',
    });
  });

  test('flags all-day events instead of inventing times', () => {
    expect(parseTimeRange('All Day Event')).toEqual({ allDay: true });
  });

  test('returns nothing for an unreadable value', () => {
    expect(parseTimeRange('sometime after dinner')).toEqual({});
  });
});

describe('parseScenarioLine', () => {
  test('parses the common shape', () => {
    const { scenario, unparsed } = parseScenarioLine(
      '1. **Catastrophe\'s Spark** (Levels 1-4) - [Sign up here](https://example.com/a)'
    );
    expect(unparsed).toEqual([]);
    expect(scenario).toEqual({
      name: "Catastrophe's Spark",
      levels: '1-4',
      signupUrl: 'https://example.com/a',
    });
  });

  test('parses system, type and a trailing start time', () => {
    const { scenario, unparsed } = parseScenarioLine(
      '1. **The Fanciful March of Urawl** (Pathfinder Scenario, Levels 3-6) - Starting at 5:30 PM - [Sign up here](https://example.com/b)'
    );
    expect(unparsed).toEqual([]);
    expect(scenario).toMatchObject({
      name: 'The Fanciful March of Urawl',
      system: 'Pathfinder',
      type: 'Scenario',
      levels: '3-6',
      startTime: '17:30',
      signupUrl: 'https://example.com/b',
    });
  });

  test('parses a game master credit', () => {
    const { scenario, unparsed } = parseScenarioLine(
      '1. **Friends of the Forest** (Starfinder) - GM: Bret I - [Sign up here](https://example.com/c)'
    );
    expect(unparsed).toEqual([]);
    expect(scenario).toMatchObject({
      name: 'Friends of the Forest',
      system: 'Starfinder',
      gamemaster: 'Bret I',
    });
  });

  test('parses an in-parenthetical time range and player count', () => {
    const { scenario } = parseScenarioLine(
      '1. **Friends of the Forest** (Levels 1-2, starts 6:00 PM, 5 players) - [Sign up here](https://example.com/d)'
    );
    expect(scenario).toMatchObject({
      levels: '1-2',
      startTime: '18:00',
      playerCap: 5,
    });
  });

  test('captures the game edition', () => {
    const { scenario, unparsed } = parseScenarioLine(
      '1. **The Great Absalom Relay** (Starfinder 2E Scenario) - [Sign up here](https://example.com/e)'
    );
    expect(unparsed).toEqual([]);
    expect(scenario).toMatchObject({
      system: 'Starfinder',
      edition: '2E',
      type: 'Scenario',
    });
  });

  test('recognizes repeatable, pregen and one-shot tags', () => {
    expect(parseScenarioLine('1. **X** (Pathfinder Scenario, Levels 1-4, 6 players, Repeatable) - [Sign up here](https://e.com/f)').scenario)
      .toMatchObject({ repeatable: true, playerCap: 6 });
    expect(parseScenarioLine('1. **Y** (Pathfinder Scenario, Pregenerated Characters) - [Sign up here](https://e.com/g)').scenario)
      .toMatchObject({ pregens: true });
    expect(parseScenarioLine('1. **Z** (One-Shot) - [Sign up here](https://e.com/h)').scenario)
      .toMatchObject({ type: 'One-Shot' });
  });

  test('marks a cancelled scenario and keeps its bolded time range', () => {
    const { scenario, unparsed } = parseScenarioLine(
      '2. **The Great Absalom Relay** (Starfinder Scenario, Levels 1-2) - **6:00 PM - 9:00 PM** - **CANCELLED**'
    );
    expect(unparsed).toEqual([]);
    expect(scenario).toMatchObject({
      startTime: '18:00',
      endTime: '21:00',
      cancelled: true,
    });
    expect(scenario?.signupUrl).toBeUndefined();
  });

  test('falls back to an unbolded name', () => {
    const { scenario } = parseScenarioLine(
      '1. All that Glitters (Pathfinder Scenario, Levels 1-4) - CANCELLED'
    );
    expect(scenario).toMatchObject({
      name: 'All that Glitters',
      system: 'Pathfinder',
      levels: '1-4',
      cancelled: true,
    });
  });

  test('reports tokens it does not understand rather than dropping them', () => {
    const { unparsed } = parseScenarioLine('1. **X** (Levels 1-4, Something Novel) - [Sign up here](https://e.com/i)');
    expect(unparsed).toEqual(['Something Novel']);
  });

  test('returns no scenario for a line it cannot read at all', () => {
    const { scenario } = parseScenarioLine('Just some prose.');
    expect(scenario).toBeNull();
  });
});

describe('parseDetailBullet', () => {
  test('lifts a time range', () => {
    expect(parseDetailBullet('- **Time:** 5:30 PM - 7:30 PM Central Time')).toEqual({
      field: 'time',
      value: { startTime: '17:30', endTime: '19:30' },
      label: 'time',
    });
  });

  test('lifts player cap, level range, special note and game master', () => {
    expect(parseDetailBullet('- **Players:** 6 players')).toMatchObject({ field: 'playerCap', value: 6 });
    expect(parseDetailBullet('- **Level Range:** 1-4')).toMatchObject({ field: 'levels', value: '1-4' });
    expect(parseDetailBullet('- **Special Note:** Starts early.')).toMatchObject({ field: 'specialNote' });
    expect(parseDetailBullet('- **Game Master:** Josh E')).toMatchObject({ field: 'gamemaster', value: 'Josh E' });
  });

  test('recognizes but does not lift bullets that restate front-matter', () => {
    expect(parseDetailBullet('- **Location:** Diversions')).toMatchObject({ field: null });
    expect(parseDetailBullet('- **Address:** 119 2nd St')).toMatchObject({ field: null });
  });

  test('returns null for bullets it does not map, so they survive in the body', () => {
    expect(parseDetailBullet('- **Discord:** Ask in the server')).toBeNull();
    expect(parseDetailBullet('- **Drop in and out as you please!**')).toBeNull();
    expect(parseDetailBullet('not a bullet')).toBeNull();
  });

  test('returns null for a time it cannot read', () => {
    expect(parseDetailBullet('- **Time:** whenever')).toBeNull();
  });
});

describe('parseScenarioGroupHeading', () => {
  test('reads a system grouping', () => {
    expect(parseScenarioGroupHeading('### Pathfinder Society')).toEqual({ system: 'Pathfinder' });
    expect(parseScenarioGroupHeading('### Starfinder Society')).toEqual({ system: 'Starfinder' });
  });

  test('reads a session-time grouping', () => {
    expect(parseScenarioGroupHeading('### 9:00 AM Session')).toEqual({ startTime: '09:00' });
  });

  test('returns null for a heading it does not recognize', () => {
    expect(parseScenarioGroupHeading('### Something Else')).toBeNull();
  });
});

describe('isBoilerplateRegistration', () => {
  test('matches the standard registration prose', () => {
    expect(isBoilerplateRegistration('Please register in advance using the link above. Space is limited to 6 players, so sign up early!')).toBe(true);
    expect(isBoilerplateRegistration('Please register in advance using the links above. Space is limited, so sign up early!')).toBe(true);
    expect(isBoilerplateRegistration('')).toBe(true);
  });

  test('leaves genuinely different prose alone', () => {
    expect(isBoilerplateRegistration(
      "Please register in advance using the links above. If the main table is full, please sign up for the waitlist table."
    )).toBe(false);
  });
});
