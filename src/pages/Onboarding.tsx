import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  AtSign,
  Camera,
  Check,
  Globe,
  Hash,
  Link2,
  MessageSquare,
  SkipForward,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveSocietyProfile } from '../services/societyService';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'welcome' | 'identity' | 'about' | 'socials' | 'done';
const WIZARD_STEPS: Step[] = ['identity', 'about', 'socials'];

interface FormData {
  description: string;
  membersCount: string;
  foundedYear: string;
  instagram: string;
  discord: string;
  facebook: string;
  linkedin: string;
  logoBlob: Blob | null;
  logoPreview: string | null;
}

// ─── Shared field components ──────────────────────────────────────────────────


function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-[var(--text)]">{label}</label>
      {children}
      {hint && <p className="text-[11.5px] text-[var(--text-light)]">{hint}</p>}
    </div>
  );
}

function IconInput({
  icon,
  prefix,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  icon: React.ReactNode;
  prefix?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] transition focus-within:border-[var(--primary)] focus-within:bg-[var(--bg)] focus-within:shadow-[0_0_0_3px_rgba(232,160,69,0.1)]">
      <div className="flex w-10 shrink-0 items-center justify-center border-r border-[var(--border)] text-[var(--text-light)]">
        {icon}
      </div>
      {prefix && (
        <span className="flex items-center pl-3 text-[13px] text-[var(--text-light)]">{prefix}</span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 border-none bg-transparent px-3 py-[10px] text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--text-light)]"
      />
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  const idx = WIZARD_STEPS.indexOf(step);
  if (idx === -1) return null;
  const pct = ((idx + 1) / WIZARD_STEPS.length) * 100;
  return (
    <div className="h-[3px] w-full bg-[var(--border)]">
      <div
        className="h-full bg-[var(--primary)] transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function WelcomeStep({ societyName, onStart, onSkip }: { societyName: string; onStart: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-subtle)] border border-[rgba(232,160,69,0.2)]">
        <Sparkles size={24} className="text-[var(--primary)]" />
      </div>

      <h1 className="mb-2 font-[var(--heading)] text-[26px] font-extrabold tracking-[-0.5px] text-[var(--text)] sm:text-[30px]">
        Welcome to Collab{societyName ? `, ${societyName}` : ''}!
      </h1>

      <p className="mb-8 max-w-[380px] text-[14px] leading-[1.7] text-[var(--text-mid)]">
        Let's take 2 minutes to set up your profile so other societies can find and connect with you.
      </p>

      <div className="mb-8 flex w-full max-w-[360px] flex-col gap-2">
        {[
          { icon: <Users size={14} />, text: 'Post listings and attract collaborators' },
          { icon: <MessageSquare size={14} />, text: 'Chat directly with matched societies' },
          { icon: <Sparkles size={14} />, text: 'Build a reputation on the platform' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-4 py-2.5 text-left">
            <span className="shrink-0 text-[var(--primary)]">{icon}</span>
            <span className="text-[13px] text-[var(--text-mid)]">{text}</span>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-[360px] flex-col gap-2.5">
        <button
          onClick={onStart}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--dark)] py-2.5 text-[14px] font-semibold text-white transition hover:-translate-y-px hover:opacity-90"
        >
          Set up my profile <ArrowRight size={15} />
        </button>
        <button
          onClick={onSkip}
          className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] py-2.5 text-[13px] font-medium text-[var(--text-light)] transition hover:border-[var(--text-light)] hover:text-[var(--text)]"
        >
          <SkipForward size={13} /> Skip for now
        </button>
      </div>
    </div>
  );
}

function IdentityStep({
  form, onChange, societyName, societyType,
}: {
  form: FormData; onChange: (p: Partial<FormData>) => void; societyName: string; societyType: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (!blob) return;
        onChange({ logoBlob: blob, logoPreview: URL.createObjectURL(blob) });
      }, 'image/jpeg', 0.85);
    };
    img.src = objectUrl;
    if (fileRef.current) fileRef.current.value = '';
  };

  const initials = societyName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

  return (
    <div className="flex flex-col gap-6 px-6 py-8 sm:px-10">
      <div>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--primary)]">Step 1 of 3</p>
        <h2 className="font-[var(--heading)] text-[22px] font-bold tracking-[-0.4px] text-[var(--text)]">Your identity</h2>
        <p className="text-[13px] text-[var(--text-light)]">Upload a logo so societies recognise you.</p>
      </div>

      {/* Logo upload */}
      <Field label="Society Logo" hint="Square image recommended. Max 5MB.">
        <div className="flex items-center gap-4">
          <div
            className="relative h-[72px] w-[72px] shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-[var(--border)] transition hover:border-[var(--primary)]"
            onClick={() => fileRef.current?.click()}
          >
            {form.logoPreview ? (
              <>
                <img src={form.logoPreview} alt="Logo" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                  <Camera size={16} className="text-white" />
                </div>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[var(--bg-light)]">
                <span className="text-[16px] font-extrabold text-[var(--text-light)]">{initials}</span>
                <Camera size={11} className="text-[var(--text-light)] opacity-60" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--text)] transition hover:border-[var(--primary)] hover:bg-[var(--primary-subtle)]"
            >
              {form.logoPreview ? 'Change logo' : 'Upload logo'}
            </button>
            {form.logoPreview && (
              <button
                type="button"
                onClick={() => onChange({ logoBlob: null, logoPreview: null })}
                className="flex items-center gap-1 text-[12px] text-[var(--text-light)] transition hover:text-red-500"
              >
                <X size={11} /> Remove
              </button>
            )}
          </div>
        </div>
      </Field>

      {/* Read-only name */}
      <Field label="Society Name" hint="Set during sign-up — contact support to change.">
        <div className="flex items-center gap-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-[10px] opacity-60">
          <Users size={15} className="shrink-0 text-[var(--text-light)]" />
          <span className="text-[14px] text-[var(--text)]">{societyName}</span>
        </div>
      </Field>

      {/* Type badge */}
      <Field label="Society Type">
        <div className="w-fit rounded-full border border-[rgba(232,160,69,0.3)] bg-[var(--primary-subtle)] px-3 py-1">
          <span className="text-[13px] font-semibold text-[var(--primary-dark)]">{societyType || '—'}</span>
        </div>
      </Field>
    </div>
  );
}

function AboutStep({ form, onChange }: { form: FormData; onChange: (p: Partial<FormData>) => void }) {
  return (
    <div className="flex flex-col gap-6 px-6 py-8 sm:px-10">
      <div>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--primary)]">Step 2 of 3</p>
        <h2 className="font-[var(--heading)] text-[22px] font-bold tracking-[-0.4px] text-[var(--text)]">About your society</h2>
        <p className="text-[13px] text-[var(--text-light)]">Help others understand who you are.</p>
      </div>

      <Field label="Description" hint="What do you do? What makes you unique?">
        <div className="relative">
          <textarea
            placeholder="We're a community of students passionate about..."
            value={form.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={4}
            maxLength={500}
            className="w-full resize-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-3 text-[14px] leading-[1.7] text-[var(--text)] outline-none transition placeholder:text-[var(--text-light)] focus:border-[var(--primary)] focus:bg-[var(--bg)] focus:shadow-[0_0_0_3px_rgba(232,160,69,0.1)]"
          />
          <span className="absolute bottom-2.5 right-3 text-[11px] text-[var(--text-light)]">
            {form.description.length}/500
          </span>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Members" hint="Approximate is fine">
          <IconInput
            icon={<Users size={14} />}
            placeholder="e.g. 120"
            value={form.membersCount}
            onChange={(v) => onChange({ membersCount: v })}
            type="number"
          />
        </Field>
        <Field label="Founded" hint="Year established">
          <IconInput
            icon={<Hash size={14} />}
            placeholder="e.g. 2019"
            value={form.foundedYear}
            onChange={(v) => onChange({ foundedYear: v })}
            type="number"
          />
        </Field>
      </div>
    </div>
  );
}

function SocialsStep({ form, onChange }: { form: FormData; onChange: (p: Partial<FormData>) => void }) {
  return (
    <div className="flex flex-col gap-6 px-6 py-8 sm:px-10">
      <div>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--primary)]">Step 3 of 3</p>
        <h2 className="font-[var(--heading)] text-[22px] font-bold tracking-[-0.4px] text-[var(--text)]">Find you online</h2>
        <p className="text-[13px] text-[var(--text-light)]">All optional — add whatever you have.</p>
      </div>

      <div className="flex flex-col gap-3.5">
        <Field label="Instagram">
          <IconInput icon={<AtSign size={14} />} prefix="@" placeholder="yourhandle" value={form.instagram} onChange={(v) => onChange({ instagram: v })} />
        </Field>
        <Field label="Discord">
          <IconInput icon={<MessageSquare size={14} />} placeholder="discord.gg/yourserver" value={form.discord} onChange={(v) => onChange({ discord: v })} />
        </Field>
        <Field label="Facebook">
          <IconInput icon={<Globe size={14} />} prefix="fb.com/" placeholder="yourpage" value={form.facebook} onChange={(v) => onChange({ facebook: v })} />
        </Field>
        <Field label="LinkedIn">
          <IconInput icon={<Link2 size={14} />} prefix="linkedin.com/company/" placeholder="your-company" value={form.linkedin} onChange={(v) => onChange({ linkedin: v })} />
        </Field>
      </div>
    </div>
  );
}

function DoneStep({ societyName, onGoToProfile }: { societyName: string; onGoToProfile: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
        <Check size={24} strokeWidth={2.5} className="text-green-500" />
      </div>
      <h2 className="mb-2 font-[var(--heading)] text-[26px] font-bold tracking-[-0.5px] text-[var(--text)]">
        You're all set!
      </h2>
      <p className="mb-8 max-w-[300px] text-[14px] leading-[1.7] text-[var(--text-mid)]">
        <span className="font-semibold text-[var(--text)]">{societyName}</span> is live on Collab. Other societies can now find and invite you.
      </p>

      <div className="mb-8 grid w-full max-w-[360px] grid-cols-3 gap-2">
        {[
          { label: 'Browse', desc: 'Explore listings', href: '/listings' },
          { label: 'Profile', desc: 'Your society page', href: '/profile' },
          { label: 'Post', desc: 'Create a listing', href: '/create-listing' },
        ].map(({ label, desc }) => (
          <div key={label} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-3 py-3 text-left">
            <p className="text-[12px] font-bold text-[var(--text)]">{label}</p>
            <p className="text-[11px] text-[var(--text-light)]">{desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onGoToProfile}
        className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--dark)] px-7 py-2.5 text-[14px] font-semibold text-white transition hover:-translate-y-px hover:opacity-90"
      >
        View my profile <ArrowRight size={15} />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const societyName = user?.user_metadata?.society_name ?? '';
  const societyType = user?.user_metadata?.society_type ?? '';

  const [step, setStep] = useState<Step>('welcome');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    description: '', membersCount: '', foundedYear: '',
    instagram: '', discord: '', facebook: '', linkedin: '',
    logoBlob: null, logoPreview: null,
  });

  const patch = (p: Partial<FormData>) => setForm((prev) => ({ ...prev, ...p }));

  const markDone = () => {
    if (user) localStorage.setItem(`collab_onboarding:${user.id}`, '1');
    onComplete();
  };

  const handleNext = async () => {
    if (step === 'welcome') { setStep('identity'); return; }
    if (step === 'identity') { setStep('about'); return; }
    if (step === 'about') { setStep('socials'); return; }
    if (step === 'socials') {
      if (!user) return;
      setSaving(true);
      try {
        await saveSocietyProfile(user.id, {
          name: societyName,
          societyType,
          description: form.description || undefined,
          membersCount: form.membersCount ? parseInt(form.membersCount) : undefined,
          foundedYear: form.foundedYear ? parseInt(form.foundedYear) : undefined,
          instagram: form.instagram ? `@${form.instagram.replace(/^@/, '')}` : undefined,
          discordUrl: form.discord || undefined,
          facebook: form.facebook ? `facebook.com/${form.facebook.replace(/^facebook\.com\//, '')}` : undefined,
          linkedin: form.linkedin ? `linkedin.com/company/${form.linkedin.replace(/^linkedin\.com\/company\//, '')}` : undefined,
        }, form.logoBlob ?? undefined);
      } catch (e) {
        console.error('Onboarding save failed:', e);
      } finally {
        setSaving(false);
      }
      setStep('done');
    }
  };

  const handleBack = () => {
    if (step === 'about') setStep('identity');
    else if (step === 'socials') setStep('about');
  };

  const isWizardStep = WIZARD_STEPS.includes(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="flex w-full max-w-[480px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow-lg)]"
        style={{ maxHeight: '90vh' }}
      >
        {/* Progress bar */}
        {isWizardStep && <ProgressBar step={step} />}

        {/* Skip button */}
        {step !== 'done' && (
          <div className="flex justify-end px-5 pt-4">
            <button
              onClick={markDone}
              className="flex items-center gap-1 text-[12px] text-[var(--text-light)] transition hover:text-[var(--text)]"
            >
              Skip <SkipForward size={12} />
            </button>
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'welcome'  && <WelcomeStep  societyName={societyName} onStart={handleNext} onSkip={markDone} />}
          {step === 'identity' && <IdentityStep form={form} onChange={patch} societyName={societyName} societyType={societyType} />}
          {step === 'about'    && <AboutStep    form={form} onChange={patch} />}
          {step === 'socials'  && <SocialsStep  form={form} onChange={patch} />}
          {step === 'done'     && <DoneStep     societyName={societyName} onGoToProfile={() => { markDone(); navigate('/profile'); }} />}
        </div>

        {/* Bottom nav */}
        {isWizardStep && (
          <div className="flex items-center justify-between border-t border-[var(--border-light)] px-6 py-4">
            <button
              onClick={handleBack}
              disabled={step === 'identity'}
              className="text-[13px] font-medium text-[var(--text-light)] transition hover:text-[var(--text)] disabled:pointer-events-none disabled:opacity-0"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={saving}
              className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--dark)] px-5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : step === 'socials' ? <><Check size={14} /> Save & finish</> : <>Continue <ArrowRight size={14} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
