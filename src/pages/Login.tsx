import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export function Login() {
  const { user, signIn, signInEmail, signUpEmail, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);

    try {
      if (isSignUp) {
        await signUpEmail(email, password);
      } else {
        await signInEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent-gold/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent-blue/5 blur-[120px] rounded-full"></div>
      <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-accent-green/5 blur-[100px] rounded-full"></div>
      
      <div className="w-full max-w-md bg-white/40 border border-white/60 p-8 md:p-10 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] relative z-10 backdrop-blur-xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="text-accent-gold text-5xl font-mono mb-4 animate-in fade-in zoom-in duration-1000 drop-shadow-sm">⟡</div>
          <h1 className="text-3xl font-sans font-bold tracking-tighter text-text-primary mb-2">TRADING ALPHA</h1>
          <p className="text-sm text-text-secondary font-sans leading-relaxed">High-fidelity execution metrics for the modern professional trader.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <p className="text-[11px] font-bold font-mono leading-tight">{error.toUpperCase()}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted font-mono uppercase tracking-widest px-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                className="w-full pl-11 pr-4 py-3 bg-white/60 border border-border-subtle rounded-xl text-sm outline-none focus:border-accent-gold transition-all font-sans"
                placeholder="trader@alpha.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted font-mono uppercase tracking-widest px-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                disabled={authLoading}
                className="w-full pl-11 pr-4 py-3 bg-white/60 border border-border-subtle rounded-xl text-sm outline-none focus:border-accent-gold transition-all font-sans"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-text-primary text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-text-primary/10 transition-all hover:bg-black hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest mt-2"
          >
            {authLoading ? 'Authenticating...' : (isSignUp ? 'Initialize Profile' : 'Authenticate Access')}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-subtle"></div>
          </div>
          <div className="relative flex justify-center text-xs font-mono">
            <span className="px-4 bg-white/40 backdrop-blur-sm text-text-muted font-bold">OR</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signIn()}
          disabled={authLoading}
          className="w-full bg-white border border-border-subtle text-text-primary font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-bg-secondary hover:border-border-active active:scale-[0.98] disabled:opacity-50 text-[11px] uppercase tracking-wider"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] font-bold font-mono text-accent-blue uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Create Profile'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 pt-8">
          <div className="badge-live border-none p-0 !bg-transparent scale-75">
            <span className="dot-pulse"></span>
            <span className="text-[10px] text-text-muted">SYSTEM: READY</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center relative z-10">
        <p className="label-mono opacity-50 text-[9px]">v1.3.0-stable | engine: secure-auth</p>
      </div>
    </div>
  );
}
