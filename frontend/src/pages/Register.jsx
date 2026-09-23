import { Link, useForm, Head } from '@inertiajs/react';
import { useToast } from '../context/ToastContext';
import PasswordInput from '../Components/PasswordInput';
import { FacebookIcon, GoogleIcon } from '../Components/SocialIcons';

export default function Register() {
  const toast = useToast();
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'entrepreneur',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.name.trim() || !data.email.trim() || !data.password) {
      toast.error('All fields required');
      return;
    }
    if (data.password !== data.password_confirmation) {
      toast.error('Passwords do not match.');
      return;
    }
    // Server registers and redirects; no client navigation.
    post('/register', {
      onError: (errs) => {
        const first = errs ? Object.values(errs).flat()[0] : null;
        if (first) toast.error(first);
      },
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <Head title="Register" />
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-primary-light">BIZLINK · REGISTER</p>
        <h1 className="text-2xl font-bold text-primary mt-2">Create account</h1>
        <p className="text-sm text-text-secondary mt-1">Join the BizLink community.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <a href="/auth/google/redirect" className="bg-surface border border-border hover:bg-bg text-text-primary text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            <GoogleIcon size={20} />
            Google
          </a>
          <a href="/auth/facebook/redirect" className="bg-[#1877F2] hover:bg-[#1464CC] text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            <FacebookIcon size={20} />
            Facebook
          </a>
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-bg" />
          <span className="text-xs text-text-secondary">or with email</span>
          <div className="flex-1 h-px bg-bg" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary">Full name</label>
            <input value={data.name} onChange={(e) => setData('name', e.target.value)} required placeholder="Juan Dela Cruz" className="mt-1 w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
            {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input value={data.email} onChange={(e) => setData('email', e.target.value)} type="email" required placeholder="you@email.com" className="mt-1 w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
            {errors.email && <p className="mt-1 text-xs text-error">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-text-primary">Password</label>
              <div className="mt-1">
                <PasswordInput value={data.password} onChange={(e) => setData('password', e.target.value)} minLength={8} placeholder="Min 8 chars" autoComplete="new-password" />
              </div>
              {errors.password && <p className="mt-1 text-xs text-error">{errors.password}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary">Confirm</label>
              <div className="mt-1">
                <PasswordInput value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} placeholder="Repeat" autoComplete="new-password" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary">I am a</label>
            <div className="mt-2 flex gap-2">
              {['entrepreneur', 'brand'].map((r) => (
                <button key={r} type="button" onClick={() => setData('role', r)} className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${data.role === r ? 'bg-primary text-white border-[#0B1F3A]' : 'bg-surface text-text-secondary border-border hover:bg-bg'}`}>
                  {r}
                </button>
              ))}
            </div>
            {errors.role && <p className="mt-1 text-xs text-error">{errors.role}</p>}
          </div>
          <div className="text-[11px] text-text-secondary leading-tight pt-2">
            By creating an account, you agree to our <Link href="/terms" className="text-action hover:underline">Terms of Service</Link> and acknowledge our <Link href="/privacy" className="text-action hover:underline">Privacy Policy</Link>.
          </div>
          <button type="submit" disabled={processing} className="w-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors mt-2">
            {processing ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-text-secondary mt-5 text-center">
          Have an account? <Link href="/login" className="text-action font-medium hover:text-[#1D4ED8]">Log in</Link>
        </p>
      </div>
    </div>
  );
}
