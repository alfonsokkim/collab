import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, Lock, Mail, ShieldCheck, Users, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { SOCIETY_TYPES, UNIVERSITIES, saveSocietyProfile } from '../services/societyService';
import {
  runVerificationPipeline,
  findRegistryMatch,
  computeTrustScore,
  resolveApprovalStatus,
  type VerificationResult,
} from '../services/verificationService';

type Step = 'form' | 'verifying' | 'result' | 'blocked' | 'confirm';

export function SignUp() {
  const [societyName, setSocietyName] = useState('');
  const [societyType, setSocietyType] = useState('');
  const [university, setUniversity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [preCheckScore, setPreCheckScore] = useState<number>(0);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!societyType) {
      setError('Please select a society type');
      return;
    }

    if (!university) {
      setError('Please select your university');
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
    setStep('verifying');

    try {
      // Pre-check trust score before creating the account
      const registryMatch = await findRegistryMatch(societyName);
      const { score } = computeTrustScore({ email, societyName, societyType, registryMatch });
      const status = resolveApprovalStatus(score);

      if (status === 'unverified') {
        setPreCheckScore(score);
        setStep('blocked');
        setLoading(false);
        return;
      }

      await signUp(email, password, societyName, societyType, university);
      setStep('confirm');
    } catch (err: any) {
      setStep('form');
      const msg: string = err.message ?? '';
      if (msg.toLowerCase().includes('user already registered') || msg.toLowerCase().includes('already been registered')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (msg.toLowerCase().includes('invalid email')) {
        setError('Please enter a valid email address.');
      } else if (msg.toLowerCase().includes('password')) {
        setError('Password must be at least 6 characters.');
      } else {
        setError(msg || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputWrapperClass =
    'flex items-center gap-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-[11px] transition focus-within:border-[var(--primary)] focus-within:bg-[var(--bg)] focus-within:shadow-[0_0_0_3px_rgba(232,160,69,0.12)]';

  if (step === 'verifying') {
    return (
      <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-[var(--bg-light)] px-6 py-10">
        <div className="w-full max-w-[400px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] px-6 py-12 shadow-[var(--shadow-lg)] text-center">
          <div className="mb-5 flex justify-center">
            <div className="h-14 w-14 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center animate-pulse">
              <ShieldCheck size={28} className="text-[var(--primary-dark)]" />
            </div>
          </div>
          <h2 className="mb-2 font-[var(--heading)] text-[22px] text-[var(--text)]">Verifying your society</h2>
          <p className="text-sm text-[var(--text-light)]">We're checking our society registry…</p>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-[var(--bg-light)] px-6 py-10">
        <div className="w-full max-w-[420px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] px-6 py-12 shadow-[var(--shadow-lg)] text-center">
          <div className="mb-5 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-subtle)]">
              <Mail size={26} className="text-[var(--primary-dark)]" />
            </div>
          </div>
          <h2 className="mb-2 font-[var(--heading)] text-[22px] text-[var(--text)]">Check your email</h2>
          <p className="text-sm text-[var(--text-light)]">
            We sent a confirmation link to <span className="font-semibold text-[var(--text)]">{email}</span>.
            Click it to activate your account — your society profile will be set up automatically.
          </p>
          <p className="mt-4 text-[12px] text-[var(--text-light)]">You can close this tab.</p>
        </div>
      </div>
    );
  }

  if (step === 'blocked') {
    return (
      <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-[var(--bg-light)] px-6 py-10">
        <div className="w-full max-w-[480px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] px-6 py-8 shadow-[var(--shadow-lg)] sm:px-10 sm:py-10">
          <div className="mb-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                <ShieldCheck size={28} className="text-red-500" />
              </div>
            </div>
            <h2 className="mb-2 font-[var(--heading)] text-[24px] text-[var(--text)]">Society Not Recognised</h2>
            <p className="text-sm text-[var(--text-light)]">
              We couldn't verify <span className="font-semibold text-[var(--text)]">{societyName}</span> against our UNSW society registry. Your trust score was too low to create an account automatically.
            </p>
          </div>

          <div className="mb-5 rounded-[var(--radius)] border border-red-300/40 bg-red-500/8 px-4 py-3.5 text-[13px] leading-[1.65] text-[var(--text-mid)]">
            <p className="mb-1 font-bold text-[var(--text)]">Trust score: {preCheckScore}/100</p>
            <p>This may be because your society name doesn't closely match our registry, or you're not using a UNSW email address.</p>
          </div>

          <div className="mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-4 py-4 text-[13.5px] leading-[1.7] text-[var(--text-mid)]">
            <p className="mb-2 font-bold text-[var(--text)]">To get access, email us at:</p>
            <a
              href="mailto:verify@collabapp.unsw.edu.au"
              className="mb-3 block font-mono text-[14px] font-semibold text-[var(--primary-dark)] hover:underline"
            >
              verify@collabapp.unsw.edu.au
            </a>
            <p className="mb-1.5 font-semibold text-[var(--text)]">Include in your email:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Your society's full name</li>
              <li>A screenshot of your society's Arc page or rubric listing</li>
              <li>The email address you want to register with</li>
            </ul>
            <p className="mt-3 text-[12.5px] text-[var(--text-light)]">We'll manually create your account and get back to you within 1–2 business days.</p>
          </div>

          <button
            onClick={() => { setStep('form'); setError(''); }}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-6 py-3 text-[15px] font-semibold text-[var(--text-mid)] transition hover:text-[var(--text)]"
          >
            Back to Sign Up
          </button>
        </div>
      </div>
    );
  }

  if (step === 'result' && verification) {
    const statusConfig = {
      verified: {
        icon: <CheckCircle2 size={30} className="text-green-500" />,
        bg: 'bg-green-500/10 border-green-300/50',
        title: 'Society Verified!',
        message: 'Your society was automatically verified. You can now sign in and set up your profile.',
        cta: 'Continue to Login',
        ctaAction: () => navigate('/login'),
      },
      pending: {
        icon: <Clock size={30} className="text-yellow-500" />,
        bg: 'bg-yellow-500/10 border-yellow-300/50',
        title: 'Verification Pending',
        message: 'Your account is created. Our team will review your society within 1–2 business days.',
        cta: 'Continue to Login',
        ctaAction: () => navigate('/login'),
      },
      unverified: {
        icon: <XCircle size={30} className="text-[var(--text-light)]" />,
        bg: 'bg-[var(--bg-light)] border-[var(--border)]',
        title: 'Account Created',
        message: 'Your account has been created but could not be verified automatically. You can still sign in with limited access.',
        cta: 'Continue to Login',
        ctaAction: () => navigate('/login'),
      },
      rejected: {
        icon: <XCircle size={30} className="text-red-500" />,
        bg: 'bg-red-500/10 border-red-300/50',
        title: 'Verification Rejected',
        message: 'We could not verify this society. Please contact support if you believe this is an error.',
        cta: 'Back to Signup',
        ctaAction: () => setStep('form'),
      },
    }[verification.status];

    return (
      <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-[var(--bg-light)] px-6 py-10">
        <div className="w-full max-w-[440px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] px-6 py-8 shadow-[var(--shadow-lg)] sm:px-10 sm:py-10">
          <div className="mb-6 text-center">
            <div className="mb-4 flex justify-center">{statusConfig.icon}</div>
            <h2 className="mb-2 font-[var(--heading)] text-[24px] text-[var(--text)]">{statusConfig.title}</h2>
            <p className="text-sm text-[var(--text-light)]">{statusConfig.message}</p>
          </div>

          <div className={cn('mb-6 rounded-[var(--radius)] border px-4 py-3 text-[13px]', statusConfig.bg)}>
            <div className="mb-1.5 font-semibold text-[var(--text)]">Trust Score: {verification.trustScore}/100</div>
            <ul className="space-y-0.5 text-[var(--text-light)]">
              {verification.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {verification.matchedRegistry && (
            <div className="mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-4 py-3 text-[13px]">
              <div className="font-semibold text-[var(--text)] mb-0.5">Matched Registry Entry</div>
              <div className="text-[var(--text-light)]">{verification.matchedRegistry.name} · {verification.matchedRegistry.type}</div>
            </div>
          )}

          <button
            onClick={statusConfig.ctaAction}
            className="w-full rounded-[var(--radius)] bg-[var(--dark)] px-6 py-3 text-[15px] font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--dark-surface)]"
          >
            {statusConfig.cta}
          </button>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center justify-between">
              <label htmlFor="societyName" className="text-[13px] font-semibold text-[var(--text)]">
                Society Name
              </label>
              <span className={cn('text-[11px]', societyName.length > 50 ? 'text-red-500' : 'text-[var(--text-light)]')}>
                {societyName.length}/50
              </span>
            </div>
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
                maxLength={50}
                className="w-full border-none bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-light)] disabled:text-[var(--text-light)]"
              />
            </div>
            <p className="text-[12px] text-[var(--text-light)]">
              Try to match your society's name on the{' '}
              <a href="https://www.arc.unsw.edu.au/clubs" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[var(--text)]">
                Arc rubric
              </a>
              {' '}as closely as possible — this helps us verify your society faster.
            </p>
          </div>

          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-semibold text-[var(--text)]">University</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {UNIVERSITIES.map(({ id, label }) => {
                const isUNSW = id === 'UNSW';
                const selected = university === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={cn(
                      'relative rounded-[var(--radius)] border px-2 py-[9px] text-center text-[13px] font-medium transition',
                      isUNSW && selected
                        ? 'border-yellow-400 bg-yellow-400/10 font-semibold text-yellow-600 shadow-[0_0_0_2px_rgba(250,204,21,0.3)] dark:text-yellow-400'
                        : isUNSW && !selected
                          ? 'border-yellow-400/50 bg-yellow-400/5 text-[var(--text-mid)] hover:border-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-400'
                          : selected
                            ? 'border-[var(--primary)] bg-[var(--primary-subtle)] font-semibold text-[var(--primary-dark)]'
                            : 'border-[var(--border)] bg-[var(--bg-light)] text-[var(--text-mid)] hover:border-[var(--primary)] hover:text-[var(--text)]',
                    )}
                    onClick={() => setUniversity(id)}
                    disabled={loading}
                  >
                    {isUNSW && (
                      <span className="absolute -right-1.5 -top-2.5 inline-block" style={{ transform: 'rotate(15deg)', fontSize: '14px', lineHeight: 1 }}>
                        👑
                      </span>
                    )}
                    {id}
                    <span className="block text-[10px] font-normal opacity-60">{label.replace(/^(University of |UNSW )/, '')}</span>
                  </button>
                );
              })}
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
