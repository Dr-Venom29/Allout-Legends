export class AnimationController {
  constructor(registry) {
    this.registry = registry;
    this.currentAnimation = null;
    this.frames = [];
    this.currentFrameIndex = 0;
    this.isPlaying = false;
    this.timeAccumulator = 0;
    this.frameDuration = 100; // ms per frame
    this.loop = true;
    this.onComplete = null;
  }

  play(animationName, options = {}) {
    if (this.currentAnimation === animationName && this.isPlaying) {
      // If we are already playing this animation and looping, do nothing, unless explicitly forced
      if (!options.forceRestart) return;
    }

    const frames = this.registry[animationName];
    if (!frames || frames.length === 0) {
      console.warn(`Animation "${animationName}" not found in registry.`);
      return;
    }

    this.currentAnimation = animationName;
    this.frames = frames;
    this.currentFrameIndex = 0;
    this.isPlaying = true;
    this.timeAccumulator = 0;
    
    this.frameDuration = options.frameDuration ?? 100;
    this.loop = options.loop ?? true;
    this.onComplete = options.onComplete ?? null;
  }

  stop() {
    this.isPlaying = false;
    this.currentFrameIndex = 0;
    this.timeAccumulator = 0;
  }

  reset() {
    this.currentFrameIndex = 0;
    this.timeAccumulator = 0;
  }

  changeAnimation(animationName, options = {}) {
    this.play(animationName, options);
  }

  update(deltaTime) {
    if (!this.isPlaying || this.frames.length === 0) return;

    this.timeAccumulator += deltaTime;

    if (this.timeAccumulator >= this.frameDuration) {
      // Advance frame
      const framesToAdvance = Math.floor(this.timeAccumulator / this.frameDuration);
      this.timeAccumulator = this.timeAccumulator % this.frameDuration;

      this.currentFrameIndex += framesToAdvance;

      if (this.currentFrameIndex >= this.frames.length) {
        if (this.loop) {
          this.currentFrameIndex = this.currentFrameIndex % this.frames.length;
        } else {
          this.currentFrameIndex = this.frames.length - 1;
          this.isPlaying = false;
          if (this.onComplete) {
            this.onComplete();
          }
        }
      }
    }
  }

  getCurrentFrameCSS() {
    if (this.frames.length === 0) return "0px 0px";
    const frame = this.frames[this.currentFrameIndex];
    return `-${frame.x}px -${frame.y}px`;
  }
}
