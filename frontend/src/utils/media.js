const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const getWindowOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "";

const getConfiguredMediaBase = () => {
  const explicitBase = trimTrailingSlash(
    import.meta.env.VITE_MEDIA_ORIGIN ||
      import.meta.env.VITE_UPLOADS_ORIGIN ||
      import.meta.env.VITE_OG_SHARE_ORIGIN ||
      ""
  );
  if (explicitBase) return explicitBase;

  const apiBase = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
  if (/^https?:\/\//i.test(apiBase)) {
    try {
      const url = new URL(apiBase);
      return trimTrailingSlash(url.origin);
    } catch (error) {
      // fall through to the window origin below
    }
  }

  return "";
};

const getMediaBase = () => {
  const configuredBase = getConfiguredMediaBase();
  if (configuredBase) return configuredBase;

  return trimTrailingSlash(getWindowOrigin());
};

const toAbsoluteMediaUrl = (pathValue, mediaBase = getMediaBase()) => {
  if (!mediaBase) return pathValue;

  try {
    return new URL(pathValue, `${mediaBase}/`).toString();
  } catch (error) {
    const normalizedPath = String(pathValue || "").startsWith("/")
      ? pathValue
      : `/${pathValue}`;
    return `${mediaBase}${normalizedPath}`;
  }
};

export const resolveMediaUrl = (value) => {
  if (typeof value !== "string") return value;

  const raw = value.trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (url.pathname.startsWith("/uploads/")) {
        const configuredBase = getConfiguredMediaBase();
        if (!configuredBase) {
          return raw;
        }
        return toAbsoluteMediaUrl(
          `${url.pathname}${url.search}${url.hash}`,
          configuredBase
        );
      }
      return raw;
    } catch (error) {
      return raw;
    }
  }

  if (raw.startsWith("/uploads/")) {
    return toAbsoluteMediaUrl(raw);
  }

  if (raw.startsWith("uploads/")) {
    return toAbsoluteMediaUrl(`/${raw}`);
  }

  return raw;
};

const normalizeVideoData = (videoData) => {
  if (!videoData || typeof videoData !== "object") return videoData;

  return {
    ...videoData,
    thumbnail: resolveMediaUrl(videoData.thumbnail),
    videoUrl: resolveMediaUrl(videoData.videoUrl),
  };
};

const normalizeBox = (box) => {
  if (!box || typeof box !== "object" || box.type !== "video") return box;

  return {
    ...box,
    videoData: normalizeVideoData(box.videoData),
  };
};

const normalizeContainer = (container) => {
  if (!container?.settings?.boxes || !Array.isArray(container.settings.boxes)) {
    return container;
  }

  return {
    ...container,
    settings: {
      ...container.settings,
      boxes: container.settings.boxes.map(normalizeBox),
    },
  };
};

export const normalizeNewsMedia = (news) => {
  if (!news || typeof news !== "object") return news;

  return {
    ...news,
    data: news.data
      ? {
          ...news.data,
          thumbnail: resolveMediaUrl(news.data.thumbnail),
        }
      : news.data,
    dataEn: news.dataEn
      ? {
          ...news.dataEn,
          thumbnail: resolveMediaUrl(news.dataEn.thumbnail),
        }
      : news.dataEn,
    fullContent: Array.isArray(news.fullContent)
      ? news.fullContent.map(normalizeBox)
      : news.fullContent,
    containerOverlays: Array.isArray(news.containerOverlays)
      ? news.containerOverlays.map(normalizeContainer)
      : news.containerOverlays,
  };
};

export const normalizeNewsPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeNewsMedia);
  }

  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return {
      ...payload,
      data: payload.data.map(normalizeNewsMedia),
    };
  }

  if (Array.isArray(payload.news)) {
    return {
      ...payload,
      news: payload.news.map(normalizeNewsMedia),
    };
  }

  if (Array.isArray(payload.items)) {
    return {
      ...payload,
      items: payload.items.map(normalizeNewsMedia),
    };
  }

  if (payload.news && typeof payload.news === "object") {
    return {
      ...payload,
      news: normalizeNewsMedia(payload.news),
    };
  }

  return normalizeNewsMedia(payload);
};
