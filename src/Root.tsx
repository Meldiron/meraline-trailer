import React from "react";
import { Composition, Still } from "remotion";
import { FPS, HEIGHT, SCREEN, WIDTH } from "./config";
import { NightSky } from "./components/Backdrop";
import { sec } from "./lib/anim";
import { Promo, SceneView, timeline } from "./Promo";
import { scenes } from "./scenes";
import { DESKTOP_SCALE, MessyDesktop } from "./stills/MessyDesktop";

/** The night sky for the whole screen at 2x, shown behind the app while the clips are recorded. */
const BackdropStill: React.FC = () => <NightSky scale={2} />;

export const Root: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={timeline.total} fps={FPS} width={WIDTH} height={HEIGHT} />
    {scenes.map((spec) => (
      <Composition
        key={spec.id}
        id={`scene-${spec.id}`}
        component={SceneView}
        defaultProps={{ spec }}
        durationInFrames={sec(spec.duration)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    ))}
    <Still id="BackdropStill" component={BackdropStill} width={SCREEN.width * 2} height={SCREEN.height * 2} />
    {/* The messy desktop behind the screen-awareness clip, and the screenshot the promo build attaches. */}
    <Still id="DesktopStill" component={MessyDesktop} width={SCREEN.width * DESKTOP_SCALE} height={SCREEN.height * DESKTOP_SCALE} />
  </>
);
