import { 
  CheckSquare, 
  YoutubeLogo, 
  GameController, 
  Bell, 
  Code, 
  Rocket, 
  Users, 
  ChefHat, 
  GraduationCap, 
  Cards, 
  CursorClick, 
  Calendar, 
  Robot, 
  PiggyBank, 
  Lightbulb, 
  ProjectorScreen, 
  MaskHappy, 
  PawPrint, 
  Monitor, 
  Clock, 
  VideoCamera, 
  FirstAid, 
  MapTrifold, 
  Layout, 
  Files, 
  CreditCard, 
  Translate, 
  MicrophoneStage, 
  Gift, 
  AppWindow,
  IconProps
} from "@phosphor-icons/react";
import React from "react";

export type AppCategory = 'Utilities' | 'Games' | 'Social' | 'Productivity' | 'Lifestyle' | 'Entertainment' | 'Dev & Design';

export interface MiniApp {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType<IconProps>;
  category: AppCategory;
  color: string;
  href: string;
  isImplemented?: boolean;
}

export const MINI_APPS: MiniApp[] = [
  // Utilities
  { id: 'morning-notifications', name: 'Morning Notifications', description: 'Weather and daily updates', icon: Bell, category: 'Utilities', color: '#FF6B6B', href: '/apps/morning' },
  { id: 'save-money', name: 'Tasarruf Challanges', description: 'Money saving challenges', icon: PiggyBank, category: 'Utilities', color: '#51CF66', href: '/apps/savings' },
  { id: 'subscription-manager', name: 'Subscription Manager', description: 'Track all your subscriptions', icon: CreditCard, category: 'Utilities', color: '#339AF0', href: '/apps/subs' },
  { id: 'medicine-stock', name: 'İlaç Stok', description: 'Track your medicine stock', icon: FirstAid, category: 'Utilities', color: '#FF8787', href: '/apps/medicine' },
  { id: 'habit-media', name: 'Habbit Media', description: 'Habit tracking with media focus', icon: Calendar, category: 'Utilities', color: '#748FFC', href: '/apps/habits' },
  
  // Games
  { id: 'telifsiz-games', name: 'Telifsiz Games', description: 'Vampir Köylü, İsim Şehir...', icon: GameController, category: 'Games', color: '#FF922B', href: '/apps/games' },
  { id: 'deck-royale', name: 'Deck Royale', description: 'Card-based game platform', icon: Cards, category: 'Games', color: '#FCC419', href: '/apps/deck-royale' },
  { id: 'catan-bot', name: 'Catan Bot', description: 'Helper for Catan board game', icon: Robot, category: 'Games', color: '#845EF7', href: '/apps/catan' },
  { id: 'free-games', name: 'Free Games', description: 'Get notifications for free games', icon: Gift, category: 'Games', color: '#20C997', href: '/apps/free-games' },
  
  // Productivity
  { id: 'bucket-list', name: 'BucketList', description: 'Your life goals tracker', icon: CheckSquare, category: 'Productivity', color: '#94D82D', href: '/apps/bucketlist' },
  { id: 'meal-planner', name: 'Meal Planner', description: 'Plan your weekly meals', icon: ChefHat, category: 'Productivity', color: '#FCC419', href: '/apps/recipe', isImplemented: true },
  { id: 'research-queue', name: 'Research Queue', description: 'Queue for your research topics', icon: Files, category: 'Productivity', color: '#ADB5BD', href: '/apps/research' },
  { id: 'life-plans', name: 'Life Plans', description: 'Long term life strategy', icon: MapTrifold, category: 'Productivity', color: '#FFD43B', href: '/apps/life-plans' },
  { id: 'notion-formula', name: 'Notion Formula Gen', description: 'AI formula generator for Notion', icon: Code, category: 'Productivity', color: '#1098AD', href: '/apps/notion' },
  
  // Social & Community
  { id: 'hackathons', name: 'TR Hackathons', description: 'Turkey hackathon list', icon: Code, category: 'Social', color: '#000000', href: '/apps/hackathons' },
  { id: 'startups', name: 'TR Startups & Studios', description: 'Ecosystem directory', icon: Rocket, category: 'Social', color: '#FF4D4D', href: '/apps/startups' },
  { id: 'community-summary', name: 'Yıl Özeti', description: 'Community based year recap', icon: Users, category: 'Social', color: '#7048E8', href: '/apps/recap' },
  { id: 'our-love-story', name: 'Our Love Story', description: 'A place for your memories', icon: MaskHappy, category: 'Social', color: '#F06595', href: '/apps/love-story' },

  // Entertainment
  { id: 'youtube-series', name: 'Youtube Series', description: 'Track your YT series', icon: YoutubeLogo, category: 'Entertainment', color: '#FF0000', href: '/apps/yt-series' },
  { id: 'theater-track', name: 'TheaterTrack', description: 'Play and theater tracker', icon: ProjectorScreen, category: 'Entertainment', color: '#BE4BDB', href: '/apps/theater' },
  { id: 'game-track', name: 'GameTrack', description: 'Track your game progress', icon: GameController, category: 'Entertainment', color: '#228BE6', href: '/apps/game-tracker' },
  { id: 'film-dub-team', name: 'Film Dublaj Ekibi', description: 'Dubbing team community', icon: MicrophoneStage, category: 'Entertainment', color: '#495057', href: '/apps/dublaj' },
  { id: 'i-saw-this-actor', name: 'I Saw This Actor', description: 'Identify actors and filmography', icon: VideoCamera, category: 'Entertainment', color: '#12B886', href: '/apps/actor' },

  // Lifestyle
  { id: 'campus-app', name: 'Campus App', description: 'Your university companion', icon: GraduationCap, category: 'Lifestyle', color: '#15AABF', href: '/apps/campus' },
  { id: 'do-instead-scrolling', name: 'Do This Instead', description: 'Stop scrolling, start living', icon: CursorClick, category: 'Lifestyle', color: '#FA5252', href: '/apps/stop-scroll' },
  { id: 'city-guide', name: 'One Day City Guide', description: 'Rapid city explorations', icon: MapTrifold, category: 'Lifestyle', color: '#82C91E', href: '/apps/city-guide' },
  { id: 'vibesort', name: 'Vibesort', description: 'Media sorted by your vibes', icon: Layout, category: 'Lifestyle', color: '#FCC419', href: '/apps/vibesort' },
  { id: 'dialect-list', name: 'Şive Listesi', description: 'TR Regional dialects tracker', icon: Translate, category: 'Lifestyle', color: '#339AF0', href: '/apps/dialects' },

  // Dev & Design
  { id: 'ai-products', name: 'All AI Products', description: 'Comprehensive AI directory', icon: Robot, category: 'Dev & Design', color: '#4C6EF5', href: '/apps/ai-list' },
  { id: 'design-suggestion', name: 'Design Suggestion', description: 'Get professional feedback', icon: Lightbulb, category: 'Dev & Design', color: '#FAB005', href: '/apps/design' },
  { id: 'tutorial-prompts', name: 'Tutorial Prompts', description: 'Learning with AI prompts', icon: Code, category: 'Dev & Design', color: '#2F9E44', href: '/apps/prompts' },
  { id: 'project-hub', name: 'Project Hub', description: 'Manage your own projects', icon: AppWindow, category: 'Dev & Design', color: '#1971C2', href: '/apps/proj-hub' },
];
