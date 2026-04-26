import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Sparkles, BookOpen, TrendingUp } from 'lucide-react';

export function Login() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        if (!displayName.trim()) {
          setError('Please enter your name');
          return;
        }
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 bg-gradient-to-br from-[#1E3A5F] via-[#2a4a6f] to-[#1B998B] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/20"
              style={{
                left: `${(i % 5) * 20}%`,
                top: `${Math.floor(i / 5) * 25}%`,
                width: '2px',
                height: '100%',
                transform: `rotate(${15 + i * 2}deg)`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full px-16 text-white">
          <div className="mb-12">
            <h1 className="text-5xl mb-4" style={{ fontWeight: 700 }}>
              Vakify 2.0
            </h1>
            <p className="text-xl text-white/90">
              Your adaptive learning operating system
            </p>
          </div>

          <div className="space-y-6 max-w-md">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-[#F4A261]" />
                <h3 className="text-lg">Platform Promise</h3>
              </div>
              <p className="text-white/80 text-sm">
                ChatGPT + Coding Lab + Adaptive Learning + Gamified Progress in one authenticated learning platform.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-[#1B998B]" />
                <h3 className="text-lg">Learning Modes</h3>
              </div>
              <p className="text-white/80 text-sm">
                Visual, audio and kinetic learning experiences through response tabs, labs, diagrams and practice loops.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-[#F4A261]" />
                <h3 className="text-lg">Track Progress</h3>
              </div>
              <p className="text-white/80 text-sm">
                XP, levels, badges, streaks and personalized insights keep you motivated and on track.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl mb-2">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-muted-foreground">
              {isSignup ? 'Start your learning journey' : 'Sign in to continue your progress'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm mb-2">Full Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="Enter your name"
                  required={isSignup}
                />
              </div>
            )}

            <div>
              <label className="block text-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
            </button>

            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Use your email and password to sign in or create a new account. No demo login or placeholder account is included.
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-secondary hover:underline"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isSignup && (
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Sign in</p>
              <p className="text-xs text-muted-foreground">Use your own account to continue your learning progress.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
