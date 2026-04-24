import { useEffect, useMemo, useState } from 'react';
import { Users, Shield, Award, Activity, AlertTriangle, TrendingUp, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type AdminSummary = {
  metrics: {
    users: number;
    learning_styles: number;
    chat_messages: number;
    practice_submissions: number;
    downloads: number;
  };
  latest_users: Array<{ user_id: number; name: string; email: string; created_at: string; is_admin: boolean }>;
  latest_chats: Array<{ chat_id: number; user_id: number; question: string; response_type: string; timestamp: string }>;
};

type AdminUser = {
  user_id: number;
  name: string;
  email: string;
  is_admin: boolean;
  learning_style: string | null;
  created_at: string;
  stats: { chats: number; downloads: number; practice: number };
};

type AdminAnalytics = {
  style_distribution: Record<string, number>;
  daily_signups: Array<{ date: string; count: number }>;
  daily_chats: Array<{ date: string; count: number }>;
  daily_feedback: Array<{ date: string; count: number }>;
  feedback_summary: { total: number; helpful: number; needs_work: number; avg_rating: number };
};

export function AdminConsole() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'rewards' | 'analytics'>('users');
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [summaryRes, usersRes, analyticsRes] = await Promise.all([
          apiFetch<AdminSummary>('/api/admin/summary'),
          apiFetch<AdminUser[]>('/api/admin/users'),
          apiFetch<AdminAnalytics>('/api/admin/analytics'),
        ]);
        if (cancelled) {
          return;
        }
        setSummary(summaryRes);
        setUsers(usersRes);
        setAnalytics(analyticsRes);
      } catch {
        if (!cancelled) {
          setSummary(null);
          setUsers([]);
          setAnalytics(null);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(
    () => users.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase())),
    [query, users],
  );

  const platformStats = [
    { label: 'Total Users', value: String(summary?.metrics.users ?? 0), change: `+${summary?.latest_users.length ?? 0}`, icon: Users, color: 'text-secondary' },
    { label: 'Active Today', value: String(summary?.metrics.chat_messages ?? 0), change: '+backend', icon: Activity, color: 'text-accent' },
    { label: 'Moderators', value: String(users.filter((item) => !item.is_admin).length), change: `Admin: ${user?.role === 'admin' ? 'yes' : 'no'}`, icon: Shield, color: 'text-primary' },
    { label: 'Flagged Content', value: String(analytics?.feedback_summary.total ?? 0), change: `${analytics?.feedback_summary.needs_work ?? 0} needs work`, icon: AlertTriangle, color: 'text-destructive' },
  ];

  const activityData = (analytics?.daily_chats || []).map((row) => ({
    day: row.date.slice(5),
    users: row.count,
  }));

  const recentBadges = [
    { name: 'Code Master', recipients: summary?.metrics.practice_submissions ?? 0, created: 'Live data' },
    { name: 'Quiz Champion', recipients: summary?.metrics.chat_messages ?? 0, created: 'Live data' },
    { name: 'Streak Legend', recipients: summary?.metrics.downloads ?? 0, created: 'Live data' },
  ];

  const handleDelete = async (userId: number) => {
    await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    const refreshed = await apiFetch<AdminUser[]>('/api/admin/users');
    setUsers(refreshed);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Admin Console</h1>
        <p className="text-muted-foreground">
          Manage platform users, roles, rewards and monitor platform health
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {platformStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-6 h-6 ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.change}</span>
              </div>
              <div className="text-3xl mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-secondary" />
          User Activity (Last 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={activityData.length ? activityData : [{ day: 'Mon', users: 0 }]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#1B998B" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 mb-6">
        {[
          { id: 'users' as const, label: 'User Management', icon: Users },
          { id: 'roles' as const, label: 'Role Control', icon: Shield },
          { id: 'rewards' as const, label: 'Rewards & Badges', icon: Award },
          { id: 'analytics' as const, label: 'Analytics', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:bg-muted'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'users' && (
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm">User</th>
                  <th className="px-6 py-4 text-left text-sm">Role</th>
                  <th className="px-6 py-4 text-left text-sm">Level</th>
                  <th className="px-6 py-4 text-left text-sm">XP</th>
                  <th className="px-6 py-4 text-left text-sm">Status</th>
                  <th className="px-6 py-4 text-left text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((userRow) => (
                  <tr key={userRow.user_id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm">{userRow.name}</div>
                        <div className="text-xs text-muted-foreground">{userRow.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex px-3 py-1 rounded-full text-xs ${
                        userRow.is_admin ? 'bg-destructive/10 text-destructive' : userRow.learning_style === 'kinesthetic' ? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'
                      }`}>
                        {userRow.is_admin ? 'admin' : 'learner'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{userRow.stats.practice}</td>
                    <td className="px-6 py-4 text-sm">{userRow.stats.chats}</td>
                    <td className="px-6 py-4">
                      <div className="inline-flex px-3 py-1 rounded-full text-xs bg-secondary/10 text-secondary">
                        active
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => void handleDelete(userRow.user_id)} className="text-destructive hover:underline text-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg mb-6">Role Management</h3>
          <div className="space-y-4">
            {['Learner', 'Moderator', 'Admin'].map((role) => (
              <div key={role} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base">{role}</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {role === 'Learner' && 'Access to learning features, tasks, and rewards'}
                  {role === 'Moderator' && 'Can review content and moderate reported responses'}
                  {role === 'Admin' && 'Full platform control and user management'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg">Badges & Rewards Management</h3>
          </div>

          <div className="space-y-3">
            {recentBadges.map((badge) => (
              <div key={badge.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <h4 className="text-sm mb-1">{badge.name}</h4>
                  <p className="text-xs text-muted-foreground">Created: {badge.created}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">{badge.recipients} recipients</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg mb-4">Platform Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Server Uptime</span>
                <span className="text-sm">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <span className="text-sm">125ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Error Rate</span>
                <span className="text-sm">0.1%</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg mb-4">Content Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Chats</span>
                <span className="text-sm">{summary?.metrics.chat_messages ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lab Submissions</span>
                <span className="text-sm">{summary?.metrics.practice_submissions ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quizzes Taken</span>
                <span className="text-sm">{summary?.metrics.downloads ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
