import { useState, useEffect } from "react";
import { httpApi } from "../utils/http";
import {
  BadgeCheckIcon,
  ShieldIcon,
  XIcon,
  CheckIcon,
  SpinnerIcon,
  AlertTriangleIcon,
} from "./icons";

export default function VerificationRevokedModal({
  isOpen,
  onClose,
  notification = null,
  user = null,
}) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [isReapplying, setIsReapplying] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Parse admin name & reason fallback from notification message if available
  const parsedFromMessage = (() => {
    if (!notification?.message) return {};
    const msg = notification.message;
    let adminName = null;
    let reason = null;

    const byMatch = msg.match(/revoked by ([^.]+)\./i);
    if (byMatch) adminName = byMatch[1].trim();

    const reasonMatch = msg.match(/Reason:\s*(.+)$/i);
    if (reasonMatch) reason = reasonMatch[1].trim();

    return { adminName, reason };
  })();

  useEffect(() => {
    if (!isOpen) {
      setIsReapplying(false);
      setSubmitError("");
      setSubmitted(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    httpApi
      .get("/verifications/status")
      .then((res) => {
        if (!isMounted) return;
        const data = res.data || {};
        setDetails(data);
        if (data.latestRequest?.businessName) {
          setBusinessName(data.latestRequest.businessName);
        } else if (user?.name) {
          setBusinessName(user.name);
        }
      })
      .catch(() => {
        // Fallback gracefully to notification parsing
        if (isMounted && user?.name) {
          setBusinessName(user.name);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const latest = details?.latestRequest;
  const adminName =
    latest?.adminName ||
    parsedFromMessage.adminName ||
    "Platform Administrator";

  const rawNote = latest?.adminNote || parsedFromMessage.reason || "";
  const displayReason = rawNote.replace(/^Revoked:\s*/i, "").trim() || "No specific reason provided.";

  const revocationDate =
    latest?.resolvedAt ||
    notification?.timestamp ||
    "Recently";

  const isPendingNow = latest?.status === "pending" || submitted;

  const handleSubmitReapply = async (e) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setSubmitError("Please enter your business or brand name.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await httpApi.post("/verifications", {
        business_name: businessName.trim(),
        document_url: documentUrl.trim() || null,
        notes: notes.trim() || null,
      });

      setSubmitted(true);
      setIsReapplying(false);
      // Refresh status
      const res = await httpApi.get("/verifications/status");
      setDetails(res.data || {});
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to submit verification request. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revocation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-5 sm:p-6 border-b border-border bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-transparent">
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-surface/80 border border-border text-text-secondary hover:text-text-primary hover:bg-bg grid place-items-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          >
            <XIcon className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 grid place-items-center shrink-0 shadow-xs">
              <ShieldIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0 pr-6">
              <div className="flex items-center gap-2">
                <h2
                  id="revocation-modal-title"
                  className="text-lg sm:text-xl font-bold text-text-primary tracking-tight"
                >
                  Verification Revoked
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  Revoked
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Brand verification status removal details
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-text-secondary">
              <SpinnerIcon className="w-6 h-6 text-action animate-spin" />
              <p className="text-xs">Loading verification details…</p>
            </div>
          ) : (
            <>
              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-bg border border-border/80 text-xs">
                <div>
                  <span className="text-text-secondary font-medium">Revoked By:</span>
                  <p className="font-semibold text-text-primary mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    {adminName}
                  </p>
                </div>
                <div>
                  <span className="text-text-secondary font-medium">Date & Time:</span>
                  <p className="font-semibold text-text-primary mt-0.5">
                    {revocationDate}
                  </p>
                </div>
              </div>

              {/* Revocation Reason Box */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Reason for Removal
                </label>
                <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-text-primary text-xs sm:text-sm leading-relaxed">
                  <p className="font-medium text-rose-950 dark:text-rose-200">
                    "{displayReason}"
                  </p>
                </div>
              </div>

              {/* Impact Notice */}
              <div className="p-3 rounded-xl bg-surface border border-border text-xs text-text-secondary flex items-start gap-2.5">
                <AlertTriangleIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Your verified brand badge has been unassigned, and your business listings no longer carry the verified shield. You may re-apply below with updated credentials or clarifications.
                </p>
              </div>

              {/* Status / Submitted Confirmation */}
              {isPendingNow && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 grid place-items-center shrink-0 mt-0.5">
                    <CheckIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">
                      Re-verification Request Submitted
                    </h4>
                    <p className="text-text-secondary mt-0.5 text-xs leading-relaxed">
                      Your application has been placed in the admin verification queue. An administrator will review your updated business credentials shortly.
                    </p>
                  </div>
                </div>
              )}

              {/* Re-apply Form */}
              {isReapplying && !isPendingNow && (
                <form
                  onSubmit={handleSubmitReapply}
                  className="space-y-3 pt-2 border-t border-border animate-in fade-in"
                >
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                    <BadgeCheckIcon className="w-4 h-4 text-action" />
                    Request Verification Again
                  </h3>

                  {submitError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Business or Brand Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Acme Tech Solutions"
                      className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all placeholder:text-text-secondary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Supporting Document or Portfolio URL <span className="text-text-secondary font-normal">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or official business registry"
                      className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all placeholder:text-text-secondary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Clarification or Appeal Notes <span className="text-text-secondary font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Explain how the previous issue was resolved or provide additional context for the admin team…"
                      className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all placeholder:text-text-secondary/50 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setIsReapplying(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-border text-text-secondary hover:text-text-primary hover:bg-bg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-action text-white hover:bg-action-hover active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {submitting && <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />}
                      Submit Request
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-bg/50 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-border text-text-secondary hover:text-text-primary hover:bg-surface transition-all cursor-pointer"
          >
            Close
          </button>

          {!isReapplying && !isPendingNow && (
            <button
              type="button"
              onClick={() => setIsReapplying(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-action text-white hover:bg-action-hover active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <BadgeCheckIcon className="w-4 h-4" />
              Request Verification Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
