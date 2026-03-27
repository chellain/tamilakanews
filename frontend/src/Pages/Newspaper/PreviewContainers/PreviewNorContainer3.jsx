import { useNavigate } from "react-router-dom";
import timeFun from "../Containers_/timeFun";
import { useSiteData } from "../../../context/SiteDataContext";
import jwt from "../../../assets/jwt.jpg";
import LazyImage from "../../Shared/LazyImage";
import { buildNewsPath } from "../../../utils/paths";

const PreviewNorContainer3 = ({ newsId, version = 1, showSeparator = false }) => {
  const navigate = useNavigate();
  const { allNews, translatedNews, language } = useSiteData();
  const newsSource = language === "en" ? translatedNews : allNews;
  const news = newsSource.find((n) => n.id === newsId);

  const DEFAULT_DATA = {
    image: jwt,
    headline: "Breaking News Headline Comes Here",
    content: "This is a short description of the news. Drop a news card to replace this content.",
    time: "Just now",
  };

  const formatTime = (timestamp) => timeFun(timestamp);

  const renderData = news
    ? {
        image: (() => {
          const thumb = news.data?.thumbnail;
          if (!thumb) return DEFAULT_DATA.image;
          if (typeof thumb === "string") return thumb;
          if (thumb instanceof File) return URL.createObjectURL(thumb);
          return DEFAULT_DATA.image;
        })(),
        headline: news.data?.headline || DEFAULT_DATA.headline,
        content: news.data?.oneLiner || DEFAULT_DATA.content,
        time: formatTime(news.time || news.createdAt || news.updatedAt) || DEFAULT_DATA.time,
      }
    : DEFAULT_DATA;

  const handleNavigate = () => {
    if (!newsId) return;
    navigate(buildNewsPath(news || newsId, renderData.headline));
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        className={version === 1 ? "preview-nm-news-5" : "preview-nm-news-6"}
        onClick={handleNavigate}
        style={{ cursor: "pointer" }}
      >
        {version === 1 && (
          <>
            <div className="preview-epnn5-img">
              <LazyImage src={renderData.image} alt="" />
            </div>
            <div className="preview-nm5-sbc">
              <div className="preview-epbn5-hdln">{renderData.headline}</div>
              <div className="preview-epnn5-tm">{renderData.time}</div>
            </div>
          </>
        )}

        {version === 2 && (
          <>
            <div className="preview-nm6-sbc">
              <div className="preview-epbn6-hdln">{renderData.headline}</div>
              <div className="preview-epbn6-tm">{renderData.time}</div>
            </div>
            <div className="preview-epnn6-img">
              <LazyImage src={renderData.image} alt="" />
            </div>
          </>
        )}
      </div>

      {showSeparator && <div className="separator-line" />}
    </div>
  );
};

export default PreviewNorContainer3;


