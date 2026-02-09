export interface Task {
  id: string;
  title: string;
  status: 'ignored' | 'panic' | 'done' | 'overdue';
  deadline: string;
  despairContribution: number;
  npcComments: {
    npc: string;
    comment: string;
  }[];
}

export interface NPCPersonality {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  quotes: string[];
}

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Linear Algebra Problem Set',
    status: 'overdue',
    deadline: '2026-02-06',
    despairContribution: 35,
    npcComments: [
      {
        npc: 'Hostile Mentor',
        comment: 'Remarkable consistency in doing nothing.',
      },
      {
        npc: 'Fake Motivational Coach',
        comment: 'Believe in yourself. Because no one else does.',
      },
    ],
  },
  {
    id: '2',
    title: 'Research Paper First Draft',
    status: 'ignored',
    deadline: '2026-02-09',
    despairContribution: 42,
    npcComments: [
      {
        npc: 'Hostile Mentor',
        comment: 'Oh look. Procrastination again. Groundbreaking.',
      },
      {
        npc: 'Chaotic Friend',
        comment: 'Skip it. Future you loves surprises.',
      },
    ],
  },
  {
    id: '3',
    title: 'Read 3 Academic Articles',
    status: 'ignored',
    deadline: '2026-02-10',
    despairContribution: 18,
    npcComments: [
      {
        npc: 'Fake Motivational Coach',
        comment: 'Reading is hard when Netflix exists.',
      },
    ],
  },
  {
    id: '4',
    title: 'Group Project Contribution',
    status: 'panic',
    deadline: '2026-02-08',
    despairContribution: 55,
    npcComments: [
      {
        npc: 'Chaotic Friend',
        comment: "It's teamwork if you let them do everything.",
      },
      {
        npc: 'Hostile Mentor',
        comment: 'Your group already hates you. Well done.',
      },
    ],
  },
  {
    id: '5',
    title: 'Fix Bibliography Formatting',
    status: 'done',
    deadline: '2026-02-07',
    despairContribution: 0,
    npcComments: [
      {
        npc: 'Fake Motivational Coach',
        comment: 'Wow. You did something. Miracle.',
      },
    ],
  },
];

export const npcPersonalities: NPCPersonality[] = [
  {
    id: 'hostile',
    name: 'Hostile Mentor',
    avatar: '😤',
    personality: 'Brutally honest academic disappointment',
    quotes: [
      'You rest a lot for someone who hasn\'t worked.',
      'Remarkable consistency in doing nothing.',
      'Oh look. Procrastination again. Groundbreaking.',
      'Your group already hates you. Well done.',
      'At this rate, mediocrity is aspirational.',
    ],
  },
  {
    id: 'chaotic',
    name: 'Chaotic Friend',
    avatar: '😈',
    personality: 'Enabler of bad decisions',
    quotes: [
      'Skip it. Future you loves surprises.',
      'It\'s teamwork if you let them do everything.',
      'Coffee counts as productivity.',
      'Deadlines are just suggestions from people who lack vision.',
      'Why start today when tomorrow exists?',
    ],
  },
  {
    id: 'motivational',
    name: 'Fake Motivational Coach',
    avatar: '😊',
    personality: 'Toxic positivity with a twist',
    quotes: [
      'Believe in yourself. Because no one else does.',
      'Failure is just success… but reversed.',
      'Reading is hard when Netflix exists.',
      'Wow. You did something. Miracle.',
      'Every day is a fresh start to disappoint everyone again.',
    ],
  },
];

export const moodData = [
  { date: '02/02', mood: 3, tasksCompleted: 0 },
  { date: '02/03', mood: 2, tasksCompleted: 1 },
  { date: '02/04', mood: 4, tasksCompleted: 0 },
  { date: '02/05', mood: 2, tasksCompleted: 0 },
  { date: '02/06', mood: 1, tasksCompleted: 2 },
  { date: '02/07', mood: 3, tasksCompleted: 1 },
  { date: '02/08', mood: 2, tasksCompleted: 0 },
];

export const productivityData = [
  { day: 'Mon', completed: 2, ignored: 5 },
  { day: 'Tue', completed: 1, ignored: 6 },
  { day: 'Wed', completed: 0, ignored: 7 },
  { day: 'Thu', completed: 3, ignored: 4 },
  { day: 'Fri', completed: 1, ignored: 6 },
  { day: 'Sat', completed: 0, ignored: 7 },
  { day: 'Sun', completed: 0, ignored: 7 },
];

export const procrastinationInsights = {
  peakAvoidanceHour: '2 AM',
  avgDelayDays: 4.2,
  excusesGenerated: 47,
  snoozeButtonHits: 156,
};