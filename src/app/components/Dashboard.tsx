import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router';
import {
  TrendingUp,
  Flame,
  Target,
  Award,
  ChevronRight,
  Clock,
  BookOpen,
  Code,
  Trophy,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function Dashboard() {
  const { user } = useAuth();

  const xpData = [
    { day: 'Mon', xp: 120 },
    { day: 'Tue', xp: 180 },
    { day: 'Wed', xp: 150 },
    { day: 'Thu', xp: 220 },
    { day: 'Fri', xp: 190 },
    { day: 'Sat', xp: 250 },
    { day: 'Sun', xp: 140 },
  ];

  const languageProgress = [
    { lang: 'Python', progress: 75 },
    { lang: 'JavaScript', progress: 60 },
    { lang: 'Java', progress: 45 },
    { lang: 'C++', progress: 30 },
  ];

  const leaderboard = [
    { rank: 1, name: 'Alex Chen', xp: 2450, avatar: '👨' },
    { rank: 2, name: 'Sarah Kim', xp: 2180, avatar: '👩' },
    { rank: 3, name: 'You', xp: user?.xp || 0, avatar: '⭐' },
    { rank: 4, name: 'Mike Ross', xp: 1120, avatar: '👨' },
    { rank: 5, name: 'Emma Wilson', xp: 980, avatar: '👩' },
  ];

  const dailyTask = {
    title: 'Master Array Manipulation',
    description: 'Complete 3 practice problems on array methods',
    progress: 2,
    total: 3,
    xp: 50
  };

  const weeklyQuiz = {
    title: 'Weekly Challenge: Data Structures',
    questions: 10,
    timeLimit: '30 min',
    xp: 200,
    available: true
  };

  const nextTopics = [
    { title: 'Binary Search Trees', confidence: 'Low', color: 'text-destructive' },
    { title: 'Hash Tables', confidence: 'Medium', color: 'text-accent' },
    { title: 'Graph Algorithms', confidence: 'High', color: 'text-secondary' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">
          Welcome back, {user?.displayName}!
        </h1>
        <p className="text-muted-foreground">
          Let's continue your learning journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-secondary to-secondary/80 text-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8" />
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs">
              Level {user?.level}
            </div>
          </div>
          <div className="text-3xl mb-1">{user?.xp} XP</div>
          <div className="text-white/80 text-sm">Total Experience</div>
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-full rounded-full"
              style={{ width: `${((user?.xp || 0) % 500) / 5}%` }}
            />
          </div>
          <div className="text-xs text-white/60 mt-1">
            {500 - ((user?.xp || 0) % 500)} XP to next level
          </div>
        </div>

        <div className="bg-gradient-to-br from-accent to-accent/80 text-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Flame className="w-8 h-8" />
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs">
              On Fire!
            </div>
          </div>
          <div className="text-3xl mb-1">{user?.streak} Days</div>
          <div className="text-white/80 text-sm">Current Streak</div>
          <div className="mt-4 text-xs text-white/90">
            Keep going! You're on a roll
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8" />
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs">
              Great!
            </div>
          </div>
          <div className="text-3xl mb-1">{user?.accuracy}%</div>
          <div className="text-white/80 text-sm">Accuracy Rate</div>
          <div className="mt-4 text-xs text-white/90">
            You're doing excellent
          </div>
        </div>

        <div className="bg-gradient-to-br from-destructive to-destructive/80 text-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8" />
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs">
              Earned
            </div>
          </div>
          <div className="text-3xl mb-1">12</div>
          <div className="text-white/80 text-sm">Total Badges</div>
          <div className="mt-4 text-xs text-white/90">
            3 more this week
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              XP Progress This Week
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={xpData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="xp" stroke="#1B998B" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              Language Progress
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={languageProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="lang" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="progress" fill="#1E3A5F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                Daily Task
              </h3>
              <span className="text-sm text-muted-foreground">
                +{dailyTask.xp} XP
              </span>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-base">{dailyTask.title}</h4>
                <span className="text-sm text-muted-foreground">
                  {dailyTask.progress}/{dailyTask.total}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {dailyTask.description}
              </p>
              <div className="bg-muted rounded-full h-2">
                <div
                  className="bg-secondary h-full rounded-full transition-all"
                  style={{ width: `${(dailyTask.progress / dailyTask.total) * 100}%` }}
                />
              </div>
            </div>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-2 text-secondary hover:underline"
            >
              Continue Task
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-destructive" />
                Weekly Quiz
              </h3>
              {weeklyQuiz.available && (
                <div className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded">
                  Available
                </div>
              )}
            </div>
            <h4 className="text-base mb-3">{weeklyQuiz.title}</h4>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Questions</span>
                <span>{weeklyQuiz.questions}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Time Limit</span>
                <span>{weeklyQuiz.timeLimit}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reward</span>
                <span className="text-accent">+{weeklyQuiz.xp} XP</span>
              </div>
            </div>
            <Link
              to="/tasks"
              className="w-full block text-center bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Start Quiz
            </Link>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Leaderboard
            </h3>
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.name === 'You'
                      ? 'bg-secondary/10 border border-secondary'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </div>
                    <div>
                      <div className="text-sm">{entry.name}</div>
                      <div className="text-xs text-muted-foreground">{entry.xp} XP</div>
                    </div>
                  </div>
                  {entry.name === 'You' && (
                    <Zap className="w-4 h-4 text-secondary" />
                  )}
                </div>
              ))}
            </div>
            <Link
              to="/rewards"
              className="mt-4 inline-flex items-center gap-2 text-secondary hover:underline text-sm"
            >
              View Full Leaderboard
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-destructive" />
              Next Recommendations
            </h3>
            <div className="space-y-3">
              {nextTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{topic.title}</span>
                  <span className={`text-xs ${topic.color}`}>
                    {topic.confidence}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/insights"
              className="mt-4 inline-flex items-center gap-2 text-secondary hover:underline text-sm"
            >
              View All Insights
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
