import { useNavigate } from "react-router-dom";
import timeFun from "../Containers_/timeFun";
import { useSiteData } from "../../../context/SiteDataContext";
import jwt from "../../../assets/jwt.png";
import LazyImage from "../../Shared/LazyImage";
import { buildNewsPath } from "../../../utils/paths";

const PreviewBigContainer2 = ({
  newsId,
  version = 1,
  showSeparator = false,
}) => {
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
      <div className="preview-bg-news-2" onClick={handleNavigate}>
        {version === 1 && (
          <>
            <div className="preview-epbn2-img"><LazyImage src={renderData.image} alt="" /></div>
            <div className="preview-epbn2-content">
              <div className="preview-epbn2-hdln">{renderData.headline}</div>
              <div className="preview-epbn2-onln">{renderData.content}</div>
              <div className="preview-epbn2-tm">{renderData.time}</div>
            </div>
          </>
        )}

        {version === 2 && (
          <>
            <div className="preview-epbn2-content">
              <div className="preview-epbn2-hdln">{renderData.headline}</div>
              <div className="preview-epbn2-onln">{renderData.content}</div>
              <div className="preview-epbn2-tm">{renderData.time}</div>
            </div>
            <div className="preview-epbn2-img"><LazyImage src={renderData.image} alt="" /></div>
          </>
        )}
      </div>
      {showSeparator && <div className="separator-line"></div>}
    </div>
  );
};

export default PreviewBigContainer2;


