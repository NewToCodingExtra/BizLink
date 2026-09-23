import { Link, useForm, Head } from '@inertiajs/react';
import { useToast } from '../context/ToastContext';
import PasswordInput from '../Components/PasswordInput';
import { FacebookIcon, GoogleIcon } from '../Components/SocialIcons';

export default function Login() {
  const toast = useToast();
  const { data, setData, post, processing, errors, setError, clearErrors } = useForm({
    email: 'demo@bizlink.ph',
    password: '',
  });

  const handleBlur = (field, e) => {
    if (!e.target.checkValidity()) {
      setError(field, true);
      toast.error(e.target.validationMessage);
    } else {
      clearErrors(field);
    }
  };

  const getInputClass = (field) => {
    const base = "mt-1 w-full border outline-none rounded-lg px-3 py-2.5 text-sm transition-colors";
    return errors[field] 
      ? `${base} border-error focus:border-error focus:ring-2 focus:ring-error/20 bg-error/5` 
      : `${base} border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 bg-transparent`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.email.trim() || !data.password) {
      toast.error('Please fill in both fields');
      return;
    }
    // Server authenticates and redirects (respects `intended`); no client navigation.
    post('/login', {
      onError: (errs) => {
        const first = errs ? Object.values(errs).flat()[0] : null;
        if (first) toast.error(first);
      },
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <Head title="Login" />
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-text-secondary">BIZLINK · LOGIN</p>
        <h1 className="text-2xl font-bold text-text-primary mt-2">Welcome back</h1>
        <p className="text-sm text-text-secondary mt-1">Session is issued by Laravel Sanctum and stored in MySQL.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input value={data.email} onChange={(e) => setData('email', e.target.value)} onBlur={(e) => handleBlur('email', e)} type="email" required placeholder="you@email.com" className={getInputClass('email')} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">Password</label>
              <Link href="/forgot-password" className="text-xs font-medium text-[var(--color-action)] hover:text-[var(--color-action-hover)]">Forgot password?</Link>
            </div>
            <div className="mt-1">
              <PasswordInput value={data.password} onChange={(e) => setData('password', e.target.value)} onBlur={(e) => handleBlur('password', e)} error={!!errors.password} />
            </div>
          </div>
          <button type="submit" disabled={processing} className="w-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {processing ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-bg" />
          <span className="text-xs text-text-secondary">or continue with</span>
          <div className="flex-1 h-px bg-bg" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a href="/auth/google/redirect" className="bg-surface border border-border hover:bg-bg text-text-primary text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            <GoogleIcon size={20} />
            Google
          </a>
          <a href="/auth/facebook/redirect" className="bg-[#1877F2] hover:bg-[#1464CC] text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            <FacebookIcon size={20} />
            Facebook
          </a>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)] mt-5 text-center">
          No account? <Link href="/register" className="text-[var(--color-action)] font-medium hover:text-[var(--color-action-hover)]">Register</Link>
        </p>
      </div>
    </div>
  );
}
