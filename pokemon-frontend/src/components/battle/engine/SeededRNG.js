/**
 * SeededRNG — Deterministic Pseudo-Random Number Generator
 *
 * Uses the Mulberry32 algorithm for fast, high-quality 32-bit PRNG.
 * All randomness in the battle engine MUST flow through this.
 *
 * Usage:
 *   const rng = new SeededRNG(12345);
 *   rng.next();    // 0.0 - 1.0, deterministic
 *   rng.next();    // next value in sequence
 *   rng.seed       // original seed for replay serialization
 */
export class SeededRNG {
  constructor(seed) {
    if (seed === undefined || seed === null) {
      throw new Error("[SeededRNG] A seed MUST be explicitly provided to guarantee deterministic execution.");
    }

    this._initialSeed = seed;
    this._state = seed >>> 0; // Ensure unsigned 32-bit integer
  }

  /**
   * Returns a deterministic float in [0, 1).
   * Identical to Math.random() interface but fully reproducible.
   */
  next() {
    // Mulberry32 algorithm
    let t = (this._state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** The original seed used to initialize this generator. */
  get seed() {
    return this._initialSeed;
  }

  /**
   * Creates a bound function matching Math.random() call signature.
   * Pass this to any function that accepts `rng = Math.random`.
   */
  bound() {
    return () => this.next();
  }
}
