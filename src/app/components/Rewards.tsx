import { useEffect, useState } from 'react';
import { Trophy, Award, Star, TrendingUp, Gift, Crown, Zap } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type RewardSummary = {
  wallet: { current_xp: number; level: number; reward_points: number };
  streak: { current_streak: number; longest_streak: number; last_active_date: string | null };
  recent_xp_events: Array<{ event_id: number; source: string; points: number; created_at: string }>;
};

type LeaderboardRow = { rank: number; name: string; score: number };

export function Rewards() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const results = await Promise.allSettled([
          apiFetch<RewardSummary>('/api/rewards/summary'),
          apiFetch<{ rows: LeaderboardRow[] }>('/api/leaderboard?scope=all_time'),
        ]);
        if (cancelled) {
          return;
        }

        const [summaryRes, leaderboardRes] = results;
        if (summaryRes.status === 'fulfilled') {
          setSummary(summaryRes.value);
        }
        if (leaderboardRes.status === 'fulfilled') {
          setLeaderboard(leaderboardRes.value.rows || []);
        }
      } catch {
        if (!cancelled) {
          setSummary(null);
          setLeaderboard([]);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const badges = [
    { id: 1, name: 'First Steps', icon: '🎯', earned: true, date: '2026-04-01', description: 'Complete your first task' },
    { id: 2, name: 'Code Master', icon: '💻', earned: true, date: '2026-04-05', description: 'Run 10 successful code submissions' },
    { id: 3, name: 'Quiz Champion', icon: '🏆', earned: true, date: '2026-04-12', description: 'Score 90%+ on a weekly quiz' },
    { id: 4, name: 'Streak Legend', icon: '🔥', earned: true, date: '2026-04-20', description: 'Maintain a 7-day streak' },
    { id: 5, name: 'Night Owl', icon: '🦉', earned: false, description: 'Complete a task after midnight' },
    { id: 6, name: 'Speed Demon', icon: '⚡', earned: false, description: 'Finish a quiz in under 10 minutes' },
  ];

  const rewardVault = [
    { id: 1, name: 'Custom Avatar Frame', cost: 500, icon: Crown, available: true },
    { id: 2, name: 'XP Boost (24h)', cost: 300, icon: Zap, available: true },
    { id: 3, name: 'Unlock Exclusive Course', cost: 1000, icon: Star, available: false },
    { id: 4, name: 'Priority Support', cost: 750, icon: Trophy, available: true },
  ];

  const earnedBadges = badges.filter((badge) => badge.earned);
  const lockedBadges = badges.filter((badge) => !badge.earned);

  const leaderboardRows = leaderboard.length
    ? leaderboard
    : [
        { rank: 1, name: 'Alex Chen', score: 2450 },
        { rank: 2, name: 'Sarah Kim', score: 2180 },
        { rank: 3, name: user?.displayName || 'You', score: user?.xp || 0 },
        { rank: 4, name: 'Mike Ross', score: 1120 },
        { rank: 5, name: 'Emma Wilson', score: 980 },
      ];

  const xpHistory = summary?.recent_xp_events?.length
    ? summary.recent_xp_events.slice(0, 5).map((event) => ({
        date: event.created_at.slice(0, 10),
        activity: event.source.replace(/_/g, ' '),
        xp: event.points,
      }))
    : [
        { date: '2026-04-24', activity: 'Completed Daily Task', xp: 50 },
        { date: '2026-04-24', activity: 'Lab Submission', xp: 25 },
        { date: '2026-04-23', activity: 'Weekly Quiz', xp: 200 },
        { date: '2026-04-23', activity: 'AI Chat Practice', xp: 15 },
        { date: '2026-04-22', activity: 'Badge Unlocked', xp: 100 },
      ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Rewards & Achievements</h1>
        <p className="text-muted-foreground">
          Track your progress, unlock badges, and climb the leaderboard
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl flex items-center gap-2">
                <Award className="w-6 h-6 text-accent" />
                Badges
              </h2>
              <span className="text-sm text-muted-foreground">
                {earnedBadges.length}/{badges.length} Unlocked
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-sm text-muted-foreground mb-3">Earned Badges</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {earnedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-gradient-to-br from-secondary/10 to-accent/10 border border-secondary/20 rounded-xl p-4 hover:scale-105 transition-transform cursor-pointer"
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <div className="text-sm mb-1">{badge.name}</div>
                    <div className="text-xs text-muted-foreground">{badge.date}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm text-muted-foreground mb-3">Locked Badges</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {lockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-muted/50 border border-border rounded-xl p-4 opacity-50"
                  >
                    <div className="text-4xl mb-2 grayscale">{badge.icon}</div>
                    <div className="text-sm mb-1">{badge.name}</div>
                    <div className="text-xs text-muted-foreground">{badge.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl flex items-center gap-2 mb-6">
              <Gift className="w-6 h-6 text-destructive" />
              Reward Vault
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rewardVault.map((reward) => {
                const Icon = reward.icon;
                return (
                  <div
                    key={reward.id}
                    className={`border rounded-xl p-4 ${
                      reward.available
                        ? 'border-border bg-card hover:border-secondary hover:bg-secondary/5 cursor-pointer'
                        : 'border-border bg-muted/50 opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm mb-1">{reward.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-lg text-accent">{reward.cost}</span>
                          <span className="text-xs text-muted-foreground">XP</span>
                        </div>
                      </div>
                    </div>
                    {reward.available ? (
                      <button className="w-full mt-4 bg-primary text-primary-foreground py-2 rounded-lg hover:opacity-90 transition-opacity text-sm">
                        Redeem
                      </button>
                    ) : (
                      <button className="w-full mt-4 bg-muted text-muted-foreground py-2 rounded-lg cursor-not-allowed text-sm">
                        Locked
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-secondary" />
              XP History
            </h2>

            <div className="space-y-2">
              {xpHistory.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <div className="text-sm">{entry.activity}</div>
                    <div className="text-xs text-muted-foreground">{entry.date}</div>
                  </div>
                  <div className="text-lg text-accent">+{entry.xp}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-secondary text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8" />
              <h2 className="text-xl">Your Rank</h2>
            </div>
            <div className="text-5xl mb-2">
              #{leaderboardRows.find((row) => row.name === user?.displayName)?.rank || 3}
            </div>
            <div className="text-white/80 mb-4">Global Ranking</div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-sm text-white/60 mb-1">Next Rank</div>
              <div className="text-lg">
                {Math.max(0, (leaderboardRows.find((row) => row.name === user?.displayName)?.score || 0) - 530)} XP to go
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl flex items-center gap-2 mb-6">
              <Trophy className="w-6 h-6 text-accent" />
              Leaderboard
            </h2>

            <div className="space-y-2">
              {leaderboardRows.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    entry.name === user?.displayName
                      ? 'bg-secondary/10 border border-secondary'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">
                    {entry.rank === 1 ? '👑' : entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{entry.name}</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{entry.score}</div>
                    <div className="text-xs text-muted-foreground">XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
