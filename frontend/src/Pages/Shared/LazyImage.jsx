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
  onClick,
  onError,
}) {
  const imgRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const contextCanLoad = useImageLoad();
  const allowLoad = canLoad ?? contextCanLoad;

  useEffect(() => {
    if (!allowLoad) return;
    const node = imgRef.current;
    if (!node) return;

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

  const shouldLoad = allowLoad && inView;
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
      loading={lazy ? "lazy" : undefined}
      decoding="async"
      onLoad={handleLoad}
      onClick={onClick}
      onError={onError}
    />
  );
}
