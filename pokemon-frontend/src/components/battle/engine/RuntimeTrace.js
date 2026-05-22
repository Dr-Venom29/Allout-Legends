export const TRACE_CATEGORIES = {
  PHASE: "PHASE",
  REACTION: "REACTION",
  MODIFIER: "MODIFIER",
  DAMAGE: "DAMAGE",
  RNG: "RNG",
  MUTATION: "MUTATION",
  LOG: "LOG",
  WARN: "WARN",
};

/**
 * RuntimeTrace — Centralized Telemetry Layer
 *
 * Collects all runtime diagnostic output into a structured, inspectable log.
 * Replaces scattered console.group / console.log calls.
 *
 * All engine systems should route diagnostics through this layer.
 * UI and presentation systems should NEVER write to RuntimeTrace.
 */
export class RuntimeTrace {
  constructor() {
    this._entries = [];
    this._tick = 0;
  }

  phaseStart(phase) {
    this._entries.push({ type: TRACE_CATEGORIES.PHASE, action: "START", phase, timestamp: this._tick++ });
  }

  phaseEnd(phase) {
    this._entries.push({ type: TRACE_CATEGORIES.PHASE, action: "END", phase, timestamp: this._tick++ });
  }

  reaction(source, originPhase, priority) {
    this._entries.push({ type: TRACE_CATEGORIES.REACTION, source, originPhase, priority, timestamp: this._tick++ });
  }

  modifier(source, category, value) {
    this._entries.push({ type: TRACE_CATEGORIES.MODIFIER, source, category, value, timestamp: this._tick++ });
  }

  rngRoll(source, roll) {
    this._entries.push({ type: TRACE_CATEGORIES.RNG, source, roll, timestamp: this._tick++ });
  }

  mutation(details) {
    this._entries.push({ type: TRACE_CATEGORIES.MUTATION, ...details, timestamp: this._tick++ });
  }

  damage(details) {
    this._entries.push({ type: TRACE_CATEGORIES.DAMAGE, ...details, timestamp: this._tick++ });
  }

  log(message) {
    this._entries.push({ type: TRACE_CATEGORIES.LOG, message, timestamp: this._tick++ });
  }

  warn(message) {
    this._entries.push({ type: TRACE_CATEGORIES.WARN, message, timestamp: this._tick++ });
  }

  get entries() {
    return this._entries;
  }

  export() {
    return JSON.stringify(this._entries, null, 2);
  }

  dump() {
    for (const entry of this._entries) {
      switch (entry.type) {
        case TRACE_CATEGORIES.PHASE:
          if (entry.action === "START") console.group(`[PHASE] ${entry.phase}`);
          if (entry.action === "END") console.groupEnd();
          break;
        case TRACE_CATEGORIES.REACTION:
          console.log(`  ⚡ Reaction (Source: ${entry.source} | Phase: ${entry.originPhase} | Priority: ${entry.priority})`);
          break;
        case TRACE_CATEGORIES.MODIFIER:
          console.log(`  🔧 Modifier (Source: ${entry.source} | ${entry.category}: ×${entry.value})`);
          break;
        case TRACE_CATEGORIES.RNG:
          console.log(`  🎲 RNG Roll (${entry.source}): ${entry.roll.toFixed(4)}`);
          break;
        case TRACE_CATEGORIES.MUTATION:
          console.log(`  🧬 Mutation [${entry.mutationType}] (Target: ${entry.targetTag} | Details: ${JSON.stringify(entry.payload)})`);
          break;
        case TRACE_CATEGORIES.DAMAGE:
          console.log(`  💥 Damage Evaluated (Target: ${entry.targetTag} | Amount: ${entry.amount} | Reason: ${entry.reason})`);
          break;
        case TRACE_CATEGORIES.WARN:
          console.warn(`  ⚠️ ${entry.message}`);
          break;
        case TRACE_CATEGORIES.LOG:
          console.log(`  ${entry.message}`);
          break;
        default:
          break;
      }
    }
  }

    /**
     * Generic structured emit for arbitrary trace entries.
     * Accepts a plain object and appends a timestamp.
     */
    emit(entry) {
      if (!entry || typeof entry !== "object") return;
      this._entries.push({ ...entry, timestamp: this._tick++ });
    }
}
