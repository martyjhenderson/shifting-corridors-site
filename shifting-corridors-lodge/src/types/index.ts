// Core data structure interfaces for the Shifting Corridors Lodge website

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  description: string;
  content: string;
  gamemaster?: string;
  gameType: 'Pathfinder' | 'Starfinder' | 'Legacy';
  maxPlayers?: number;
}

export interface GameMaster {
  id: string;
  name: string;
  organizedPlayId: string;
  games: ('Pathfinder' | 'Starfinder' | 'Legacy')[];
  bio: string;
  avatar?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  date: Date;
  excerpt: string;
  content: string;
  author?: string;
}

export interface MarkdownContent {
  frontmatter: Record<string, any>;
  content: string;
}

export interface ContentState {
  events: CalendarEvent[];
  gamemasters: GameMaster[];
  news: NewsArticle[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date;
}

export interface ContentActions {
  loadContent: () => Promise<void>;
  refreshContent: () => Promise<void>;
  selectEvent: (eventId: string) => void;
  selectGameMaster: (gmId: string) => void;
}

// Theme system interfaces
export interface Theme {
  name: 'medieval' | 'sci-fi';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  components: {
    button: string;
    card: string;
    panel: string;
    container: string;
  };
}

export interface ThemeContext {
  currentTheme: Theme;
  availableThemes: Theme[];
  setTheme: (themeName: string) => void;
}

// Analytics interfaces
export interface AnalyticsConfig {
  siteId: string;
  trackingEnabled: boolean;
  customEvents: {
    themeSwitch: string;
    eventView: string;
    gmProfileView: string;
    newsArticleView: string;
  };
}

export interface AnalyticsService {
  trackPageView(path: string): void;
  trackEvent(eventName: string, value?: number): void;
  trackThemeSwitch(theme: string): void;
  trackContentInteraction(type: 'event' | 'gm' | 'news', id: string): void;
}

// Component prop interfaces
export interface CalendarProps {
  events: CalendarEvent[];
  onEventSelect?: (event: CalendarEvent) => void;
}

export interface GameMastersProps {
  gamemasters?: GameMaster[];
  onGameMasterSelect?: (gm: GameMaster) => void;
}

export interface NewsProps {
  articles?: NewsArticle[];
  maxItems?: number;
}

export interface UpcomingEventsProps {
  events: CalendarEvent[];
  maxEvents: number;
}

export interface EventDetailsProps {
  event: CalendarEvent;
  onBack: () => void;
}

export interface AppProps {}

export interface AppState {
  currentTheme: 'medieval' | 'sci-fi';
  content: ContentState;
}

// Service interfaces
export interface ContentLoader {
  loadCalendarEvents(): Promise<CalendarEvent[]>;
  loadGameMasters(): Promise<GameMaster[]>;
  loadNewsArticles(): Promise<NewsArticle[]>;
  parseMarkdownFile(path: string): Promise<MarkdownContent>;
}