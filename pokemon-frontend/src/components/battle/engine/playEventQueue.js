import { BATTLE_EVENTS } from "../events/eventTypes";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a generated event queue by calling specific UI update callbacks
 * Supports pausing and resuming for interactive events.
 * 
 * @param {Array} queue - The ordered events array
 * @param {Number} startIndex - The index to resume playback from
 * @param {Object} callbacks - UI state setters (setMessage, setPlayerHp, etc)
 * @returns {Promise<Object>} { completed: boolean }
 */
export async function playEventQueue(queue, startIndex, callbacks) {
  const {
    setMessage,
    setPlayerHp,
    setEnemyHp,
    onFaint,
    onEndBattle,
    onPause, // Called when playback needs to pause for user input
    setExpBar, // For animating EXP
    onLevelUp,
    onStatUpdate,
    onEvolutionStart,
    onEvolutionComplete,
  } = callbacks;

  for (let i = startIndex; i < queue.length; i++) {
    const event = queue[i];
    switch (event.type) {
      case BATTLE_EVENTS.TEXT:
        setMessage(event.message);
        break;

      case BATTLE_EVENTS.WAIT:
        await sleep(event.duration);
        break;

      case BATTLE_EVENTS.DAMAGE:
      case BATTLE_EVENTS.STATUS_TICK:
        // Update HP bar in the UI
        if (event.target === "enemy") {
          setEnemyHp(event.newHp);
        } else {
          setPlayerHp(event.newHp);
        }
        break;

      case BATTLE_EVENTS.STATUS_BLOCK:
      case BATTLE_EVENTS.STATUS_CURE:
        // Currently visual-only via text events that accompany them,
        // but could trigger specific visual shakes or particle effects later.
        break;

      case BATTLE_EVENTS.FAINT:
        onFaint(event.target);
        break;

      case BATTLE_EVENTS.END_BATTLE:
        onEndBattle(event.reason);
        break;

      case BATTLE_EVENTS.EXP_GAIN:
        if (setExpBar) setExpBar(event.amount);
        break;

      case BATTLE_EVENTS.LEVEL_UP:
        if (onLevelUp) onLevelUp(event.newLevel);
        break;

      case BATTLE_EVENTS.STAT_UPDATE:
        if (onStatUpdate) onStatUpdate(event.stats);
        break;

      case BATTLE_EVENTS.EVOLUTION_START:
        if (onEvolutionStart) onEvolutionStart(event.currentSpecies, event.newSpecies);
        break;

      case BATTLE_EVENTS.EVOLUTION_COMPLETE:
        if (onEvolutionComplete) onEvolutionComplete(event.newSpecies);
        break;

      case BATTLE_EVENTS.MOVE_LEARN_REQUEST:
        // PAUSE THE QUEUE
        if (onPause) {
          onPause({
            reason: "MOVE_LEARN",
            data: event,
            nextIndex: i + 1,
          });
        }
        return { completed: false };

      default:
        console.warn("Unknown event type played:", event.type);
    }
  }

  return { completed: true };
}
