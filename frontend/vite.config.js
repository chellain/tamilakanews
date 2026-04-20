import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs/promises";
import path from "node:path";
import { buildNewsPath } from "./src/utils/paths.js";

const SITE_NAME = "Tamilaka News";
const DEFAULT_LANG = "ta";

const escapeXml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const resolveNewsDate = (news) =>
  news?.time || news?.createdAt || news?.updatedAt || null;

const resolveNewsTitle = (news) =>
  news?.data?.headline || news?.dataEn?.headline || news?.title || "News";

const resolveNewsDescription = (news) =>
  news?.data?.oneLiner ||
  news?.dataEn?.oneLiner ||
  news?.data?.summary ||
  news?.dataEn?.summary ||
  "Latest updates from Tamilaka News.";

const sanitizeFileSegment = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "news";

const resolveAbsoluteUrl = (baseUrl, value) => {
  if (!value || typeof value !== "string") return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("blob:") || value.startsWith("data:")) return "";
  try {
    return new URL(value, `${baseUrl.replace(/\/$/, "")}/`).toString();
  } catch (error) {
    return "";
  }
};

const resolveNewsImageSource = (news) =>
  news?.data?.thumbnail ||
  news?.dataEn?.thumbnail ||
  news?.thumbnail ||
  "";

const parseImageDataUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    base64: match[2],
  };
};

const imageExtensionFromMime = (mimeType) => {
  const normalized = String(mimeType || "").toLowerCase();
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/gif") return "gif";
  return "png";
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const resolveApiUrl = (baseUrl) => {
  const apiBase = process.env.VITE_API_BASE_URL || "/api";
  if (apiBase.startsWith("http")) {
    return `${apiBase.replace(/\/$/, "")}/news`;
  }
  const safeBase = baseUrl.replace(/\/$/, "");
  return `${safeBase}${apiBase}/news`;
};

const resolveNewsUrl = (baseUrl, news) => {
  const safeBase = baseUrl.replace(/\/$/, "");
  const pathPart = buildNewsPath(news);
  return `${safeBase}${pathPart}`;
};

const buildArticleHeadTags = ({
  baseUrl,
  news,
  imageUrl = "",
  siteName = SITE_NAME,
}) => {
  const title = resolveNewsTitle(news);
  const description = resolveNewsDescription(news);
  const articleUrl = resolveNewsUrl(baseUrl, news);
  const publishedRaw = resolveNewsDate(news);
  const publishedIso = publishedRaw ? new Date(publishedRaw).toISOString() : "";
  const twitterCard = imageUrl ? "summary_large_image" : "summary";

  const tags = [
    `<title>${escapeHtml(title)} | ${escapeHtml(siteName)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(articleUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(articleUrl)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`,
    `<meta name="twitter:card" content="${escapeHtml(twitterCard)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  ];

  if (imageUrl) {
    tags.push(`<meta property="og:image" content="${escapeHtml(imageUrl)}" />`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`);
  }

  if (publishedIso) {
    tags.push(
      `<meta property="article:published_time" content="${escapeHtml(publishedIso)}" />`
    );
  }

  return tags.join("\n    ");
};

const injectArticleMetadata = (html, metadata) => {
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:title"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:description"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:type"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:site_name"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:image"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:url"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="article:published_time"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:card"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:title"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:description"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:image"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "");

  return cleaned.replace("</head>", `    ${metadata}\n  </head>`);
};

const buildNewsSitemapXml = ({
  baseUrl,
  items,
  siteName = SITE_NAME,
  language = DEFAULT_LANG,
}) => {
  const urls = items
    .map((news) => {
      const title = resolveNewsTitle(news);
      const publishedRaw = resolveNewsDate(news);
      if (!publishedRaw) return null;
      const publishedDate = new Date(publishedRaw).toISOString();
      const loc = resolveNewsUrl(baseUrl, news);
      return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteName)}</news:name>
        <news:language>${escapeXml(language)}</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(publishedDate)}</news:publication_date>
      <news:title>${escapeXml(title)}</news:title>
    </news:news>
  </url>`;
    })
    .filter(Boolean)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;
};

const fetchNewsItems = async (apiUrl) => {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};

const resolveBuildNewsImage = async ({ outDir, baseUrl, news }) => {
  const source = resolveNewsImageSource(news);
  if (!source) return "";

  if (!source.startsWith("data:")) {
    return resolveAbsoluteUrl(baseUrl, source);
  }

  const parsed = parseImageDataUrl(source);
  if (!parsed) return "";

  const ext = imageExtensionFromMime(parsed.mimeType);
  const ogDir = path.join(outDir, "og-images");
  const fileName = `${sanitizeFileSegment(news?.id || news?._id || resolveNewsTitle(news))}-${sanitizeFileSegment(resolveNewsTitle(news)).slice(0, 80)}.${ext}`;
  const filePath = path.join(ogDir, fileName);

  await fs.mkdir(ogDir, { recursive: true });
  await fs.writeFile(filePath, Buffer.from(parsed.base64, "base64"));

  return `${baseUrl.replace(/\/$/, "")}/og-images/${fileName}`;
};

const writeArticlePages = async ({ outDir, baseUrl, items }) => {
  const indexPath = path.join(outDir, "index.html");
  let template = "";

  try {
    template = await fs.readFile(indexPath, "utf-8");
  } catch (error) {
    return;
  }

  await Promise.all(
    items.map(async (news) => {
      const newsPath = buildNewsPath(news);
      const relativeDir = newsPath.replace(/^\/+/, "");
      if (!relativeDir) return;

      const targetDir = path.join(outDir, relativeDir);
      const imageUrl = await resolveBuildNewsImage({ outDir, baseUrl, news });
      const metadata = buildArticleHeadTags({ baseUrl, news, imageUrl });
      const html = injectArticleMetadata(template, metadata);

      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(path.join(targetDir, "index.html"), html, "utf-8");
    })
  );
};

const sitemapPlugin = () => ({
  name: "news-sitemap",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url !== "/sitemap.xml") return next();
      const proto = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host || "localhost:5173";
      const baseUrl = `${proto}://${host}`;
      const apiUrl = resolveApiUrl(baseUrl);
      const newsItems = await fetchNewsItems(apiUrl);
      const latest = newsItems
        .sort((a, b) => new Date(resolveNewsDate(b) || 0) - new Date(resolveNewsDate(a) || 0))
        .slice(0, 100);
      const xml = buildNewsSitemapXml({ baseUrl, items: latest });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/xml");
      res.end(xml);
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url !== "/sitemap.xml") return next();
      const proto = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host || "localhost:4173";
      const baseUrl = `${proto}://${host}`;
      const apiUrl = resolveApiUrl(baseUrl);
      const newsItems = await fetchNewsItems(apiUrl);
      const latest = newsItems
        .sort((a, b) => new Date(resolveNewsDate(b) || 0) - new Date(resolveNewsDate(a) || 0))
        .slice(0, 100);
      const xml = buildNewsSitemapXml({ baseUrl, items: latest });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/xml");
      res.end(xml);
    });
  },
  async closeBundle() {
    const siteBaseUrl =
      process.env.SITE_BASE_URL ||
      process.env.VITE_SITE_BASE_URL ||
      "http://localhost:5173";
    const apiUrl = resolveApiUrl(siteBaseUrl);
    const newsItems = await fetchNewsItems(apiUrl);
    const latest = newsItems
      .sort((a, b) => new Date(resolveNewsDate(b) || 0) - new Date(resolveNewsDate(a) || 0))
      .slice(0, 100);
    const xml = buildNewsSitemapXml({ baseUrl: siteBaseUrl, items: latest });
    const outDir = path.resolve(process.cwd(), "build");
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, "sitemap.xml"), xml, "utf-8");
    await writeArticlePages({ outDir, baseUrl: siteBaseUrl, items: newsItems });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sitemapPlugin()],
  build: {
    outDir: "build",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
})
