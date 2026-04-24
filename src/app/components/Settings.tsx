import { useAuth } from '../contexts/AuthContext';
import { User, Bell, Lock, Palette, Globe } from 'lucide-react';

export function Settings() {
  const { user } = useAuth();

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and privacy settings
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Profile Information</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Display Name</label>
              <input
                type="text"
                defaultValue={user?.displayName}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                defaultValue={user?.email}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-accent" />
            <h3 className="text-lg">Notifications</h3>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Daily task reminders', description: 'Get notified about new daily tasks' },
              { label: 'Weekly quiz availability', description: 'Receive alerts when new quizzes are available' },
              { label: 'Achievement unlocked', description: 'Celebrate when you earn new badges' },
              { label: 'Streak alerts', description: 'Reminders to maintain your learning streak' },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between">
                <div>
                  <div className="text-sm mb-1">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-destructive" />
            <h3 className="text-lg">Privacy & Security</h3>
          </div>

          <div className="space-y-4">
            <div>
              <button className="text-primary hover:underline text-sm">
                Change Password
              </button>
            </div>
            <div>
              <button className="text-primary hover:underline text-sm">
                Two-Factor Authentication
              </button>
            </div>
            <div>
              <button className="text-destructive hover:underline text-sm">
                Delete Account
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-secondary" />
            <h3 className="text-lg">Appearance</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Theme</label>
              <select className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-accent" />
            <h3 className="text-lg">Language & Region</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Preferred Language</label>
              <select className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
            Save Changes
          </button>
          <button className="border border-border px-6 py-3 rounded-lg hover:bg-muted transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
