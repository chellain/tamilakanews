import React from "react";
import { useSiteData } from "../../../context/SiteDataContext";
import { findLine } from "../../../context/layoutHelpers";

const PreviewEditableLine = ({
  catName,
  containerId,
  parentContainerId = null,
}) => {
  const { layout } = useSiteData();
  const lines = findLine({ layout, catName, containerId, parentContainerId });

  if (!lines.length) return null;

  return (

    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      {lines.map((line) => {
        const isHorizontal = line.orientation === "horizontal";
        const bg = line.lineType === "pink-bold" ? "#e91e63" : "#d0d0d0";
        const width = isHorizontal ? `${line.length}px` : "2px";
        const height = isHorizontal ? "2px" : `${line.length}px`;

        return (
          <div
            key={line.id}
            style={{
              position: "absolute",
              left: line.x,
              top: line.y,
              width,
              height,
              backgroundColor: bg,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        );
      })}
    </div>
  );
};

export default PreviewEditableLine;
