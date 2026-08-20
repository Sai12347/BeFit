import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Leaf, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, name);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-neutral-50">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-neutral-800">BeFit</span>
          </div>

          <h1 className="text-3xl font-display font-bold text-neutral-800 mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-neutral-500 mb-8">
            {mode === 'signin'
              ? 'Sign in to track your meals and reach your goals.'
              : 'Start your journey to healthier eating today.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="input-field pl-11"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-11"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 animate-slide-up">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-primary-600 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/57556/pexels-photo-57556.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt="Healthy food bowl"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800/60 to-primary-900/40" />
        <div className="relative z-10 max-w-md text-white p-12 animate-slide-up">
          <h2 className="text-4xl font-display font-bold mb-4 leading-tight">
            Eat smarter, live better.
          </h2>
          <p className="text-lg text-white/90 leading-relaxed">
            Plan your meals, track your nutrition, and reach your health goals — all in one beautiful app.
          </p>
          <div className="flex gap-8 mt-8">
            <div>
              <div className="text-3xl font-display font-bold">43+</div>
              <div className="text-sm text-white/80">Foods catalog</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold">4</div>
              <div className="text-sm text-white/80">Meal types</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold">6</div>
              <div className="text-sm text-white/80">Diet preferences</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
