import { useNavigate } from "react-router-dom";
import timeFun from "../Containers_/timeFun";
import jwt from "../../../assets/jwt.jpg";
import { useSiteData } from "../../../context/SiteDataContext";
import { findSliderSlotItem, findSlotItem } from "../../../context/layoutHelpers";
import { useMobile } from "../Components2/PagePreview";
import LazyImage from "../../Shared/LazyImage";

const PreviewUniversalNewsContainer = ({
  catName,
  containerId,
  slotId,
  isSlider = false,
  isSlider2 = false,
  isNested = false,
  parentContainerId = null,
  sliderId = null,
}) => {
  const navigate = useNavigate();
  const { allNews, translatedNews, language, layout } = useSiteData();
  const isMobile = useMobile();

  const slot =
    (isSlider || isSlider2) && sliderId
      ? findSliderSlotItem({
          layout,
          catName,
          sliderId,
          slotId,
          isNested,
          parentContainerId,
          containerId,
        })
      : findSlotItem({
          layout,
          catName,
          containerId,
          slotId,
          isNested,
          parentContainerId,
        });

  // All values read from Redux slot
  const containerWidth  = slot?.dimensions?.containerWidth  ?? 400;
  const containerHeight = slot?.dimensions?.containerHeight ?? 300;
  const imgWidth        = slot?.dimensions?.imgWidth        ?? 400;
  const imgHeight       = slot?.dimensions?.imgHeight       ?? 300;
  const padding         = slot?.dimensions?.padding         ?? 10;
  const version         = slot?.shfval                      ?? 1;
  const showSeparator   = slot?.showSeparator               ?? false;

  const newsId = slot?.newsId;
  const newsSource = language === "en" ? translatedNews : allNews;
  const news   = newsSource.find((n) => n.id === newsId);

  const DEFAULT_DATA = {
    media:     jwt,
    mediaType: "image",
    headline:  "Breaking News Headline Comes Here",
    content:   "This is a short description of the news.",
    time:      "Just now",
  };

  const formatTime = (timestamp) => timeFun(timestamp);

  const renderData = news
    ? {
        media: (() => {
          const thumb = news.data?.thumbnail || news.data?.video;
          if (!thumb) return DEFAULT_DATA.media;
          if (typeof thumb === "string") return thumb;
          if (thumb instanceof File) return URL.createObjectURL(thumb);
          return DEFAULT_DATA.media;
        })(),
        mediaType: news.data?.video ? "video" : "image",
        headline:  news.data?.headline  || DEFAULT_DATA.headline,
        content:   news.data?.oneLiner  || DEFAULT_DATA.content,
        time:      formatTime(news.time || news.createdAt || news.updatedAt) || DEFAULT_DATA.time,
      }
    : DEFAULT_DATA;

  const handleNavigate = () => {
    if (!newsId) return;
    navigate(`/preview/${newsId}`);
  };

  const imageStyle = {
    width:        isMobile ? "100%" : `${imgWidth}px`,
    height:       isMobile ? "auto" : `${imgHeight}px`,
    borderRadius: "5px",
    overflow:     "hidden",
    flexShrink:   0,
    maxWidth:     "100%",
    aspectRatio:  isMobile && imgWidth && imgHeight ? `${imgWidth}/${imgHeight}` : undefined,
  };

  const headlineStyle = {
    fontSize:     "20px",
    fontWeight:   "bold",
  };

  const contentStyle = {
    fontSize:     "14px",

  };

  const timeStyle = {
    fontSize: "12px",
    color:    "gray",
  };

  const renderMedia = () => {
    if (renderData.mediaType === "video") {
      return (
        <video
          src={renderData.media}
          controls
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    }
    return (
      <LazyImage
        src={renderData.media}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  };

  const rowLayout = {
    display: "flex",
    gap: "15px",
    alignItems: "flex-start",
    flexDirection: isMobile ? "column" : "row",
  };

  const renderLayout = () => {
    switch (version) {
      case 1:
        return (
          <div style={{ display: "flex", flexDirection: "column",}}>
            <div style={headlineStyle}>{renderData.headline}</div>
            <div style={imageStyle}>{renderMedia()}</div>
            <div style={contentStyle}>{renderData.content}</div>
            <div style={timeStyle}>{renderData.time}</div>
          </div>
        );
      case 2:
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={headlineStyle}>{renderData.headline}</div>
            <div style={contentStyle}>{renderData.content}</div>
            <div style={timeStyle}>{renderData.time}</div>
            <div style={imageStyle}>{renderMedia()}</div>
          </div>
        );
      case 3:
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={imageStyle}>{renderMedia()}</div>
            <div style={headlineStyle}>{renderData.headline}</div>
            <div style={contentStyle}>{renderData.content}</div>
            <div style={timeStyle}>{renderData.time}</div>
          </div>
        );
      case 4:
        return (
          <div style={rowLayout}>
            <div style={imageStyle}>{renderMedia()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={headlineStyle}>{renderData.headline}</div>
              <div style={contentStyle}>{renderData.content}</div>
              <div style={timeStyle}>{renderData.time}</div>
            </div>
          </div>
        );
      case 5:
        return (
          <div style={rowLayout}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={headlineStyle}>{renderData.headline}</div>
              <div style={contentStyle}>{renderData.content}</div>
              <div style={timeStyle}>{renderData.time}</div>
            </div>
            <div style={imageStyle}>{renderMedia()}</div>
          </div>
        );
      case 6:
        return (
          <div style={rowLayout}>
            <div style={imageStyle}>{renderMedia()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={headlineStyle}>{renderData.headline}</div>
              <div style={timeStyle}>{renderData.time}</div>
            </div>
          </div>
        );
      case 7:
        return (
          <div style={rowLayout}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={headlineStyle}>{renderData.headline}</div>
              <div style={timeStyle}>{renderData.time}</div>
            </div>
            <div style={imageStyle}>{renderMedia()}</div>
          </div>
        );
      case 8:
        return (
          <div style={rowLayout}>
            <div style={imageStyle}>{renderMedia()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={contentStyle}>{renderData.content}</div>
              <div style={timeStyle}>{renderData.time}</div>
            </div>
          </div>
        );
      case 9:
        return (
          <div style={rowLayout}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={contentStyle}>{renderData.content}</div>
              <div style={timeStyle}>{renderData.time}</div>
            </div>
            <div style={imageStyle}>{renderMedia()}</div>
          </div>
        );
      case 10:
        return (
          <div>
            <div style={headlineStyle}>{renderData.headline}</div>
            <div style={timeStyle}>{renderData.time}</div>
          </div>
        );
      case 11:
        return (
          <div>
            <div style={contentStyle}>{renderData.content}</div>
            <div style={timeStyle}>{renderData.time}</div>
          </div>
        );
      case 12:
        return (
          <div>
            <div style={imageStyle}>{renderMedia()}</div>
            <div style={timeStyle}>{renderData.time}</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        className="preview-universal-container"
        onClick={handleNavigate}
        style={{
          width:      isMobile ? "100%" : (containerWidth  > 0 ? `${containerWidth}px`  : undefined),
          minHeight:  isMobile ? undefined : (containerHeight > 0 ? `${containerHeight}px` : undefined),
          padding:    `${padding}px`,
          cursor:     "pointer",
          transition: "0.3s ease-in-out",
          maxWidth:   "100%",
          boxSizing:  "border-box",
        }}
      >
        

        {renderLayout()}
      </div>

      {showSeparator && <div className="separator-line-universal"></div>}
    </div>
  );
};

export default PreviewUniversalNewsContainer;


