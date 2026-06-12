export const FRAME_WIDTH = 64;
export const FRAME_HEIGHT = 64;

function generateFrames(row, startCol, count) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    frames.push({ x: (startCol + i) * FRAME_WIDTH, y: row * FRAME_HEIGHT });
  }
  return frames;
}

export const ANIMATIONS = {
  // Idle (Frame 0 of Walk)
  idleUp: generateFrames(8, 0, 1),
  idleLeft: generateFrames(9, 0, 1),
  idleDown: generateFrames(10, 0, 1),
  idleRight: generateFrames(11, 0, 1),

  // Walk (Frames 1 to 8 of Walk)
  walkUp: generateFrames(8, 1, 8),
  walkLeft: generateFrames(9, 1, 8),
  walkDown: generateFrames(10, 1, 8),
  walkRight: generateFrames(11, 1, 8),

  // Attack (Slash)
  attackUp: generateFrames(12, 0, 6),
  attackLeft: generateFrames(13, 0, 6),
  attackDown: generateFrames(14, 0, 6),
  attackRight: generateFrames(15, 0, 6),

  // Jump
  jumpUp: generateFrames(26, 0, 5),
  jumpLeft: generateFrames(27, 0, 5),
  jumpDown: generateFrames(28, 0, 5),
  jumpRight: generateFrames(29, 0, 5),

  // Spellcast
  spellcastUp: generateFrames(0, 0, 7),
  spellcastLeft: generateFrames(1, 0, 7),
  spellcastDown: generateFrames(2, 0, 7),
  spellcastRight: generateFrames(3, 0, 7),

  // Thrust
  thrustUp: generateFrames(4, 0, 8),
  thrustLeft: generateFrames(5, 0, 8),
  thrustDown: generateFrames(6, 0, 8),
  thrustRight: generateFrames(7, 0, 8),

  // Shoot
  shootUp: generateFrames(16, 0, 13),
  shootLeft: generateFrames(17, 0, 13),
  shootDown: generateFrames(18, 0, 13),
  shootRight: generateFrames(19, 0, 13),

  // Hurt
  hurt: generateFrames(20, 0, 6),
};
