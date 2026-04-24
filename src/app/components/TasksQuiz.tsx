import { useState } from 'react';
import { CheckCircle2, Clock, Trophy, Star, Play, ChevronRight } from 'lucide-react';

export function TasksQuiz() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  const dailyTasks = [
    {
      id: 1,
      title: 'Master Array Manipulation',
      description: 'Complete 3 practice problems on array methods',
      progress: 2,
      total: 3,
      xp: 50,
      type: 'practice' as const
    },
    {
      id: 2,
      title: 'Study Time Complexity',
      description: 'Read and understand Big O notation basics',
      progress: 1,
      total: 1,
      xp: 30,
      type: 'conceptual' as const
    },
  ];

  const weeklyQuiz = {
    title: 'Data Structures & Algorithms',
    questions: 10,
    timeLimit: '30 min',
    xp: 200,
    difficulty: 'Intermediate',
    topics: ['Arrays', 'Sorting', 'Search Algorithms'],
    attempted: false,
    bestScore: 0
  };

  const previousQuizzes = [
    { title: 'Functions & Scope', score: 90, xp: 180, date: '2026-04-17' },
    { title: 'OOP Concepts', score: 85, xp: 170, date: '2026-04-10' },
    { title: 'Loops & Iterations', score: 95, xp: 190, date: '2026-04-03' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Tasks & Quizzes</h1>
        <p className="text-muted-foreground">
          Complete daily tasks and weekly quizzes to earn XP and level up
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-6 py-3 rounded-lg transition-colors ${
            activeTab === 'daily'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          Daily Tasks
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-6 py-3 rounded-lg transition-colors ${
            activeTab === 'weekly'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          Weekly Quiz
        </button>
      </div>

      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dailyTasks.map((task) => (
              <div key={task.id} className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg">{task.title}</h3>
                      {task.progress === task.total && (
                        <CheckCircle2 className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <div className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                    +{task.xp} XP
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm">
                      {task.progress}/{task.total}
                    </span>
                  </div>
                  <div className="bg-muted rounded-full h-2">
                    <div
                      className="bg-secondary h-full rounded-full transition-all"
                      style={{ width: `${(task.progress / task.total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={task.progress === task.total}
                    className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {task.progress === task.total ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Completed
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Continue
                      </>
                    )}
                  </button>
                  {task.type === 'conceptual' && task.progress < task.total && (
                    <button className="px-4 py-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
                      <Star className="w-5 h-5 text-accent" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-secondary/10 to-accent/10 border border-secondary/20 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg mb-1">Daily Streak Bonus!</h3>
                <p className="text-sm text-muted-foreground">
                  Complete all daily tasks to maintain your 7-day streak and earn bonus XP
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl text-secondary">+50</div>
                <div className="text-xs text-muted-foreground">Bonus XP</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-secondary text-white rounded-xl p-8 shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl mb-2">{weeklyQuiz.title}</h2>
                <p className="text-white/80">
                  Test your knowledge and earn big XP rewards
                </p>
              </div>
              <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm">
                {weeklyQuiz.difficulty}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-white/60 text-sm mb-1">Questions</div>
                <div className="text-2xl">{weeklyQuiz.questions}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-white/60 text-sm mb-1">Time Limit</div>
                <div className="text-2xl">{weeklyQuiz.timeLimit}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-white/60 text-sm mb-1">Reward</div>
                <div className="text-2xl">+{weeklyQuiz.xp}</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-white/60 mb-2">Topics Covered:</div>
              <div className="flex flex-wrap gap-2">
                {weeklyQuiz.topics.map((topic) => (
                  <div key={topic} className="px-3 py-1 bg-white/10 rounded-full text-sm">
                    {topic}
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full bg-white text-primary py-4 rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              Start Quiz Now
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg">Previous Quizzes</h3>
              <span className="text-sm text-muted-foreground">
                {previousQuizzes.length} completed
              </span>
            </div>

            <div className="space-y-3">
              {previousQuizzes.map((quiz, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm mb-1">{quiz.title}</h4>
                    <div className="text-xs text-muted-foreground">{quiz.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg text-secondary">{quiz.score}%</div>
                    <div className="text-xs text-muted-foreground">+{quiz.xp} XP</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
