import {Composition, Folder} from "remotion";
import {
  STANDX_PROMO_DURATION_IN_FRAMES,
  STANDX_PROMO_FPS,
  STANDX_PROMO_HEIGHT,
  STANDX_PROMO_WIDTH,
  StandxTwitterPromo
} from "./StandxTwitterPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="Marketing">
      <Composition
        id="StandXTwitterPromo"
        component={StandxTwitterPromo}
        durationInFrames={STANDX_PROMO_DURATION_IN_FRAMES}
        fps={STANDX_PROMO_FPS}
        width={STANDX_PROMO_WIDTH}
        height={STANDX_PROMO_HEIGHT}
      />
    </Folder>
  );
};
