import React from "react";

/**
 * A MacBook drawn in CSS, lid open, with a 16:9 screen so a recording fills it exactly. Everything is
 * proportional to `width`, the lid's width. `macbook(width)` gives the screen's place, for pushing the
 * camera in until the screen fills the frame.
 */
export function macbook(width: number) {
  const bezel = width * 0.017;
  const screenWidth = width - bezel * 2;
  const screenHeight = (screenWidth * 9) / 16;
  const lidHeight = screenHeight + bezel * 2.2;
  const baseHeight = width * 0.032;
  return {
    width,
    bezel,
    screen: { x: bezel, y: bezel, width: screenWidth, height: screenHeight },
    lidHeight,
    baseHeight,
    height: lidHeight + baseHeight,
  };
}

export const MacBook: React.FC<{
  width: number;
  children: React.ReactNode;
  bodyOpacity?: number;
  /** The screen's corner radius, as a fraction of the usual (0 when the screen fills the frame). */
  screenRounding?: number;
}> = ({ width, children, bodyOpacity = 1, screenRounding = 1 }) => {
  const g = macbook(width);
  const baseOverhang = width * 0.07;
  return (
    <div style={{ position: "relative", width, height: g.height }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height: g.lidHeight,
          borderRadius: width * 0.026,
          background: "#0B0B0E",
          boxShadow: "inset 0 0 0 1.5px #3A3A42, 0 40px 90px rgba(40, 20, 90, 0.28)",
          opacity: bodyOpacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: g.screen.x,
          top: g.screen.y,
          width: g.screen.width,
          height: g.screen.height,
          borderRadius: width * 0.012 * screenRounding,
          overflow: "hidden",
          background: "#000",
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: g.screen.width * 0.11,
            height: g.screen.height * 0.034,
            transform: "translateX(-50%)",
            background: "#0B0B0E",
            borderBottomLeftRadius: width * 0.008,
            borderBottomRightRadius: width * 0.008,
            // Gone while the screen fills the frame, back as the camera pulls out.
            opacity: bodyOpacity * Math.min(1, screenRounding * 1.5),
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: -baseOverhang,
          top: g.lidHeight - 2,
          width: width + baseOverhang * 2,
          height: g.baseHeight,
          borderRadius: `2px 2px ${g.baseHeight * 0.9}px ${g.baseHeight * 0.9}px / 2px 2px ${g.baseHeight}px ${g.baseHeight}px`,
          background: "linear-gradient(180deg, #E4E4EA 0%, #B9B9C2 45%, #7D7D87 100%)",
          boxShadow: "0 18px 40px rgba(40, 20, 90, 0.22)",
          opacity: bodyOpacity,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: width * 0.16,
            height: g.baseHeight * 0.42,
            transform: "translateX(-50%)",
            borderBottomLeftRadius: g.baseHeight * 0.5,
            borderBottomRightRadius: g.baseHeight * 0.5,
            background: "linear-gradient(180deg, #9A9AA4, #C9C9D1)",
          }}
        />
      </div>
    </div>
  );
};
