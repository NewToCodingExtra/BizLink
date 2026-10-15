import { useEffect, useState } from "react";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";
import Modal from "./Modal";
import Button from "./Button";

const DEFAULT_CATEGORIES = [
  { key: "spam", label: "Spam / misleading", severity: 20 },
  { key: "scam", label: "Scam / fraud", severity: 70 },
  { key: "harassment", label: "Harassment / bullying", severity: 60 },
  { key: "hate", label: "Hate speech", severity: 85 },
  { key: "explicit", label: "Sexual / explicit", severity: 90 },
  { key: "violence", label: "Violence / gore", severity: 95 },
  { key: "self_harm", label: "Self-harm", severity: 95 },
  { key: "copyright", label: "Copyright / IP", severity: 40 },
  { key: "other", label: "Other", severity: 10 },
];

export default function ReportModal({ isOpen, onClose, endpoint, title = "Report content" }) {
  const toast = useToast();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [categoryKey, setCategoryKey] = useState("spam");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    httpApi
      .get("/report-categories")
      .then((res) => {
        const list = res?.data ?? res ?? [];
        if (Array.isArray(list) && list.length > 0) {
          setCategories(list);
          if (!list.some((c) => c.key === categoryKey)) {
            setCategoryKey(list[0].key);
          }
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      })
      .catch(() => {
        setCategories(DEFAULT_CATEGORIES);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async () => {
    if (!endpoint) return;
    setSending(true);
    try {
      const res = await httpApi.post(endpoint, { category_key: categoryKey, details: details.trim() || null });
      toast.success(res?.message || "Reported — our team will review it.");
      setDetails("");
      onClose();
    } catch (err) {
      toast.error(err.message || "Could not submit report.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={sending} onClick={submit}>
            {sending ? "Sending…" : "Submit report"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">Choose a reason. High-severity reports are prioritized for admin review.</p>
      <div className="mt-3 grid gap-2">
        {categories.map((c) => (
          <label
            key={c.key}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 min-h-[44px] cursor-pointer transition-colors ${
              categoryKey === c.key ? "border-action/50 bg-action/5" : "border-border hover:bg-bg"
            }`}
          >
            <input
              type="radio"
              name="report-category"
              checked={categoryKey === c.key}
              onChange={() => setCategoryKey(c.key)}
              className="accent-[var(--color-action)]"
            />
            <span className="flex-1 min-w-0 text-sm font-medium text-text-primary truncate">{c.label}</span>
            <span
              className={`shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 border ${
                (c.severity ?? 0) >= 70
                  ? "bg-error/10 text-error border-error/20"
                  : (c.severity ?? 0) >= 40
                    ? "bg-warning/10 text-warning border-warning/20"
                    : "bg-bg text-text-secondary border-border"
              }`}
            >
              {c.severity}
            </span>
          </label>
        ))}
      </div>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Add context (optional)…"
        className="mt-3 w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-action resize-none"
      />
    </Modal>
  );
}
