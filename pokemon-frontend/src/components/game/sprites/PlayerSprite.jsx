import { forwardRef, useImperativeHandle, useRef, useMemo } from "react";
import { AnimationController } from "./AnimationController";
import { ANIMATIONS } from "./AnimationRegistry";

const PlayerSprite = forwardRef(function PlayerSprite(_props, ref) {
  const divRef = useRef(null);
  const lastDirectionRef = useRef("Down");

  const controller = useMemo(() => new AnimationController(ANIMATIONS), []);

  useImperativeHandle(ref, () => ({
    updateAnimation(dt, isMoving, facing) {
      // Update last known direction
      if (facing) lastDirectionRef.current = facing;

      const animName = isMoving && facing
        ? `walk${facing}`
        : `idle${lastDirectionRef.current}`;

      // Only restart animation if the name changed
      const changed = controller.currentAnimation !== animName;
      controller.changeAnimation(animName, {
        frameDuration: isMoving ? 100 : 300,
        loop: true,
        forceRestart: changed,
      });

      controller.update(dt);

      if (divRef.current) {
        const pos = controller.getCurrentFrameCSS();
        divRef.current.style.backgroundPosition = pos;
      }
    },
  }));

  return (
    <div
      ref={divRef}
      className="player-avatar"
      style={{
        backgroundImage: 'url("/assets/character-spritesheet.png")',
      }}
    />
  );
});

export default PlayerSprite;
