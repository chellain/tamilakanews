import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const ImageLoadContext = createContext(true);
export const useImageLoad = () => useContext(ImageLoadContext);

export function ImageLoadProvider({ canLoad = true, children }) {
  return (
    <ImageLoadContext.Provider value={canLoad}>
      {children}
    </ImageLoadContext.Provider>
  );
}

const PLACEHOLDER_SRC =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export default function LazyImage({
  src,
  alt = "",
  className,
  style,
  canLoad,
  lazy = true,
  eager = true,
  defer = true,
  onClick,
  onError,
}) {
  const imgRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [deferReady, setDeferReady] = useState(!defer);

  const contextCanLoad = useImageLoad();
  const allowLoad = canLoad ?? contextCanLoad;

  useEffect(() => {
    if (!defer) {
      setDeferReady(true);
      return;
    }
    let raf = null;
    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      raf = window.requestAnimationFrame(() => setDeferReady(true));
    } else {
      const timer = setTimeout(() => setDeferReady(true), 0);
      return () => clearTimeout(timer);
    }
    return () => {
      if (raf && typeof window !== "undefined" && window.cancelAnimationFrame) {
        window.cancelAnimationFrame(raf);
      }
    };
  }, [defer]);

  useEffect(() => {
    if (!allowLoad) return;
    const node = imgRef.current;
    if (!node) return;

    if (eager) {
      setInView(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [allowLoad]);

  const shouldLoad = allowLoad && inView && deferReady;
  const resolvedSrc = shouldLoad ? src : PLACEHOLDER_SRC;

  const handleLoad = (event) => {
    if (event?.currentTarget?.src === PLACEHOLDER_SRC) return;
    setLoaded(true);
  };

  return (
    <img
      ref={imgRef}
      src={resolvedSrc}
      alt={alt}
      className={`${className || ""} ${!loaded ? "lazy-img-skeleton" : ""}`.trim()}
      style={style}
      loading={eager ? "eager" : lazy ? "lazy" : undefined}
      decoding="async"
      onLoad={handleLoad}
      onClick={onClick}
      onError={onError}
    />
  );
}
