import { useCallback, useEffect, useRef, useState } from "react";
import { opportunitiesApi } from "../api/client";

export function useInfiniteFeed({ perPage = 8, type = "All", q = "", enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef(null);
  const loadMoreRef = useRef(() => {});
  const stateRef = useRef({ page: 1, lastPage: 1, busy: false });

  const fetchPage = useCallback(
    async (pageNum, append) => {
      const params = { per_page: perPage };
      if (type && type !== "All") {
        if (type === "Following") params.following = 1;
        else params.type = type;
      }
      if (q && q.trim()) params.q = q.trim();
      const res = await opportunitiesApi.list({ ...params, page: pageNum });
      const data = res.data || [];
      setItems((prev) => (append ? [...prev, ...data.filter((d) => !prev.some((p) => String(p.id) === String(d.id)))] : data));
      setPage(res.meta?.current_page ?? pageNum);
      setLastPage(res.meta?.last_page ?? pageNum);
      setTotal(res.meta?.total ?? data.length);
    },
    [perPage, type, q]
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setItems([]);
    setPage(1);
    setLastPage(1);
    fetchPage(1, false)
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load feed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, enabled]);

  loadMoreRef.current = () => {
    const s = stateRef.current;
    if (s.busy || s.page >= s.lastPage) return;
    s.busy = true;
    setLoadingMore(true);
    fetchPage(s.page + 1, true)
      .catch(() => {})
      .finally(() => {
        s.busy = false;
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    stateRef.current = { page, lastPage, busy: loading || loadingMore };
  }, [page, lastPage, loading, loadingMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  return {
    items,
    setItems,
    loading,
    loadingMore,
    error,
    setError,
    hasMore: page < lastPage,
    total,
    sentinelRef,
  };
}
