import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { SOCIETY_TYPES } from '../services/societyService';

export function SignUp() {
  const [societyName, setSocietyName] = useState('');
  const [societyType, setSocietyType] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!societyType) {
      setError('Please select a society type');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, societyName, societyType);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputWrapperClass =
    'flex items-center gap-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-[11px] transition focus-within:border-[var(--primary)] focus-within:bg-[var(--bg)] focus-within:shadow-[0_0_0_3px_rgba(232,160,69,0.12)]';

  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-[var(--bg-light)] px-6 py-10">
      <div className="w-full max-w-[480px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] px-6 py-8 shadow-[var(--shadow-lg)] sm:px-10 sm:py-11">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-[var(--heading)] text-[28px] text-[var(--text)]">Create Account</h1>
          <p className="text-sm text-[var(--text-light)]">Register your society on Collab</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-[var(--radius)] border border-red-300/50 bg-red-500/10 px-3.5 py-[11px] text-[13px] text-red-500">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-[7px]">
            <label htmlFor="societyName" className="text-[13px] font-semibold text-[var(--text)]">
              Society Name
            </label>
            <div className={inputWrapperClass}>
              <Users size={20} className="shrink-0 text-[var(--text-light)]" />
              <input
                type="text"
                id="societyName"
                placeholder="e.g., No Code Society"
                value={societyName}
                onChange={(e) => setSocietyName(e.target.value)}
                disabled={loading}
                required
                className="w-full border-none bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-light)] disabled:text-[var(--text-light)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-semibold text-[var(--text)]">Society Type</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SOCIETY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={cn(
                    'rounded-[var(--radius)] border px-2 py-[9px] text-center text-[13px] font-medium transition',
                    societyType === type
                      ? 'border-[var(--primary)] bg-[var(--primary-subtle)] font-semibold text-[var(--primary-dark)]'
                      : 'border-[var(--border)] bg-[var(--bg-light)] text-[var(--text-mid)] hover:border-[var(--primary)] hover:bg-[var(--bg-light)] hover:text-[var(--text)]',
                  )}
                  onClick={() => setSocietyType(type)}
                  disabled={loading}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[7px]">
            <label htmlFor="email" className="text-[13px] font-semibold text-[var(--text)]">
              Email Address
            </label>
            <div className={inputWrapperClass}>
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
            <div className={inputWrapperClass}>
              <Lock size={20} className="shrink-0 text-[var(--text-light)]" />
              <input
                type="password"
                id="password"
                placeholder="Enter a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full border-none bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-light)] disabled:text-[var(--text-light)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[7px]">
            <label htmlFor="confirmPassword" className="text-[13px] font-semibold text-[var(--text)]">
              Confirm Password
            </label>
            <div className={inputWrapperClass}>
              <Lock size={20} className="shrink-0 text-[var(--text-light)]" />
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-[13px] text-[var(--text-light)]">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--primary-dark)] hover:text-[var(--primary)]">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
