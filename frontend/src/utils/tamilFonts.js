import font1Url from "../assets/Fonts/font_1.TTF";
import font2Url from "../assets/Fonts/font_2.ttf";
import font3Url from "../assets/Fonts/font_3.TTF";
import font4Url from "../assets/Fonts/font_4.TTF";

export const DEFAULT_TAMIL_FONT = "default";

const FALLBACK_TAMIL_STACK = `"Noto Sans Tamil", "Latha", "Nirmala UI", sans-serif`;
const TAMIL_UNICODE_PATTERN = /[\u0B80-\u0BFF]/;
const LEGACY_APPLIED_ATTR = "data-tamilaka-legacy-font";
const ORIGINAL_FONT_ATTR = "data-tamilaka-original-font-family";

export const TAMIL_FONT_OPTIONS = [
  {
    id: DEFAULT_TAMIL_FONT,
    label: "Default Font",
    family: "Noto Sans Tamil",
    description: "Use the website's existing Tamil font stack.",
  },
  {
    id: "font_1",
    label: "Font 1",
    family: "TamilakaCustomFont1",
    legacyFamily: "TamilakaLegacyPreviewFont1",
    url: font1Url,
    description: "Custom Tamil font from font_1.ttf.",
  },
  {
    id: "font_2",
    label: "Font 2",
    family: "TamilakaCustomFont2",
    legacyFamily: "TamilakaLegacyPreviewFont2",
    url: font2Url,
    description: "Custom Tamil font from font_2.ttf.",
  },
  {
    id: "font_3",
    label: "Font 3",
    family: "TamilakaCustomFont3",
    legacyFamily: "TamilakaLegacyPreviewFont3",
    url: font3Url,
    description: "Custom Tamil font from font_3.ttf.",
  },
  {
    id: "font_4",
    label: "Font 4",
    family: "TamilakaCustomFont4",
    legacyFamily: "TamilakaLegacyPreviewFont4",
    url: font4Url,
    description: "Custom Tamil font from font_4.ttf.",
  },
];

export const normalizeTamilFontId = (fontId) =>
  TAMIL_FONT_OPTIONS.some((font) => font.id === fontId)
    ? fontId
    : DEFAULT_TAMIL_FONT;

export const getTamilFontFamily = (fontId) => {
  const safeFontId = normalizeTamilFontId(fontId);
  const selected = TAMIL_FONT_OPTIONS.find((font) => font.id === safeFontId);

  if (!selected || selected.id === DEFAULT_TAMIL_FONT) {
    return FALLBACK_TAMIL_STACK;
  }

  return `"${selected.family}", ${FALLBACK_TAMIL_STACK}`;
};

export const getTamilLegacyPreviewFamily = (fontId) => {
  const safeFontId = normalizeTamilFontId(fontId);
  const selected = TAMIL_FONT_OPTIONS.find((font) => font.id === safeFontId);

  if (!selected?.legacyFamily) {
    return FALLBACK_TAMIL_STACK;
  }

  return `"${selected.legacyFamily}", ${FALLBACK_TAMIL_STACK}`;
};

const independentVowels = {
  அ: "m",
  ஆ: "M",
  இ: ",",
  ஈ: "<",
  உ: "c",
  ஊ: "C",
  எ: "v",
  ஏ: "V",
  ஐ: "I",
  ஒ: "x",
  ஓ: "X",
  ஔ: "xs",
};

const consonants = {
  க: "f",
  ங: "q",
  ச: "r",
  ஜ: "[",
  ஞ: "Q",
  ட: "l",
  ண: "z",
  த: "j",
  ந: "e",
  ன: "d",
  ப: "g",
  ம: "k",
  ய: "a",
  ர: "u",
  ல: "y",
  வ: "t",
  ழ: "o",
  ள: "s",
  ற: "w",
  ஷ: "\\",
  ஸ: "]",
  ஹ: "`",
};

const vowelSigns = {
  "\u0BBE": (base) => `${base}h`,
  "\u0BBF": (base) => `${base}p`,
  "\u0BC0": (base) => `${base}P`,
  "\u0BC1": (base) => `${base}{`,
  "\u0BC2": (base) => `${base}`,
  "\u0BC6": (base) => `n${base}`,
  "\u0BC7": (base) => `N${base}`,
  "\u0BC8": (base) => `i${base}`,
  "\u0BCA": (base) => `n${base}h`,
  "\u0BCB": (base) => `N${base}h`,
  "\u0BCC": (base) => `n${base}s`,
};

export const isCustomTamilFont = (fontId) =>
  normalizeTamilFontId(fontId) !== DEFAULT_TAMIL_FONT;

export const tamilUnicodeToLegacy = (value = "") => {
  let output = "";
  const chars = Array.from(String(value));

  for (let index = 0; index < chars.length; index += 1) {
    const current = chars[index];

    if (independentVowels[current]) {
      output += independentVowels[current];
      continue;
    }

    if (current === "ஃ") {
      output += "/";
      continue;
    }

    if (!consonants[current]) {
      output += current;
      continue;
    }

    const base = consonants[current];
    const next = chars[index + 1];

    if (next === "\u0BCD") {
      output += `${base};`;
      index += 1;
      continue;
    }

    if (vowelSigns[next]) {
      output += vowelSigns[next](base);
      index += 1;
      continue;
    }

    output += base;
  }

  return output;
};

export const getTamilTextRenderProps = (fontId, text) => {
  if (!isCustomTamilFont(fontId) || !TAMIL_UNICODE_PATTERN.test(String(text))) {
    return { text, style: { fontFamily: getTamilFontFamily(fontId) } };
  }

  return {
    text: tamilUnicodeToLegacy(text),
    style: { fontFamily: getTamilLegacyPreviewFamily(fontId) },
  };
};

export const ensureTamilFontFaces = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById("tamilaka-custom-font-faces")) return;

  const style = document.createElement("style");
  style.id = "tamilaka-custom-font-faces";
  style.textContent = TAMIL_FONT_OPTIONS
    .filter((font) => font.url)
    .map(
      (font) => `
@font-face {
  font-family: "${font.family}";
  src: url("${font.url}") format("truetype");
  font-display: swap;
  unicode-range: U+0B80-0BFF;
}

@font-face {
  font-family: "${font.legacyFamily}";
  src: url("${font.url}") format("truetype");
  font-display: swap;
}`
    )
    .join("\n");

  document.head.appendChild(style);
};

const shouldSkipNode = (node) => {
  const element = node?.parentElement;
  if (!element) return true;
  return Boolean(
    element.closest(
      "script, style, textarea, input, select, option, code, pre, [data-tamilaka-font-skip]"
    )
  );
};

const restoreLegacyText = (root) => {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    if (node.__tamilakaOriginalText != null) {
      node.textContent = node.__tamilakaOriginalText;
      delete node.__tamilakaOriginalText;
    }
    node = walker.nextNode();
  }

  root.querySelectorAll(`[${LEGACY_APPLIED_ATTR}]`).forEach((element) => {
    const originalFont = element.getAttribute(ORIGINAL_FONT_ATTR);
    if (originalFont == null) {
      element.style.fontFamily = "";
    } else {
      element.style.fontFamily = originalFont;
    }
    element.removeAttribute(LEGACY_APPLIED_ATTR);
    element.removeAttribute(ORIGINAL_FONT_ATTR);
  });
};

export const applyTamilFontToElement = (root, fontId) => {
  if (typeof document === "undefined" || !root) return () => {};

  ensureTamilFontFaces();
  restoreLegacyText(root);

  if (!isCustomTamilFont(fontId)) {
    return () => {};
  }

  const legacyFamily = getTamilLegacyPreviewFamily(fontId);
  let isApplying = false;

  const convertTextNodes = () => {
    if (isApplying) return;
    isApplying = true;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node) {
      if (!shouldSkipNode(node) && TAMIL_UNICODE_PATTERN.test(node.textContent || "")) {
        if (node.__tamilakaOriginalText == null) {
          node.__tamilakaOriginalText = node.textContent;
        }

        node.textContent = tamilUnicodeToLegacy(node.__tamilakaOriginalText);

        const parent = node.parentElement;
        if (parent && !parent.hasAttribute(LEGACY_APPLIED_ATTR)) {
          parent.setAttribute(ORIGINAL_FONT_ATTR, parent.style.fontFamily || "");
          parent.setAttribute(LEGACY_APPLIED_ATTR, "true");
        }
        if (parent) parent.style.fontFamily = legacyFamily;
      }

      node = walker.nextNode();
    }

    isApplying = false;
  };

  convertTextNodes();

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(convertTextNodes);
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return () => {
    observer.disconnect();
    restoreLegacyText(root);
  };
};
