/**
 * RuntimeTrace — Centralized Telemetry Layer
 *
 * Collects all runtime diagnostic output into a structured, inspectable log.
 * Replaces scattered console.group / console.log / debugTrace.push calls.
 *
 * All engine systems should route diagnostics through this layer.
 * UI and presentation systems should NEVER write to RuntimeTrace.
 */
export class RuntimeTrace {
  constructor() {
    this._entries = [];
    this._tick = 0;
  }

  /**
   * Log entry into a phase group.
   * @param {string} phase - The phase name (e.g. "PRE_MOVE")
   */
  phaseStart(phase) {
    this._entries.push({ type: "PHASE_START", phase, timestamp: this._tick++ });
  }

  /**
   * Close a phase group.
   * @param {string} phase - The phase name
   */
  phaseEnd(phase) {
    this._entries.push({ type: "PHASE_END", phase, timestamp: this._tick++ });
  }

  /**
   * Log a reaction emission.
   * @param {string} source - The system that emitted (e.g. "SANDSTORM")
   * @param {string} originPhase - The phase during which emission occurred
   * @param {number} priority - The priority value
   */
  reaction(source, originPhase, priority) {
    this._entries.push({ type: "REACTION", source, originPhase, priority, timestamp: this._tick++ });
  }

  /**
   * Log a modifier application.
   * @param {string} source - The system that applied (e.g. "BLAZE")
   * @param {string} category - The modifier category (e.g. "power")
   * @param {number} value - The multiplier value
   */
  modifier(source, category, value) {
    this._entries.push({ type: "MODIFIER", source, category, value, timestamp: this._tick++ });
  }

  /**
   * Log a general engine event.
   * @param {string} message - The diagnostic message
   */
  log(message) {
    this._entries.push({ type: "LOG", message, timestamp: this._tick++ });
  }

  /**
   * Log a warning.
   * @param {string} message - The warning message
   */
  warn(message) {
    this._entries.push({ type: "WARN", message, timestamp: this._tick++ });
  }

  /** Returns the full structured trace log. */
  get entries() {
    return this._entries;
  }

  /** Dumps the trace to the browser console in a readable format. */
  dump() {
    for (const entry of this._entries) {
      switch (entry.type) {
        case "PHASE_START":
          console.group(`[PHASE] ${entry.phase}`);
          break;
        case "PHASE_END":
          console.groupEnd();
          break;
        case "REACTION":
          console.log(`  ⚡ Reaction (Source: ${entry.source} | Phase: ${entry.originPhase} | Priority: ${entry.priority})`);
          break;
        case "MODIFIER":
          console.log(`  🔧 Modifier (Source: ${entry.source} | ${entry.category}: ×${entry.value})`);
          break;
        case "WARN":
          console.warn(`  ⚠️ ${entry.message}`);
          break;
        case "LOG":
          console.log(`  ${entry.message}`);
          break;
        default:
          break;
      }
    }
  }
}
