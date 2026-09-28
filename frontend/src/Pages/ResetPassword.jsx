import { useState } from 'react';
import { Link, useForm, usePage, Head } from '@inertiajs/react';
import { useToast } from '../context/ToastContext';
import PasswordInput from '../Components/PasswordInput';

export default function ResetPassword({ email: initialEmail = '', token: initialToken = '' }) {
  const toast = useToast();
  const { flash } = usePage().props;
  const { data, setData, post, processing, errors, setError, clearErrors } = useForm({
    email: initialEmail || '',
    token: initialToken || '',
    password: '',
    password_confirmation: '',
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
  const [mismatch, setMismatch] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!data.token) {
      toast.error('Missing reset token. Open the link from your email again.');
      return;
    }
    if (data.password !== data.password_confirmation) {
      toast.error('Passwords do not match.');
      return;
    }
    post('/reset-password', {
      onError: (errs) => {
        const first = errs ? Object.values(errs).flat()[0] : null;
        if (first) toast.error(first);
      },
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <Head title="Set new password" />
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-action">BIZLINK · NEW PASSWORD</p>
        <h1 className="text-2xl font-bold text-text-primary mt-2">Set new password</h1>
        <p className="text-sm text-text-secondary mt-1">Links expire after 60 minutes.</p>

        {flash?.success && <p className="mt-4 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">{flash.success}</p>}
        {!data.token && <p className="mt-4 text-sm text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">No token in this URL — use the link from your email.</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input value={data.email} onChange={(e) => setData('email', e.target.value)} onBlur={(e) => handleBlur('email', e)} type="email" required placeholder="you@email.com" className={getInputClass('email')} />
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary">New password</label>
            <div className="mt-1">
              <PasswordInput value={data.password} onChange={(e) => setData('password', e.target.value)} onBlur={(e) => handleBlur('password', e)} error={!!errors.password} minLength={8} placeholder="Min 8 chars" autoComplete="new-password" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary">Confirm</label>
            <div className="mt-1">
              <PasswordInput value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} onBlur={(e) => handleBlur('password_confirmation', e)} error={!!errors.password_confirmation} placeholder="Repeat" autoComplete="new-password" />
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
