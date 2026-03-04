import React, { useMemo } from 'react'
import Line from './Line'
import logo from "../../../assets/logo1.png";
import { RiTwitterXLine } from "react-icons/ri";
import { RiInstagramFill } from "react-icons/ri";
import { FaYoutube } from "react-icons/fa";
import { useSiteData } from "../../../context/SiteDataContext";
import { useNavigate } from "react-router-dom";

export default function Footer({ onNavigatePage }) {
  const navigate = useNavigate();
  const { adminConfig, language } = useSiteData();
  const allPages = adminConfig?.allPages || [];

  const sectionPages = useMemo(() => {
    const filtered = allPages.filter((page) => {
      const hasName = Boolean(page?.name?.eng || page?.name?.tam);
      const isDistrictGroup = Boolean(page?.districts);
      const isSelectable = page?.name?.eng !== "Select District";
      const hasNavPos = page?.topnavpos !== null || page?.sidenavpos !== null;
      return hasName && !isDistrictGroup && isSelectable && hasNavPos;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aPos = a.topnavpos ?? a.sidenavpos ?? 999;
      const bPos = b.topnavpos ?? b.sidenavpos ?? 999;
      return aPos - bPos;
    });

    const seen = new Set();
    return sorted.filter((page) => {
      const key = String(page?.name?.eng || page?.name?.tam || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allPages]);

  const handleSectionClick = (page) => {
    const target = page?.name?.eng ? page.name.eng.toLowerCase() : null;
    if (!target) return;
    if (typeof onNavigatePage === "function") {
      onNavigatePage(target);
    }
    navigate("/Newspaper");
  };
  return (
    <div className='foot-con'>
    <Line direction="H" length="100%" thickness="2px" color="#e80d8c"/>
    <div className="foot-con-c1">
       <div className="foot-con-inn">
                                <div className="nav-c1-logo foot-logo" style={{position: "relative"}}>
                   <div className="nav-c1l-t1" > <img src={logo}/></div>
                   <div className="nav-c1l-t2" style={{position: "absolute", transform: "translateY(30px)"}}>நடுநிலை நாளிதழ்</div>
                </div>
       </div>
    <div className="foot-con-c11" style={{display: "flex", padding: "0px 150px",justifyContent: "space-between"}}>

    <div className="foot-con-c111">
            <div className="fcc111-1" style={{fontWeight: "bold"}}>Follow Us on</div>
        <div style={{display: "flex", gap: "20px"}}>
            <RiTwitterXLine />
            <RiInstagramFill />
            <FaYoutube />
        </div>
    </div>
        <div className="foot-con-c111">
            <div className="fcc111-1" style={{fontWeight: "bold"}}>Support</div>
        <div >
             <div>About Us</div>
             <div>Contact Us</div>
             <div>Authors </div>
             <div>Feed back </div>
        </div>
    </div>
            <div className="foot-con-c111">
            <div className="fcc111-1" style={{fontWeight: "bold"}}>Sections</div>
        <div className="foot-section-list">
             {sectionPages.length === 0 && (
               <div className="foot-section-empty">No sections available</div>
             )}
             {sectionPages.map((page) => (
               <div
                 key={page.id || page.name?.eng || page.name?.tam}
                 className="foot-section-link"
                 onClick={() => handleSectionClick(page)}
               >
                 {language === "ta" ? page.name?.tam : page.name?.eng}
               </div>
             ))}
        </div>
    </div>
    <div className="foot-con-c111">
            <div className="fcc111-1" style={{fontWeight: "bold"}}>Legal Terms</div>
        <div >
             <div>Terms of use</div>
              <div>privacy policy  </div>
               <div> cod of business  </div>
                <div> cookie policies </div>

        </div>
    </div>
        
    </div>            
    </div>
        <Line direction="H" length="100%" thickness="2px" color="#e80d8c"/>
        <div className="foot-cont-c113" style={{display: "flex", flexDirection: "column", alignItems: "center", fontWeight: "bold"}}>
            <div style={{color: "#e80d8c"}}> © {new Date().getFullYear()} Tamilaga News. All Rights Reserved.</div>
            <div> Designed & Developed by Tamilaga News Team</div>
        </div>
 
                    
    </div>
  )
}
