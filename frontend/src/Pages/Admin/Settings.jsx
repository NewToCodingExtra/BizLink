import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { hasRole } from "../../utils/can";
import { httpApi } from "../../utils/http";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import AdminHeader from "../../components/Admin/AdminHeader";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import {
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
  CheckIcon,
  PlusIcon,
  AlertTriangleIcon,
} from "../../components/icons";

export default function AdminSettings({
  settings = {},
  admins = [],
  systemInfo = {},
}) {
  const page = usePage();
  const toast = useToast();
  const confirm = useConfirm();
  const isAdmin = hasRole(page, "Admin");

  const [activeSubTab, setActiveSubTab] = useState("throttles"); // throttles, admins, system

  // Throttles form
  const [form, setForm] = useState({
    login_rate_limit: settings.login_rate_limit ?? 5,
    report_throttle_per_min: settings.report_throttle_per_min ?? 5,
    comment_throttle_per_min: settings.comment_throttle_per_min ?? 10,
    inquiry_throttle_per_day: settings.inquiry_throttle_per_day ?? 20,
    demo_login_enabled: !!settings.demo_login_enabled,
    registration_open: !!settings.registration_open,
    maintenance_mode: !!settings.maintenance_mode,
  });
  const [saving, setSaving] = useState(false);

  // Invite Admin modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await httpApi.post("/admin/settings", form);
      toast.success("Platform settings saved successfully.");
      router.reload({ only: ["settings"] });
    } catch (err) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteAdmin = async (e) => {
    e?.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please enter a user email.");
      return;
    }
    setInviting(true);
    try {
      await httpApi.post("/admin/settings/admins/invite", { email: inviteEmail.trim() });
      toast.success(`Admin role granted to ${inviteEmail}.`);
      setInviteOpen(false);
      setInviteEmail("");
      router.reload({ only: ["admins"] });
    } catch (err) {
      toast.error(err.message || "Could not grant admin role.");
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeAdmin = async (adminUser) => {
    const ok = await confirm({
      title: "Revoke Admin Privileges?",
      message: `Are you sure you want to revoke administrator privileges from ${adminUser.name}? They will no longer have access to the Admin portal.`,
      confirmText: "Revoke Privileges",
      variant: "danger",
    });
    if (!ok) {
      return;
    }
    try {
      await httpApi.post(`/admin/settings/admins/${adminUser.id}/revoke`, {});
      toast.success(`Admin privileges revoked for ${adminUser.name}.`);
      router.reload({ only: ["admins"] });
    } catch (err) {
      toast.error(err.message || "Could not revoke admin access.");
    }
  };

  if (!isAdmin) {
    return null;
  }

  const subTabs = [
    { id: "throttles", label: "Server & Throttles", icon: SettingsIcon },
    { id: "admins", label: "Administrator Team", icon: ShieldIcon },
    { id: "system", label: "System Health & Specs", icon: CheckIcon },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 overflow-x-clip">
      <Head title="Console Settings — Admin Console" />

      {/* Admin Navigation Header */}
      <AdminHeader
        title="Console Settings"
        subtitle="Platform policies, rate limits, administrator team & infrastructure"
        activeTab="settings"
      />

      {/* Sub Tabs Bar */}
      <div className="flex items-center gap-1.5 mb-6 p-1.5 rounded-2xl bg-surface border border-border/80 shadow-xs overflow-x-auto no-scrollbar">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                isActive
                  ? "bg-action text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: SERVER & THROTTLES */}
      {activeSubTab === "throttles" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <section className="p-5 rounded-2xl bg-surface border border-border/80 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-text-primary tracking-tight">
                Rate Limiting &amp; Security Throttles
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Protect application endpoints against credential stuffing and brute force abuse.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                  Login Lockout Threshold (attempts)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.login_rate_limit}
                  onChange={(e) => setForm({ ...form, login_rate_limit: Number(e.target.value) })}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
                />
                <span className="text-[11px] text-text-secondary mt-1 block">
                  Failed logins within 15 mins before account is marked &ldquo;Locked&rdquo;.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                  Reports Rate Limit (per minute)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={form.report_throttle_per_min}
                  onChange={(e) =>
                    setForm({ ...form, report_throttle_per_min: Number(e.target.value) })
                  }
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
                />
                <span className="text-[11px] text-text-secondary mt-1 block">
                  Max moderation reports an account can file per minute.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                  Comment Throttle (per minute)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={form.comment_throttle_per_min}
                  onChange={(e) =>
                    setForm({ ...form, comment_throttle_per_min: Number(e.target.value) })
                  }
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
                />
                <span className="text-[11px] text-text-secondary mt-1 block">
                  Max comments allowed per user per minute.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                  Inquiry Conversations (per day)
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={form.inquiry_throttle_per_day}
                  onChange={(e) =>
                    setForm({ ...form, inquiry_throttle_per_day: Number(e.target.value) })
                  }
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
                />
                <span className="text-[11px] text-text-secondary mt-1 block">
                  Max new chats an entrepreneur can open with brands daily.
                </span>
              </div>
            </div>
          </section>

          {/* Feature Flags */}
          <section className="p-5 rounded-2xl bg-surface border border-border/80 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-text-primary tracking-tight">
                Global Feature Toggles
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Runtime configuration switches.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border cursor-pointer">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-text-primary">
                    Public Registration Open
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    Allow new entrepreneurs and brands to create accounts on the site.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.registration_open}
                  onChange={(e) => setForm({ ...form, registration_open: e.target.checked })}
                  className="w-5 h-5 rounded text-action accent-action cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border cursor-pointer">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-text-primary">
                    One-Click Demo Sign-in Enabled
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    Permit quick testing using seeded demo accounts on login page.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.demo_login_enabled}
                  onChange={(e) => setForm({ ...form, demo_login_enabled: e.target.checked })}
                  className="w-5 h-5 rounded text-action accent-action cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 cursor-pointer">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400">
                    Platform Maintenance Mode
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    Temporarily shows a maintenance banner to non-admin visitors.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.maintenance_mode}
                  onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked })}
                  className="w-5 h-5 rounded text-rose-600 accent-rose-600 cursor-pointer"
                />
              </label>
            </div>
          </section>

          <div className="flex justify-end">
            <Button variant="primary" size="md" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Platform Settings"}
            </Button>
          </div>
        </form>
      )}

      {/* SUBTAB 2: ADMINISTRATOR TEAM */}
      {activeSubTab === "admins" && (
        <section className="rounded-2xl bg-surface border border-border/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-text-primary tracking-tight">
                Platform Administrators
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Staff accounts with full elevated access across all console modules.
              </p>
            </div>
            <button
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-action text-white text-xs font-semibold hover:bg-action-hover active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Grant Admin</span>
            </button>
          </div>

          <div className="divide-y divide-border/60">
            {admins.map((adm) => (
              <div
                key={adm.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-bg/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={adm.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-border shadow-xs"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-text-primary truncate">
                        {adm.name}
                      </p>
                      {adm.isSelf && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-action/10 text-action border border-action/25">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary truncate">
                      @{adm.username} · {adm.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-text-secondary tabular-nums hidden sm:inline">
                    Added {adm.createdAt}
                  </span>
                  {!adm.isSelf && (
                    <button
                      onClick={() => handleRevokeAdmin(adm)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-bg text-text-secondary border border-border hover:text-rose-600 hover:border-rose-500/30 active:scale-95 transition-all cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SUBTAB 3: SYSTEM HEALTH */}
      {activeSubTab === "system" && (
        <section className="p-5 rounded-2xl bg-surface border border-border/80 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              Environment &amp; Infrastructure
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Live server runtime telemetry and versions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-bg border border-border">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                PHP Engine
              </span>
              <p className="text-sm font-mono font-bold text-text-primary">
                v{systemInfo.phpVersion}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-bg border border-border">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                Laravel Framework
              </span>
              <p className="text-sm font-mono font-bold text-text-primary">
                v{systemInfo.laravelVersion}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-bg border border-border">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                Database Engine
              </span>
              <p className="text-sm font-mono font-bold text-text-primary">
                {systemInfo.database}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-bg border border-border">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                Environment
              </span>
              <p className="text-sm font-mono font-bold text-action uppercase">
                {systemInfo.environment}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-bg border border-border">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                Server Clock
              </span>
              <p className="text-xs font-mono font-bold text-text-primary">
                {systemInfo.time}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-bg border border-border">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                Audit Logs
              </span>
              <a
                href="/admin/export/audit-logs"
                download
                className="text-xs font-bold text-action hover:underline inline-flex items-center gap-1"
              >
                Download Audit Stream CSV
              </a>
            </div>
          </div>
        </section>
      )}

      {/* GRANT ADMIN MODAL */}
      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Grant Admin Role">
        <form onSubmit={handleInviteAdmin} className="space-y-4">
          <p className="text-xs text-text-secondary">
            Promote an existing user to Administrator. They will receive full permissions to manage users, moderation reports, brand verification requests, and platform settings.
          </p>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              User Email Address
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={inviting}>
              {inviting ? "Granting..." : "Grant Admin Access"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
