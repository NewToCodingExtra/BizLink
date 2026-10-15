import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import Button from "../../components/Button";
import { useToast } from "../../context/ToastContext";

const ROLES = [
  {
    value: "entrepreneur",
    label: "Entrepreneur",
    blurb: "Discover opportunities, inquire, post & join the marketplace",
  },
  {
    value: "brand",
    label: "Brand",
    blurb: "List franchises, wholesale & resell offers, meet clients",
  },
];

/**
 * First-run account-type picker. Rendered ONLY for brand-new social accounts
 * (backend gates on the pending_role_setup session flag) — existing users
 * never land here.
 */
export default function WelcomeRole({ provider = "social", name = "" }) {
  const toast = useToast();
  const [role, setRole] = useState("entrepreneur");
  const [saving, setSaving] = useState(false);

  const label = provider === "facebook" ? "Facebook" : provider === "google" ? "Google" : "social sign-in";

  const submit = () => {
    setSaving(true);
    router.post("/welcome/role", { role }, {
      onError: (errs) => {
        const first = errs ? Object.values(errs).flat()[0] : null;
        toast.error(first || "Could not save your account type.");
      },
      onFinish: () => setSaving(false),
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <Head title="Choose your account type" />
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-text-secondary">BIZLINK · WELCOME{name ? ` · HI ${String(name).toUpperCase()}` : ""}</p>
        <h1 className="text-2xl font-bold text-text-primary mt-2">Continue with {label === "social sign-in" ? "social sign-in" : label}</h1>
        <p className="text-sm text-text-secondary mt-1">Choose your account type first — this sets your role and what you can post.</p>

        <div className="mt-5 grid gap-2" role="radiogroup" aria-label="Account type">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={role === r.value}
              onClick={() => setRole(r.value)}
              className={`text-left rounded-xl border px-4 py-3 min-h-[56px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action ${
                role === r.value ? "border-action/50 bg-action/5" : "border-border hover:bg-bg"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border-2 grid place-items-center shrink-0 ${role === r.value ? "border-action" : "border-border"}`}>
                  {role === r.value && <span className="w-2 h-2 rounded-full bg-action" />}
                </span>
                <span className="text-sm font-semibold text-text-primary">{r.label}</span>
              </span>
              <span className="block text-xs text-text-secondary mt-1 ml-6">{r.blurb}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => router.post("/logout")}>Cancel</Button>
          <Button variant="accent" disabled={saving} onClick={submit}>
            {saving ? "Saving…" : `Continue as ${role === "brand" ? "Brand" : "Entrepreneur"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
