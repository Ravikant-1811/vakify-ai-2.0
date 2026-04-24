import { useState } from 'react';
import { Users, Shield, Award, Activity, AlertTriangle, TrendingUp, Settings, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AdminConsole() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'rewards' | 'analytics'>('users');

  const users = [
    { id: 1, name: 'Alex Chen', email: 'alex@example.com', role: 'learner', level: 12, xp: 2450, status: 'active' },
    { id: 2, name: 'Sarah Kim', email: 'sarah@example.com', role: 'learner', level: 11, xp: 2180, status: 'active' },
    { id: 3, name: 'Mike Ross', email: 'mike@example.com', role: 'moderator', level: 5, xp: 1120, status: 'active' },
    { id: 4, name: 'Emma Wilson', email: 'emma@example.com', role: 'learner', level: 4, xp: 980, status: 'inactive' },
  ];

  const platformStats = [
    { label: 'Total Users', value: '2,456', change: '+12%', icon: Users, color: 'text-secondary' },
    { label: 'Active Today', value: '847', change: '+8%', icon: Activity, color: 'text-accent' },
    { label: 'Moderators', value: '12', change: '+2', icon: Shield, color: 'text-primary' },
    { label: 'Flagged Content', value: '3', change: '-5', icon: AlertTriangle, color: 'text-destructive' },
  ];

  const activityData = [
    { day: 'Mon', users: 650 },
    { day: 'Tue', users: 720 },
    { day: 'Wed', users: 680 },
    { day: 'Thu', users: 790 },
    { day: 'Fri', users: 850 },
    { day: 'Sat', users: 920 },
    { day: 'Sun', users: 800 },
  ];

  const recentBadges = [
    { name: 'Code Master', recipients: 45, created: '2026-04-20' },
    { name: 'Quiz Champion', recipients: 32, created: '2026-04-15' },
    { name: 'Streak Legend', recipients: 28, created: '2026-04-10' },
  ];

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
                <span className={`text-sm ${stat.change.startsWith('+') ? 'text-secondary' : 'text-destructive'}`}>
                  {stat.change}
                </span>
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
          <LineChart data={activityData}>
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
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                Add User
              </button>
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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex px-3 py-1 rounded-full text-xs ${
                        user.role === 'admin' ? 'bg-destructive/10 text-destructive' :
                        user.role === 'moderator' ? 'bg-accent/10 text-accent' :
                        'bg-secondary/10 text-secondary'
                      }`}>
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.level}</td>
                    <td className="px-6 py-4 text-sm">{user.xp}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex px-3 py-1 rounded-full text-xs ${
                        user.status === 'active' ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {user.status}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-primary hover:underline text-sm mr-3">Edit</button>
                      <button className="text-destructive hover:underline text-sm">Delete</button>
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
                  <button className="text-primary hover:underline text-sm">Edit Permissions</button>
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
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Create Badge
            </button>
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
                  <button className="text-primary hover:underline text-sm">Edit</button>
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
                <span className="text-sm">12,456</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lab Submissions</span>
                <span className="text-sm">8,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quizzes Taken</span>
                <span className="text-sm">3,567</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
