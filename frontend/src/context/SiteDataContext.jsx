import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getNewsById, getNewsBySlug, getNewsSummaryById } from "../Api/newsApi";
import {
  getNewsCategorySlugCandidates,
  getNewsSlugCandidates,
} from "../utils/paths";
import { getLayout } from "../Api/layoutApi";
import { getAdminConfig } from "../Api/adminApi";
import { getNewsPageConfig } from "../Api/newsPageApi";

const SiteDataContext = createContext(null);

const resolveEnglishParagraph = (box) => {
  if (!box || box.type !== "paragraph") return box;
  const english = box.contentEn;
  if (english == null || english === "") return box;
  return { ...box, content: english };
};

const buildTranslatedNews = (newsList) => {
  if (!Array.isArray(newsList)) return [];
  return newsList.map((news) => {
    const baseData = news?.data || {};
    const enData = news?.dataEn || {};
    const data = news?.dataEn ? { ...baseData, ...enData } : baseData;

    const fullContent = Array.isArray(news?.fullContent)
      ? news.fullContent.map(resolveEnglishParagraph)
      : news?.fullContent;

    const containerOverlays = Array.isArray(news?.containerOverlays)
      ? news.containerOverlays.map((container) => {
          if (!container?.settings?.boxes) return container;
          return {
            ...container,
            settings: {
              ...container.settings,
              boxes: container.settings.boxes.map(resolveEnglishParagraph),
            },
          };
        })
      : news?.containerOverlays;

    return {
      ...news,
      data,
      fullContent,
      containerOverlays,
    };
  });
};

export const SiteDataProvider = ({ children }) => {
  const [allNews, setAllNews] = useState([]);
  const [layout, setLayout] = useState(null);
  const [adminConfig, setAdminConfig] = useState(null);
  const [newsPageConfig, setNewsPageConfig] = useState(null);
  const [language, setLanguage] = useState("ta");
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsDetailLoadingIds, setNewsDetailLoadingIds] = useState([]);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    const loadCore = async () => {
      const [layoutRes, adminRes, newsPageRes] = await Promise.allSettled([
      getLayout(),
      getAdminConfig(),
      getNewsPageConfig(),
      ]);

      if (cancelled) return;

      if (layoutRes.status === "fulfilled") {
        setLayout(layoutRes.value || null);
      }

      if (adminRes.status === "fulfilled") {
        setAdminConfig(adminRes.value || null);
      }

      if (newsPageRes.status === "fulfilled") {
        setNewsPageConfig(newsPageRes.value || null);
      }

      if (
        layoutRes.status === "rejected" ||
        adminRes.status === "rejected" ||
        newsPageRes.status === "rejected"
      ) {
        setError("Failed to load site data.");
      }

      setLoading(false);

      if (typeof window !== "undefined" && window.snapSaveState) {
        window.snapSaveState();
      }
    };

    loadCore();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = refresh();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [refresh]);

  const translatedNews = useMemo(() => buildTranslatedNews(allNews), [allNews]);

  const newsIdSetRef = useRef(new Set());
  const newsQueueRef = useRef([]);
  const newsQueueRunningRef = useRef(false);
  const newsSlugLoadingRef = useRef(new Set());

  useEffect(() => {
    const nextSet = new Set();
    allNews.forEach((item) => {
      if (item?.id != null) nextSet.add(String(item.id));
      if (item?._id != null) nextSet.add(String(item._id));
    });
    newsIdSetRef.current = nextSet;
  }, [allNews]);

  const sanitizeSummary = useCallback((news) => {
    if (!news || typeof news !== "object") return news;
    const cleaned = { ...news };
    delete cleaned.fullContent;
    delete cleaned.fullContentEn;
    delete cleaned.containerOverlays;
    delete cleaned.containerOverlaysEn;
    return cleaned;
  }, []);

  const mergeNewsItem = useCallback((newsItem) => {
    if (!newsItem) return;
    const idKey =
      newsItem?.id != null
        ? String(newsItem.id)
        : newsItem?._id != null
        ? String(newsItem._id)
        : null;
    if (!idKey) return;

    setAllNews((prev) => {
      const idx = prev.findIndex(
        (item) =>
          String(item?.id ?? item?._id ?? "") === idKey
      );
      if (idx === -1) {
        return [...prev, newsItem];
      }
      const next = [...prev];
      next[idx] = { ...prev[idx], ...newsItem };
      return next;
    });

    newsIdSetRef.current.add(idKey);
  }, []);

  const loadNewsSummaryById = useCallback(
    async (id) => {
      if (id == null) return null;
      const response = await getNewsSummaryById(id);
      const sanitized = sanitizeSummary(response);
      mergeNewsItem(sanitized);
      return sanitized;
    },
    [mergeNewsItem, sanitizeSummary]
  );

  const enqueueNewsSummaries = useCallback(
    (ids = []) => {
      const queue = newsQueueRef.current;
      const known = newsIdSetRef.current;
      ids.forEach((id) => {
        if (id == null) return;
        const key = String(id);
        if (known.has(key)) return;
        if (queue.includes(key)) return;
        queue.push(key);
      });

      if (!newsQueueRunningRef.current && queue.length > 0) {
        const runQueue = async () => {
          newsQueueRunningRef.current = true;
          setNewsLoading(true);
          try {
            while (newsQueueRef.current.length > 0) {
              const nextId = newsQueueRef.current.shift();
              if (!nextId) continue;
              if (newsIdSetRef.current.has(String(nextId))) continue;
              try {
                await loadNewsSummaryById(nextId);
              } catch (error) {
                setError((prev) => prev || "Failed to load news.");
              }
            }
          } finally {
            newsQueueRunningRef.current = false;
            setNewsLoading(false);
          }
        };
        runQueue();
      }
    },
    [loadNewsSummaryById]
  );

  const ensureNewsDetail = useCallback(
    async (id) => {
      if (id == null) return null;
      const key = String(id);
      const existing = allNews.find(
        (item) => String(item?.id ?? item?._id ?? "") === key
      );
      const alreadyLoaded =
        Array.isArray(existing?.fullContent) ||
        Array.isArray(existing?.containerOverlays);
      if (alreadyLoaded) return existing;

      setNewsDetailLoadingIds((prev) =>
        prev.includes(key) ? prev : [...prev, key]
      );
      try {
        const detail = await getNewsById(id);
        if (detail) {
          mergeNewsItem(detail);
        }
        return detail;
      } catch (error) {
        setError((prev) => prev || "Failed to load news details.");
        return null;
      } finally {
        setNewsDetailLoadingIds((prev) => prev.filter((item) => item !== key));
      }
    },
    [allNews, mergeNewsItem]
  );

  const ensureNewsDetailBySlug = useCallback(
    async (categorySlug, slug) => {
      if (!slug) return null;
      const key = `${categorySlug || "news"}:${slug}`;
      if (newsSlugLoadingRef.current.has(key)) return null;
      newsSlugLoadingRef.current.add(key);
      try {
        const response = await getNewsBySlug(categorySlug, slug, { timeout: 8000 });
        let list = [];
        if (response && typeof response === "object") {
          if (Array.isArray(response)) {
            list = response;
          } else if (Array.isArray(response?.data)) {
            list = response.data;
          } else if (response?.news) {
            list = [response.news];
          } else {
            list = [response];
          }
        }

        const normalizedSlug = String(slug);
        const normalizedCategory = categorySlug ? String(categorySlug) : "";
        let newsItem =
          list.find((item) => {
            if (!item) return false;
            const candidateSlugs = getNewsSlugCandidates(item);
            if (normalizedSlug && !candidateSlugs.includes(normalizedSlug)) {
              return false;
            }
            if (normalizedCategory) {
              const candidateCategories = getNewsCategorySlugCandidates(item).filter(Boolean);
              if (
                candidateCategories.length > 0 &&
                !candidateCategories.includes(normalizedCategory)
              ) {
                return false;
              }
            }
            return true;
          }) || null;

        if (!newsItem && list.length > 0) {
          newsItem = list[0];
        }
        if (newsItem) {
          mergeNewsItem(newsItem);
        }
        return newsItem || null;
      } catch (error) {
        setError((prev) => prev || "Failed to load news details.");
        return null;
      } finally {
        newsSlugLoadingRef.current.delete(key);
      }
    },
    [mergeNewsItem]
  );

  const isNewsDetailLoading = useCallback(
    (id) => {
      if (id == null) return false;
      return newsDetailLoadingIds.includes(String(id));
    },
    [newsDetailLoadingIds]
  );

  const updateNewsLocal = useCallback((newsId, updater) => {
    setAllNews((prev) =>
      prev.map((item) => {
        const matches =
          item?.id === newsId ||
          String(item?.id) === String(newsId) ||
          item?._id === newsId ||
          String(item?._id) === String(newsId);
        return matches ? updater(item) : item;
      })
    );
  }, []);

  const updateLayoutLocal = useCallback((updater) => {
    setLayout((prev) => (prev ? updater(prev) : prev));
  }, []);

  const value = {
    allNews,
    translatedNews,
    layout,
    adminConfig,
    newsPageConfig,
    language,
    setLanguage,
    setNewsPageConfig,
    updateNewsLocal,
    updateLayoutLocal,
    loading,
    newsLoading,
    enqueueNewsSummaries,
    ensureNewsDetail,
    ensureNewsDetailBySlug,
    isNewsDetailLoading,
    error,
    refresh,
  };

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
};

export const useSiteData = () => {
  const ctx = useContext(SiteDataContext);
  if (!ctx) {
    throw new Error("useSiteData must be used within SiteDataProvider");
  }
  return ctx;
};
