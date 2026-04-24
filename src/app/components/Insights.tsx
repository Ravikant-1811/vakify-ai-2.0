import { TrendingUp, TrendingDown, Target, Brain, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function Insights() {
  const topicConfidence = [
    { topic: 'Arrays', confidence: 85, trend: 'up' },
    { topic: 'Sorting', confidence: 75, trend: 'up' },
    { topic: 'Hash Tables', confidence: 60, trend: 'neutral' },
    { topic: 'Recursion', confidence: 45, trend: 'down' },
    { topic: 'Graphs', confidence: 30, trend: 'down' },
  ];

  const learningStyleData = [
    { subject: 'Visual', value: 75 },
    { subject: 'Audio', value: 50 },
    { subject: 'Kinetic', value: 85 },
    { subject: 'Reading', value: 60 },
  ];

  const weakTopics = [
    { name: 'Recursion', score: 45, priority: 'High', color: '#E76F51' },
    { name: 'Graph Algorithms', score: 30, priority: 'High', color: '#E76F51' },
    { name: 'Dynamic Programming', score: 55, priority: 'Medium', color: '#F4A261' },
  ];

  const performanceOverTime = [
    { week: 'Week 1', score: 65 },
    { week: 'Week 2', score: 70 },
    { week: 'Week 3', score: 75 },
    { week: 'Week 4', score: 85 },
  ];

  const skillDistribution = [
    { name: 'Data Structures', value: 400 },
    { name: 'Algorithms', value: 300 },
    { name: 'Problem Solving', value: 200 },
    { name: 'Code Quality', value: 100 },
  ];

  const COLORS = ['#1B998B', '#F4A261', '#E76F51', '#1E3A5F'];

  const recommendations = [
    {
      title: 'Practice Recursion Daily',
      description: 'Your recursion confidence is low. Complete 2 recursion problems daily for the next week.',
      impact: 'High',
      icon: Target
    },
    {
      title: 'Visual Learning Boost',
      description: 'You learn best visually. Try using diagram mode more often in AI chat.',
      impact: 'Medium',
      icon: Brain
    },
    {
      title: 'Maintain Your Streak',
      description: 'You have a 7-day streak! Keep completing daily tasks to maintain momentum.',
      impact: 'Medium',
      icon: CheckCircle2
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Learning Insights</h1>
        <p className="text-muted-foreground">
          Understand your strengths, weaknesses, and personalized recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-secondary to-secondary/80 text-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8" />
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs">
              This Month
            </div>
          </div>
          <div className="text-3xl mb-1">+15%</div>
          <div className="text-white/80 text-sm">Overall Improvement</div>
        </div>

        <div className="bg-gradient-to-br from-accent to-accent/80 text-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8" />
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs">
              Average
            </div>
          </div>
          <div className="text-3xl mb-1">78%</div>
          <div className="text-white/80 text-sm">Confidence Score</div>
        </div>

        <div className="bg-gradient-to-br from-destructive to-destructive/80 text-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8" />
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs">
              Focus Areas
            </div>
          </div>
          <div className="text-3xl mb-1">3</div>
          <div className="text-white/80 text-sm">Topics Need Work</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-destructive" />
            Topic Confidence
          </h3>

          <div className="space-y-4">
            {topicConfidence.map((topic) => (
              <div key={topic.topic}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{topic.topic}</span>
                    {topic.trend === 'up' && <TrendingUp className="w-4 h-4 text-secondary" />}
                    {topic.trend === 'down' && <TrendingDown className="w-4 h-4 text-destructive" />}
                  </div>
                  <span className="text-sm text-muted-foreground">{topic.confidence}%</span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      topic.confidence >= 70 ? 'bg-secondary' :
                      topic.confidence >= 50 ? 'bg-accent' :
                      'bg-destructive'
                    }`}
                    style={{ width: `${topic.confidence}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg mb-6 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Learning Style Analysis
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={learningStyleData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" stroke="#64748b" />
              <PolarRadiusAxis stroke="#64748b" />
              <Radar name="Preference" dataKey="value" stroke="#1B998B" fill="#1B998B" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>

          <p className="text-sm text-muted-foreground mt-4">
            You learn best through kinetic (hands-on) and visual methods. Adjust your learning mode preferences to maximize effectiveness.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            Performance Over Time
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="score" fill="#1B998B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 flex items-center gap-2 text-sm text-secondary">
            <TrendingUp className="w-4 h-4" />
            <span>+20% improvement this month!</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            Skill Distribution
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={skillDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {skillDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Weak Topics
          </h3>

          <div className="space-y-4">
            {weakTopics.map((topic) => (
              <div
                key={topic.name}
                className="p-4 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm">{topic.name}</h4>
                  <div
                    className="px-3 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: `${topic.color}20`,
                      color: topic.color
                    }}
                  >
                    {topic.priority} Priority
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${topic.score}%`,
                        backgroundColor: topic.color
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">{topic.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg mb-6 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" />
            Personalized Recommendations
          </h3>

          <div className="space-y-4">
            {recommendations.map((rec, index) => {
              const Icon = rec.icon;
              return (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm">{rec.title}</h4>
                        <div className="px-2 py-1 rounded text-xs bg-accent/10 text-accent">
                          {rec.impact} Impact
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
