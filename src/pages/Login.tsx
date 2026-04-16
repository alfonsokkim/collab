import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-[var(--bg-light)] px-6 py-10">
      <div className="w-full max-w-[400px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-8 shadow-[var(--shadow-lg)] sm:px-10 sm:py-11">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-[var(--heading)] text-[28px] text-[var(--text)]">Login</h1>
          <p className="text-sm text-[var(--text-light)]">Sign in to your society account</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-[var(--radius)] border border-red-200 bg-red-50 px-3.5 py-[11px] text-[13px] text-red-600">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-[7px]">
            <label htmlFor="email" className="text-[13px] font-semibold text-[var(--text)]">
              Email Address
            </label>
            <div className="flex items-center gap-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-[11px] transition focus-within:border-[var(--primary)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(232,160,69,0.12)]">
              <Mail size={20} className="shrink-0 text-[var(--text-light)]" />
              <input
                type="email"
                id="email"
                placeholder="society@unsw.edu.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full border-none bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-light)] disabled:text-[var(--text-light)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[7px]">
            <label htmlFor="password" className="text-[13px] font-semibold text-[var(--text)]">
              Password
            </label>
            <div className="flex items-center gap-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-[11px] transition focus-within:border-[var(--primary)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(232,160,69,0.12)]">
              <Lock size={20} className="shrink-0 text-[var(--text-light)]" />
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full border-none bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-light)] disabled:text-[var(--text-light)]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-1 rounded-[var(--radius)] bg-[var(--dark)] px-6 py-3 text-[15px] font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--dark-surface)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-[13px] text-[var(--text-light)]">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-[var(--primary-dark)] hover:text-[var(--primary)]">
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
