export const trimToWords = (text, maxWords) => {
  if (!text) return "";
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (!maxWords || maxWords <= 0) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
};

const stripDiacritics = (text) => {
  if (!text) return "";
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
};

export const toSlug = (text, maxWords = 8) => {
  const trimmed = trimToWords(text, maxWords);
  const normalized = stripDiacritics(trimmed);
  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9\u0B80-\u0BFF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || "news";
};

export const buildNewsPath = (newsOrId, headline, options = {}) => {
  let id = null;
  let title = "";

  if (newsOrId && typeof newsOrId === "object") {
    id = newsOrId.id ?? newsOrId.newsId ?? null;
    title =
      newsOrId.data?.headline ||
      newsOrId.title ||
      headline ||
      "";
  } else {
    id = newsOrId;
    title = headline || "";
  }

  const maxWords = options.maxWords ?? 8;
  const slug = toSlug(title, maxWords);
  return `/news/${id}/${slug}`;
};

export const toSectionSlug = (name) => {
  if (!name) return "";
  const normalized = stripDiacritics(String(name).trim());
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9\u0B80-\u0BFF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
};

export const buildSectionPath = (name) => {
  const slug = toSectionSlug(name);
  if (!slug || slug === "main") return "/";
  return `/section/${slug}`;
};

export const sectionNameFromPath = (slug) => {
  if (!slug) return "main";
  return slug.replace(/-/g, " ").trim() || "main";
};
