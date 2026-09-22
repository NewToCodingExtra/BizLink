import { useCallback, useEffect, useRef, useState } from "react";
import { opportunitiesApi } from "../api/client";

export function useInfiniteFeed({ perPage = 8, type = "All", q = "", mediaType, enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sentinelElement, setSentinelElement] = useState(null);
  const sentinelRef = setSentinelElement;
  const loadMoreRef = useRef(() => {});
  const stateRef = useRef({ page: 1, lastPage: 1, busy: false });
  const countRef = useRef(0);
  countRef.current = items.length;

  const fetchPage = useCallback(
    async (pageNum, append) => {
      const params = { per_page: perPage };
      if (type && type !== "All") {
        if (type === "Following") params.following = 1;
        else params.type = type;
      }
      if (q && q.trim()) params.q = q.trim();
      if (mediaType) params.mediaType = mediaType;
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
      setRefreshing(false);
      return;
    }
    let cancelled = false;
    const first = countRef.current === 0;
    setError("");
    if (first) {
      setLoading(true);
      setItems([]);
      setPage(1);
      setLastPage(1);
    } else {
      setRefreshing(true);
    }
    fetchPage(1, false)
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load feed");
      })
      .finally(() => {
        if (cancelled) return;
        if (first) setLoading(false);
        else setRefreshing(false);
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
    stateRef.current = { page, lastPage, busy: loading || loadingMore || refreshing };
  }, [page, lastPage, loading, loadingMore, refreshing]);

  useEffect(() => {
    if (!sentinelElement || !enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "600px" }
    );
    observer.observe(sentinelElement);
    return () => observer.disconnect();
  }, [sentinelElement, enabled]);

  const loadMore = useCallback(() => {
    loadMoreRef.current();
  }, []);

  return {
    items,
    setItems,
    loading,
    loadingMore,
    refreshing,
    error,
    setError,
    hasMore: page < lastPage,
    total,
    sentinelRef,
    loadMore,
  };
}
