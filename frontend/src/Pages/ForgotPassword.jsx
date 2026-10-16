import { Link, useForm, usePage, Head } from '@inertiajs/react';
import { useToast } from '../context/ToastContext';

export default function ForgotPassword() {
  const toast = useToast();
  const { flash } = usePage().props;
  const { data, setData, post, processing, errors, recentlySuccessful, setError, clearErrors } = useForm({
    email: '',
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

  const submit = (e) => {
    e.preventDefault();
    post('/forgot-password', {
      onError: (errs) => {
        const first = errs ? Object.values(errs).flat()[0] : null;
        if (first) toast.error(first);
      },
      onSuccess: () => toast.success('Reset link sent.'),
    });
  };

  const message = flash?.success;

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <Head title="Forgot password" />
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-action">BIZLINK · PASSWORD RESET</p>
        <h1 className="text-2xl font-bold text-text-primary mt-2">Forgot password</h1>
        <p className="text-sm text-text-secondary mt-1">Email accounts only — Google/Facebook accounts sign in with those buttons.</p>
        {flash?.reset_url ? (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Password Reset Link Ready</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Because mail servers may delay or block automated delivery, click the button below to set your new password immediately:
            </p>
            <Link
              href={flash.reset_url}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <span>Click Here to Reset Password &rarr;</span>
            </Link>
          </div>
        ) : (message || recentlySuccessful) ? (
          <p className="mt-4 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">{message || 'Reset link sent.'}</p>
        ) : null}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input value={data.email} onChange={(e) => setData('email', e.target.value)} onBlur={(e) => handleBlur('email', e)} type="email" required placeholder="you@email.com" className={getInputClass('email')} />
          </div>
          <button type="submit" disabled={processing} className="w-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {processing ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-sm text-text-secondary mt-5 text-center">
          Remembered it? <Link href="/login" className="text-action font-medium hover:text-[#1D4ED8]">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
