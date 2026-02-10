export interface Member {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  badges: string[];
  joinedAt: number;
}

export interface JokePost {
  id: string;
  authorId: string;
  content: string;
  type: 'joke' | 'meme' | 'shoutout';
  reactions: { '😂': string[]; '❤️': string[] };
  createdAt: number;
  weeklyHighlight?: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: { text: string; votes: string[] }[];
  createdAt: number;
  closed: boolean;
  type: 'decision' | 'thisorthat';
}

export interface GuessQuote {
  id: string;
  quote: string;
  actualPersonId: string;
  submittedBy: string;
  guesses: { memberId: string; guessedPersonId: string }[];
  revealed: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  badgeReward?: string;
  completedBy: string[];
  weekStart: number;
}

// --- RESTORED TRIVIA INTERFACE ---
export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

// --- CHAT INTERFACE ---
export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: number;
}

export interface AppState {
  currentUser: Member | null;
  members: Member[];
  jokeFeed: JokePost[];
  polls: Poll[];
  guessQuotes: GuessQuote[];
  challenges: Challenge[];
  triviaScores: Record<string, number>;
  chatMessages: ChatMessage[];
}

export const getEmptyState = (): AppState => ({
  currentUser: null,
  members: [],
  jokeFeed: [],
  polls: [],
  guessQuotes: [],
  challenges: [],
  triviaScores: {},
  chatMessages: [],
});

export const generateId = () => Math.random().toString(36).substr(2, 9);

// --- RESTORED DATA CONSTANTS ---

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  { question: "How many books are in the Bible?", options: ["55", "66", "72", "81"], correctIndex: 1 },
  { question: "Who built the ark?", options: ["Moses", "Abraham", "Noah", "David"], correctIndex: 2 },
  { question: "What is the shortest verse in the Bible?", options: ["Jesus wept", "God is love", "Pray always", "Be still"], correctIndex: 0 },
  { question: "Who always forgets their notebook? 📓", options: ["Sarah", "Joshua", "Grace", "Caleb"], correctIndex: 1 },
  { question: "How many disciples did Jesus have?", options: ["10", "11", "12", "13"], correctIndex: 2 },
  { question: "Who is our unofficial 'Snack Bringer'?", options: ["Grace", "David", "Michael", "Joy"], correctIndex: 1 },
  { question: "What was the first miracle of Jesus?", options: ["Walking on water", "Feeding 5000", "Turning water to wine", "Healing the blind"], correctIndex: 2 },
  { question: "Who arrived last to youth group 3 weeks in a row?", options: ["Daniel", "Caleb", "Michael", "Ruth"], correctIndex: 2 },
  { question: "Which book comes first in the New Testament?", options: ["Mark", "Luke", "John", "Matthew"], correctIndex: 3 },
  { question: "What is the golden rule about?", options: ["Gold", "Treating others well", "Church attendance", "Tithing"], correctIndex: 1 },
  { question: "Who parted the Red Sea?", options: ["Joshua", "David", "Moses", "Elijah"], correctIndex: 2 },
  { question: "Who brings the best potluck dishes?", options: ["Sarah", "Hannah", "Joy", "Ruth"], correctIndex: 2 },
];

export const BADGE_ICONS: Record<string, string> = {
  'Kindness Crew': '💛',
  'Snack Bringer': '🍪',
  'Prayer Warrior': '🙏',
  'Meme Lord': '🎭',
  'Encourager': '💪',
  'Trivia Master': '🧠',
  'Game Champion': '🏆',
  'Social Butterfly': '🦋',
};