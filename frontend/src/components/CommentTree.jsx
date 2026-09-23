import { useEffect, useRef, useState } from "react";
import { usePage } from "@inertiajs/react";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";
import {
  DotsIcon, PencilIcon, TrashIcon, FlagIcon, LinkIcon, ReplyIcon,
  ImageIcon, HeartIcon, XIcon,
} from "./icons";

const REACT_EMOJI = ["👍", "❤️", "😮", "😂", "🙏"];
const REPORT_REASONS = ["spam", "harassment", "scam", "other"];
const REPLY_PREVIEW = 3;

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

// Nest a flat embed list (parentId may be set) into top/replies shape.
function nestFlat(list) {
  const byId = new Map();
  const tops = [];
  (list || []).forEach((c) => byId.set(String(c.id), { ...c, replies: [], repliesCount: c.repliesCount ?? 0 }));
  byId.forEach((c) => {
    const pid = c.parentId != null ? String(c.parentId) : null;
    if (pid && byId.has(pid)) {
      const p = byId.get(pid);
      p.replies = [...(p.replies || []), c];
      p.repliesCount = Math.max(p.repliesCount ?? 0, p.replies.length);
    } else if (!pid) {
      tops.push(c);
    }
  });
  return tops;
}

function mapNode(tree, id, fn) {
  return (tree || []).map((c) => {
    if (String(c.id) === String(id)) return fn(c);
    if ((c.replies || []).length) return { ...c, replies: mapNode(c.replies, id, fn) };
    return c;
  });
}

async function uploadMedia(file) {
  const isVideo = (file.type || "").startsWith("video");
  const max = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
  if (file.size > max) throw new Error(isVideo ? "Video must be under 100MB." : "Image must be under 20MB.");
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/uploads", {
    method: "POST", credentials: "same-origin",
    headers: { "X-CSRF-TOKEN": csrfToken(), "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Upload failed (${res.status})`);
  return json;
}

function Composer({ autoFocus, onSend, sending }) {
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const toast = useToast();
  const submit = async () => {
    if (!text.trim() && !media) return;
    await onSend(text.trim(), media);
    setText("");
    setMedia(null);
  };
  const pick = async (e) => {
    const f = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!f) return;
    setUploading(true);
    try {
      const up = await uploadMedia(f);
      setMedia({ url: up.url, media_type: up.media_type });
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="flex gap-2 items-start">
      <textarea
        value={text} autoFocus={autoFocus} rows={1}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="Write a comment…"
        className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-action resize-none"
      />
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={pick} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || sending} title="Attach photo/video" className="p-2 rounded-lg text-text-secondary hover:bg-bg disabled:opacity-50">
        <ImageIcon />
      </button>
      <button type="button" onClick={submit} disabled={sending || uploading || (!text.trim() && !media)} className="px-3 py-2 rounded-lg bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-xs font-semibold">
        {sending ? "…" : "Send"}
      </button>
      {media && (
        <div className="relative shrink-0">
          {media.media_type === "video"
            ? <video src={media.url} className="w-12 h-12 rounded-lg object-cover border border-border" />
            : <img src={media.url} alt="" className="w-12 h-12 rounded-lg object-cover border border-border" />}
          <button type="button" onClick={() => setMedia(null)} aria-label="Remove attachment" className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-error text-white grid place-items-center"><XIcon className="w-3 h-3" /></button>
        </div>
      )}
    </div>
  );
}

function Node({ c, depth, ctx }) {
  const { viewer, isPostOwner, postId, postSlug, onReply, onReact, onEdit, onRemove, onReport, onCopy, menu, setMenu, replyFor, setReplyFor, sending, highlight } = ctx;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.text || "");
  const [reporting, setReporting] = useState(false);
  const mine = viewer && String(c.userId) === String(viewer.id);
  const canEdit = mine && !c.deleted;
  const canDelete = (mine || isPostOwner) && !c.deleted;
  const shownReplies = (c.replies || []).slice(0, REPLY_PREVIEW);
  const hiddenCount = Math.max(0, (c.repliesCount ?? (c.replies || []).length) - shownReplies.length);
  const draftBox = replyFor === c.id;

  return (
    <div id={`comment-${c.id}`} className={`flex gap-2.5 ${depth > 0 ? "ml-8 mt-2.5" : "mt-3.5"} ${highlight === c.id ? "outline outline-2 outline-action rounded-lg" : ""}`}>
      <img src={c.avatar} alt={c.author} className="w-8 h-8 rounded-full object-cover shrink-0 bg-bg" />
      <div className="flex-1 min-w-0">
        <div className="bg-bg rounded-xl px-3 py-2">
          <p className="text-xs font-semibold text-text-primary">
            {c.author}
            {c.isSellerReply && <span className="ml-1.5 text-[10px] font-bold bg-success/10 text-success border border-success/20 rounded-full px-1.5 py-px">Seller</span>}
            <span className="ml-1.5 font-normal text-text-secondary">{c.timestamp}{c.edited ? " · edited" : ""}</span>
          </p>
          {c.deleted ? (
            <p className="text-sm text-text-secondary italic mt-0.5">This comment was deleted.</p>
          ) : (
            <>
              {!!c.text && <p className="text-sm text-text-primary mt-0.5 whitespace-pre-wrap break-words">{c.text}</p>}
              {c.mediaUrl && (c.mediaType === "video"
                ? <video src={c.mediaUrl} controls className="mt-2 w-full max-h-56 rounded-lg border border-border" />
                : <img src={c.mediaUrl} alt="" className="mt-2 max-h-56 rounded-lg border border-border" />)}
            </>
          )}
        </div>

        {!c.deleted && (
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            {REACT_EMOJI.map((e) => {
              const n = c.reactions?.[e] ?? 0;
              if (!n && c.myReaction !== e) return null;
              const active = c.myReaction === e;
              return (
                <button key={e} onClick={() => onReact(c.id, e)} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-xs ${active ? "bg-action/10 border-action/30" : "border-border hover:bg-bg"}`}>
                  {e}{n > 0 && <span className="text-text-secondary">{n}</span>}
                </button>
              );
            })}
            <button onClick={() => onReact(c.id, "❤️")} title="React" className="p-1 rounded-full text-text-secondary hover:bg-bg"><HeartIcon className="w-3.5 h-3.5" /></button>
            {depth === 0 && viewer && <button onClick={() => setReplyFor(draftBox ? null : c.id)} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs text-text-secondary hover:bg-bg"><ReplyIcon className="w-3.5 h-3.5" /> Reply</button>}
            <div className="relative">
              <button
                onClick={() => setMenu(menu === c.id ? null : c.id)}
                onContextMenu={(e) => { e.preventDefault(); setMenu(c.id); }}
                aria-label="Comment actions"
                className="p-1 rounded-full text-text-secondary hover:bg-bg"
              >
                <DotsIcon className="w-4 h-4" />
              </button>
              {menu === c.id && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-surface rounded-lg shadow-xl border border-border z-20 py-1 text-sm">
                  {depth === 0 && viewer && <button onClick={() => { setMenu(null); setReplyFor(c.id); }} className="w-full text-left px-3 py-1.5 hover:bg-bg flex items-center gap-2 text-text-primary"><ReplyIcon className="w-3.5 h-3.5" /> Reply</button>}
                  <button onClick={() => { setMenu(null); onCopy(c, false); }} className="w-full text-left px-3 py-1.5 hover:bg-bg flex items-center gap-2 text-text-primary"><ReplyIcon className="w-3.5 h-3.5 rotate-180" /> Copy text</button>
                  <button onClick={() => { setMenu(null); onCopy(c, true); }} className="w-full text-left px-3 py-1.5 hover:bg-bg flex items-center gap-2 text-text-primary"><LinkIcon className="w-3.5 h-3.5" /> Copy link</button>
                  {canEdit && <button onClick={() => { setMenu(null); setEditing(true); setDraft(c.text || ""); }} className="w-full text-left px-3 py-1.5 hover:bg-bg flex items-center gap-2 text-text-primary"><PencilIcon className="w-3.5 h-3.5" /> Edit</button>}
                  {canDelete && <button onClick={() => { setMenu(null); onRemove(c.id); }} className="w-full text-left px-3 py-1.5 hover:bg-bg flex items-center gap-2 text-error"><TrashIcon className="w-3.5 h-3.5" /> Delete</button>}
                  {viewer && !mine && <button onClick={() => { setMenu(null); setReporting(true); }} className="w-full text-left px-3 py-1.5 hover:bg-bg flex items-center gap-2 text-text-primary"><FlagIcon className="w-3.5 h-3.5" /> Report</button>}
                </div>
              )}
            </div>
          </div>
        )}

        {editing && (
          <div className="mt-1.5 flex gap-2">
            <textarea value={draft} rows={2} onChange={(e) => setDraft(e.target.value)} className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-action resize-none" />
            <button onClick={() => { onEdit(c.id, draft); setEditing(false); }} className="px-3 py-2 rounded-lg bg-action text-white text-xs font-semibold self-start">Save</button>
            <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg border border-border text-xs text-text-secondary self-start">Cancel</button>
          </div>
        )}
        {reporting && (
          <div className="mt-1.5 flex gap-2 items-center flex-wrap">
            {REPORT_REASONS.map((r) => (
              <button key={r} onClick={() => { onReport(c.id, r); setReporting(false); }} className="px-2.5 py-1 rounded-full border border-border text-xs text-text-secondary hover:bg-bg capitalize">{r}</button>
            ))}
            <button onClick={() => setReporting(false)} className="text-xs text-text-secondary">Cancel</button>
          </div>
        )}
        {draftBox && (
          <div className="mt-2">
            <Composer autoFocus onSend={(t, m) => onReply(c.id, t, m).then(() => setReplyFor(null))} sending={sending} />
          </div>
        )}

        {shownReplies.map((r) => <Node key={r.id} c={r} depth={depth + 1} ctx={ctx} />)}
        {hiddenCount > 0 && (
          <button onClick={() => ctx.onExpand(c.id)} className="mt-1.5 text-xs font-medium text-action hover:underline">
            View {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CommentTree({ postId, postSlug, authorId, initialComments = [], autoLoad = true, onAdd }) {
  const toast = useToast();
  const { auth } = usePage().props;
  const viewer = auth?.user ?? null;
  const isPostOwner = !!(viewer && authorId && String(viewer.id) === String(authorId));
  const [tree, setTree] = useState(() => nestFlat(initialComments));
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(null);
  const [replyFor, setReplyFor] = useState(null);
  const [highlight, setHighlight] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await httpApi.get(`/opportunities/${postId}/comments`);
      const data = res?.data ?? res ?? [];
      setTree(Array.isArray(data) ? data : []);
      setLoaded(true);
    } catch (err) {
      toast.error(err.message || "Could not load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, autoLoad]);

  // #comment-{id} deep-link: expand + scroll + flash.
  useEffect(() => {
    if (!loaded || !tree?.length) return;
    const m = (window.location.hash || "").match(/^#comment-(\d+)$/);
    if (!m) return;
    const id = m[1];
    const top = tree.find((c) => String(c.id) === id || (c.replies || []).some((r) => String(r.id) === id));
    if (!top) return;
    const t = setTimeout(() => {
      document.getElementById(`comment-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlight(Number(id));
      setTimeout(() => setHighlight(null), 2600);
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const mutate = async (fn, failMsg) => {
    setSending(true);
    try {
      await fn();
    } catch (err) {
      toast.error(err.message || failMsg);
    } finally {
      setSending(false);
    }
  };

  const sendTop = (text, media) => mutate(async () => {
    const res = await httpApi.post(`/opportunities/${postId}/comments`, {
      text, parent_id: null,
      media_url: media?.url ?? null, media_type: media?.media_type ?? null,
    });
    const node = res?.data ?? res;
    setTree((prev) => [node, ...(prev || [])]);
    setLoaded(true);
    onAdd && onAdd({ postId, text, comment: node });
  }, "Could not post comment");

  const sendReply = (parentId, text, media) => mutate(async () => {
    const res = await httpApi.post(`/opportunities/${postId}/comments`, {
      text, parent_id: parentId,
      media_url: media?.url ?? null, media_type: media?.media_type ?? null,
    });
    const node = res?.data ?? res;
    // Server re-parents depth>2 to the top-level ancestor — trust its parentId.
    setTree((prev) => mapNode(prev, node.parentId, (p) => ({
      ...p,
      replies: [...(p.replies || []), node],
      repliesCount: (p.repliesCount ?? (p.replies || []).length) + 1,
    })));
    onAdd && onAdd({ postId, text, comment: node });
  }, "Could not post reply");

  const react = (id, emoji) => mutate(async () => {
    const res = await httpApi.post(`/comments/${id}/react`, { emoji });
    const node = res?.data ?? res?.data;
    if (node && node.reactions) {
      setTree((prev) => mapNode(prev, id, (c) => ({ ...c, reactions: node.reactions, myReaction: node.myReaction ?? null })));
    } else {
      load();
    }
  }, "Reaction failed");

  const edit = (id, text) => {
    if (!text.trim()) return;
    mutate(async () => {
      const res = await httpApi.patch(`/comments/${id}`, { text: text.trim() });
      const node = res?.data ?? res;
      setTree((prev) => mapNode(prev, id, (c) => ({ ...c, text: node.text ?? text.trim(), edited: true })));
      toast.success("Comment updated.");
    }, "Could not update comment");
  };

  const remove = (id) => {
    if (!window.confirm("Delete this comment?")) return;
    mutate(async () => {
      await httpApi.del(`/comments/${id}`);
      setTree((prev) => mapNode(prev, id, (c) => ({ ...c, text: "This comment was deleted.", mediaUrl: null, mediaType: null, deleted: true })));
    }, "Could not delete comment");
  };

  const report = (id, reason) => mutate(async () => {
    const res = await httpApi.post(`/comments/${id}/report`, { reason });
    toast.success(res?.message || "Reported.");
    if (res?.hidden) {
      setTree((prev) => mapNode(prev, id, (c) => ({ ...c, text: "This comment was deleted.", mediaUrl: null, mediaType: null, deleted: true })));
    }
  }, "Could not report comment");

  const copy = async (c, link) => {
    try {
      const val = link
        ? `${window.location.origin}/post/${postSlug || postId}#comment-${c.id}`
        : (c.text || "");
      await navigator.clipboard.writeText(val);
      toast.success(link ? "Link copied." : "Copied.");
    } catch {
      toast.error("Copy failed.");
    }
  };

  const expand = async (id) => {
    try {
      const res = await httpApi.get(`/comments/${id}/replies`);
      const data = res?.data ?? res ?? [];
      setTree((prev) => mapNode(prev, id, (c) => ({ ...c, replies: Array.isArray(data) ? data : [], repliesCount: (data || []).length })));
    } catch (err) {
      toast.error(err.message || "Could not load replies");
    }
  };

  const ctx = {
    viewer, isPostOwner, postId, postSlug,
    onReply: sendReply, onReact: react, onEdit: edit, onRemove: remove, onReport: report,
    onCopy: copy, onExpand: expand, menu, setMenu, replyFor, setReplyFor, sending, highlight,
  };

  if (!loaded && loading && !(tree || []).length) {
    return <p className="text-sm text-text-secondary py-3">Loading comments…</p>;
  }

  return (
    <div onClick={(e) => { if (!e.target.closest(".relative")) setMenu(null); }}>
      {viewer ? <Composer onSend={sendTop} sending={sending} /> : <p className="text-sm text-text-secondary">Log in to comment.</p>}
      {(tree || []).length === 0 && loaded && <p className="text-sm text-text-secondary mt-3">No comments yet. Start the discussion.</p>}
      {(tree || []).map((c) => <Node key={c.id} c={c} depth={0} ctx={ctx} />)}
    </div>
  );
}
