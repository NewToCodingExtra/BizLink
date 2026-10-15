import { useState } from "react";
import { VideoIcon, CalendarIcon } from "./icons";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";

export default function MeetingCard({
  message,
  conversationId,
  isMe = false,
  onCancelled,
  onUpdated,
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [cancelling, setCancelling] = useState(false);
  const [ending, setEnding] = useState(false);
  const [editingLink, setEditingLink] = useState(false);
  const [newUrl, setNewUrl] = useState(message.meetUrl || "");
  const [savingLink, setSavingLink] = useState(false);

  const title = message.meetTitle || "Consultation Meeting";
  const meetUrl = message.meetUrl;
  const status = message.meetStatus || "scheduled";
  const eventId = message.meetEventId;
  const startAt = message.meetStartAt ? new Date(message.meetStartAt) : null;
  const endAt = message.meetEndAt ? new Date(message.meetEndAt) : null;

  // Automatically treat as ended if the scheduled meeting duration has passed
  const isTimePassed = endAt
    ? new Date() > endAt
    : startAt
    ? new Date() > new Date(startAt.getTime() + 60 * 60000)
    : false;
  const effectiveStatus = status === "scheduled" && isTimePassed ? "ended" : status;

  const formatMeetingTime = () => {
    if (!startAt) return "Time not set";
    const dateStr = startAt.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timeStr = startAt.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    let durStr = "";
    if (endAt) {
      const diffMins = Math.round((endAt - startAt) / 60000);
      if (diffMins > 0) durStr = ` (${diffMins} min)`;
    }
    return `${dateStr} · ${timeStr}${durStr}`;
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: "Cancel meeting?",
      message: "Are you sure you want to cancel this scheduled meeting?",
      confirmText: "Cancel Meeting",
      variant: "danger",
    });
    if (!ok) return;
    setCancelling(true);
    try {
      const res = await httpApi.delete(`/conversations/${conversationId}/meet/${eventId}`);
      toast.success("Meeting cancelled");
      if (onCancelled) onCancelled(res.data ?? res);
    } catch (err) {
      toast.error(err.message || "Failed to cancel meeting");
    } finally {
      setCancelling(false);
    }
  };

  const handleEndMeeting = async () => {
    const ok = await confirm({
      title: "End meeting for everyone?",
      message: "Are you sure you want to end this meeting for everyone? Participants will no longer be able to join.",
      confirmText: "End Meeting",
      variant: "danger",
    });
    if (!ok) return;
    setEnding(true);
    try {
      const res = await httpApi.post(`/conversations/${conversationId}/meet/${eventId}/end`);
      toast.success("Meeting ended");
      if (onUpdated) onUpdated(res.data ?? res);
    } catch (err) {
      toast.error(err.message || "Failed to end meeting");
    } finally {
      setEnding(false);
    }
  };

  const handleSaveLink = async (e) => {
    e.preventDefault();
    const clean = newUrl.trim();
    if (!clean) {
      toast.error("Please enter a meeting URL");
      return;
    }
    if (clean.toLowerCase().includes("meet.google.com/new")) {
      toast.error("Please open meet.google.com/new, start the call, and copy the room URL (e.g. https://meet.google.com/xxx-yyyy-zzz) from your browser address bar.");
      return;
    }
    setSavingLink(true);
    try {
      const res = await httpApi.patch(`/conversations/${conversationId}/meet/${eventId}`, {
        meet_url: clean,
      });
      toast.success("Meeting link updated");
      setEditingLink(false);
      const updated = res.data ?? res;
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      toast.error(err.message || "Failed to update meeting link");
    } finally {
      setSavingLink(false);
    }
  };

  const isScheduled = effectiveStatus === "scheduled";
  const isEnded = effectiveStatus === "ended";
  const isCancelled = effectiveStatus === "cancelled";

  return (
    <div
      className={`rounded-xl border p-3.5 my-1.5 transition-all text-left ${
        isMe
          ? "bg-white/10 border-white/20 text-white"
          : "bg-surface border-border text-text-primary shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg grid place-items-center ${
              isMe ? "bg-white/20 text-white" : "bg-action/10 text-action"
            }`}
          >
            <VideoIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider opacity-75">
              Google Meet
            </div>
            <div className="text-sm font-semibold leading-tight line-clamp-1">
              {title}
            </div>
          </div>
        </div>

        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${
            isScheduled
              ? isMe
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : isEnded
              ? isMe
                ? "bg-white/10 text-white/70"
                : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
              : isMe
              ? "bg-rose-500/20 text-rose-200 border border-rose-400/30"
              : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          {status}
        </span>
      </div>

      <div
        className={`flex items-center gap-1.5 text-xs mb-3 ${
          isMe ? "text-white/80" : "text-text-secondary"
        }`}
      >
        <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
        <span>{formatMeetingTime()}</span>
      </div>

      {editingLink ? (
        <form onSubmit={handleSaveLink} className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between text-[11px]">
            <label className="font-semibold opacity-90">Meeting URL:</label>
            <a
              href="https://meet.google.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className={`underline hover:opacity-80 flex items-center gap-1 ${isMe ? "text-white" : "text-action"}`}
            >
              Open meet.google.com/new ↗
            </a>
          </div>
          <input
            type="url"
            required
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://meet.google.com/xxx-yyyy-zzz"
            className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none ${
              isMe
                ? "bg-black/30 border-white/30 text-white placeholder-white/50 focus:border-white"
                : "bg-bg border-border text-text-primary focus:border-action"
            }`}
          />
          <p className={`text-[10px] -mt-1 ${isMe ? "text-white/75" : "text-text-secondary"}`}>
            Open meet.google.com/new, start the call, and copy the room URL (meet.google.com/xxx-yyyy-zzz) from your browser address bar.
          </p>
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setEditingLink(false);
                setNewUrl(meetUrl || "");
              }}
              className={`px-2.5 py-1 text-xs rounded-md border ${
                isMe
                  ? "border-white/30 hover:bg-white/10 text-white"
                  : "border-border text-text-secondary hover:bg-bg"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingLink || !newUrl.trim()}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-action hover:bg-action-hover text-white disabled:opacity-50"
            >
              {savingLink ? "Saving..." : "Save Link"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          {isScheduled && meetUrl ? (
            <a
              href={meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-colors shadow-sm flex items-center justify-center gap-1.5 ${
                isMe
                  ? "bg-white text-action hover:bg-slate-100"
                  : "bg-action text-white hover:bg-action-hover"
              }`}
            >
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Join Meeting</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium text-center cursor-not-allowed ${
                isMe
                  ? "bg-white/10 text-white/40"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              }`}
            >
              {isEnded ? "Meeting ended" : isCancelled ? "Meeting cancelled" : "Meeting unavailable"}
            </button>
          )}

          {isMe && isScheduled && eventId && (
            <>
              <button
                type="button"
                onClick={() => {
                  setNewUrl(meetUrl || "");
                  setEditingLink(true);
                }}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isMe
                    ? "border border-white/30 hover:bg-white/10 text-white/90"
                    : "border border-border text-text-secondary hover:text-text-primary"
                }`}
                title="Edit meeting URL"
              >
                Edit Link
              </button>
              <button
                type="button"
                onClick={handleEndMeeting}
                disabled={ending}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isMe
                    ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30"
                    : "border border-border text-text-secondary hover:text-amber-500 hover:border-amber-500/40"
                }`}
                title="End meeting for all participants"
              >
                {ending ? "..." : "End"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isMe
                    ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30"
                    : "border border-border text-text-secondary hover:text-error hover:border-error/40"
                }`}
              >
                {cancelling ? "..." : "Cancel"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

