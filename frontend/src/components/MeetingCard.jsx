import { useState } from "react";
import { VideoIcon, CalendarIcon } from "./icons";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";

export default function MeetingCard({
  message,
  conversationId,
  isMe = false,
  onCancelled,
}) {
  const toast = useToast();
  const [cancelling, setCancelling] = useState(false);

  const title = message.meetTitle || "Consultation Meeting";
  const meetUrl = message.meetUrl;
  const status = message.meetStatus || "scheduled";
  const eventId = message.meetEventId;
  const startAt = message.meetStartAt ? new Date(message.meetStartAt) : null;
  const endAt = message.meetEndAt ? new Date(message.meetEndAt) : null;

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
    if (!confirm("Are you sure you want to cancel this meeting?")) return;
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

  const isScheduled = status === "scheduled";
  const isEnded = status === "ended";
  const isCancelled = status === "cancelled";

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
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
              isMe
                ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30"
                : "border border-border text-text-secondary hover:text-error hover:border-error/40"
            }`}
          >
            {cancelling ? "Cancelling..." : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}
