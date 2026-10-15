import { useEffect, useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";
import { ArrowLeftIcon, ArrowRightIcon } from "../Components/icons";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-");
}

function headingsOf(markdown) {
  const out = [];
  for (const m of String(markdown || "").matchAll(/^##\s+(.+)$/gm)) {
    const title = m[1].trim();
    out.push({ title, id: slugify(title) });
  }
  return out;
}

export default function Help({ pages = [] }) {
  const toast = useToast();
  const [slug, setSlug] = useState(pages[0]?.slug || "user-guide");
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    httpApi
      .get(`/help/content/${slug}`)
      .then((res) => {
        if (alive) setDoc(res?.data ?? null);
      })
      .catch((err) => toast.error(err.message || "Could not load this guide."))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const toc = useMemo(() => headingsOf(doc?.markdown), [doc]);
  const idx = Math.max(0, pages.findIndex((p) => p.slug === slug));
  const prev = pages[idx - 1] || null;
  const next = pages[idx + 1] || null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <Head title={doc?.title ? `${doc.title} · Help Center` : "Help Center"} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-secondary">
        <Link href="/feed" className="inline-flex items-center gap-1 hover:text-text-primary min-h-[44px]">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Home
        </Link>
        <span aria-hidden="true">/</span>
        <span>Help Center</span>
        <span aria-hidden="true">/</span>
        <span className="text-text-primary font-medium">{doc?.title ?? "…"}</span>
      </nav>

      <h1 className="text-[clamp(1.5rem,5vw,2rem)] font-bold text-text-primary tracking-tight mt-2">Documentation</h1>
      <p className="text-sm text-text-secondary mt-1">Guides for using, administering, and deploying BizLink.</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_200px] items-start">
        {/* Left: guide nav */}
        <nav aria-label="Guides" className="flex lg:flex-col gap-1 overflow-x-auto lg:sticky lg:top-20 bg-surface border border-border rounded-xl p-2 shadow-sm">
          {pages.map((p) => (
            <button
              key={p.slug}
              onClick={() => setSlug(p.slug)}
              aria-current={slug === p.slug ? "page" : undefined}
              className={`shrink-0 text-left px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action ${
                slug === p.slug ? "bg-action/10 text-action" : "text-text-secondary hover:bg-bg hover:text-text-primary"
              }`}
            >
              {p.title}
            </button>
          ))}
        </nav>

        {/* Center: prose */}
        <article className="min-w-0 bg-surface border border-border rounded-xl shadow-sm p-5 sm:p-8">
          {loading && !doc ? (
            <div className="space-y-3 animate-pulse" aria-label="Loading guide">
              <div className="h-6 bg-bg rounded w-1/3" />
              <div className="h-4 bg-bg rounded w-full" />
              <div className="h-4 bg-bg rounded w-5/6" />
              <div className="h-4 bg-bg rounded w-4/6" />
            </div>
          ) : (
            <>
              <div className="help-prose">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => {
                      const text = Array.isArray(children) ? children.join("") : String(children ?? "");
                      return <h2 id={slugify(text)} className="scroll-mt-24">{children}</h2>;
                    },
                  }}
                >
                  {doc?.markdown ?? ""}
                </ReactMarkdown>
              </div>

              {/* Prev / next guide */}
              <div className="mt-8 pt-5 border-t border-border grid grid-cols-2 gap-3">
                <div>
                  {prev && (
                    <button
                      onClick={() => setSlug(prev.slug)}
                      className="group w-full text-left rounded-xl border border-border hover:border-action/40 hover:bg-bg transition-colors px-4 py-3 min-h-[56px]"
                    >
                      <span className="block text-[11px] font-semibold tracking-widest text-text-secondary">PREVIOUS</span>
                      <span className="block text-sm font-semibold text-text-primary group-hover:text-action mt-0.5">← {prev.title}</span>
                    </button>
                  )}
                </div>
                <div>
                  {next && (
                    <button
                      onClick={() => setSlug(next.slug)}
                      className="group w-full text-right rounded-xl border border-border hover:border-action/40 hover:bg-bg transition-colors px-4 py-3 min-h-[56px]"
                    >
                      <span className="block text-[11px] font-semibold tracking-widest text-text-secondary">NEXT</span>
                      <span className="block text-sm font-semibold text-text-primary group-hover:text-action mt-0.5">{next.title} →</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </article>

        {/* Right: on this page */}
        <aside className="hidden xl:block sticky top-20" aria-label="On this page">
          <p className="text-[11px] font-bold tracking-widest text-text-secondary px-2">ON THIS PAGE</p>
          <ul className="mt-2 space-y-0.5">
            {toc.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="block px-2 py-1.5 rounded-lg text-[13px] text-text-secondary hover:text-action hover:bg-bg transition-colors leading-snug"
                >
                  {h.title}
                </a>
              </li>
            ))}
            {toc.length === 0 && <li className="px-2 text-[13px] text-text-secondary">No sections yet.</li>}
          </ul>
          <Link href="/contact" className="mt-4 flex items-center gap-1.5 px-2 py-2 text-[13px] font-medium text-action hover:underline">
            Still stuck? Contact us <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
