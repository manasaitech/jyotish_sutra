import React, { useState } from 'react';
import { 
  loginWithGoogle, 
  signInWithEmailAndPassword, 
  auth 
} from '../auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-indigo/10 rounded-full filter blur-3xl opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-md bg-bg-secondary border border-border-primary rounded-card p-8 shadow-card relative z-10 animate-fade-in backdrop-blur-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent-indigo/10 border border-accent-indigo/25 text-accent-indigo rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-rounded text-2xl font-bold">auto_awesome</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">AstroSutra AI</h2>
          <p className="text-xs text-text-secondary mt-1">Admin Analytics Portal</p>
        </div>

        {error && (
          <div className="bg-accent-rose/10 border border-accent-rose/25 text-accent-rose text-xs p-3 rounded-lg mb-5 flex items-center gap-2">
            <span className="material-symbols-rounded text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@astrosutra.ai"
              className="w-full bg-bg-input border border-border-primary focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo text-sm rounded-btn px-4 py-2.5 outline-none transition-all placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-bg-input border border-border-primary focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo text-sm rounded-btn px-4 py-2.5 outline-none transition-all placeholder:text-text-muted"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-indigo hover:bg-accent-indigo-light disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-btn shadow-glow transition-all mt-6 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In with Password'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-border-primary"></div>
          <span className="text-[10px] text-text-muted px-3 uppercase tracking-wider">or</span>
          <div className="flex-1 border-t border-border-primary"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-bg-input hover:bg-bg-card-hover border border-border-primary text-text-primary text-sm font-semibold py-2.5 rounded-btn transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-rounded text-lg text-text-accent">login</span>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}
