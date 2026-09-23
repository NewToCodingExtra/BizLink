import { useState } from 'react';
import { Link, useForm, usePage, Head } from '@inertiajs/react';
import { useToast } from '../context/ToastContext';
import PasswordInput from '../Components/PasswordInput';

export default function ResetPassword({ email: initialEmail = '', token: initialToken = '' }) {
  const toast = useToast();
  const { flash } = usePage().props;
  const { data, setData, post, processing, errors } = useForm({
    email: initialEmail || '',
    token: initialToken || '',
    password: '',
    password_confirmation: '',
  });
  const [mismatch, setMismatch] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setMismatch('');
    if (!data.token) {
      setMismatch('Missing reset token. Open the link from your email again.');
      return;
    }
    if (data.password !== data.password_confirmation) {
      setMismatch('Passwords do not match.');
      return;
    }
    post('/reset-password', {
      onError: (errs) => {
        const first = errs ? Object.values(errs).flat()[0] : null;
        if (first) toast.error(first);
      },
    });
  };

  const firstServerError =
    errors.email || errors.password || errors.password_confirmation || errors.token;

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <Head title="Set new password" />
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-primary-light">BIZLINK · NEW PASSWORD</p>
        <h1 className="text-2xl font-bold text-primary mt-2">Set new password</h1>
        <p className="text-sm text-text-secondary mt-1">Links expire after 60 minutes.</p>

        {flash?.success && <p className="mt-4 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">{flash.success}</p>}
        {(mismatch || firstServerError) && <p className="mt-4 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{mismatch || firstServerError}</p>}
        {!data.token && <p className="mt-4 text-sm text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">No token in this URL — use the link from your email.</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input value={data.email} onChange={(e) => setData('email', e.target.value)} type="email" required placeholder="you@email.com" className="mt-1 w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
            {errors.email && <p className="mt-1 text-xs text-error">{errors.email}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary">New password</label>
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
          <button type="submit" disabled={processing} className="w-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {processing ? 'Saving...' : 'Reset password'}
          </button>
        </form>

        <p className="text-sm text-text-secondary mt-5 text-center">
          <Link href="/login" className="text-action font-medium hover:text-[#1D4ED8]">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
