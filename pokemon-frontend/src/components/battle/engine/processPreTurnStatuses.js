import { STATUS, VOLATILE_STATUS } from "../../../game/statusConditions";
import { createStatusBlockEvent, createTextEvent, createWaitEvent, createDamageEvent } from "../events/createEvent";
import { calculateDamage } from "../../../data/pokemon/battleHelpers";

/**
 * PURE FUNCTION
 * Processes pre-turn statuses like Paralysis, Sleep, Freeze, Confusion.
 * 
 * @param {Object} context - The battle context { queue, player, enemy, rng }
 * @param {Object} attacker - The pokemon attempting to attack
 * @param {String} targetTag - 'player' or 'enemy'
 * @returns {Boolean} true if the attack is blocked and turn skipped, false otherwise
 */
export function processPreTurnStatuses(context, attacker, targetTag) {
  const { queue, rng } = context;
  const status = attacker.status?.condition ?? null;

  if (!status) return false;

  if (status === STATUS.PARALYSIS) {
    // 25% chance to fail
    const roll = rng();
    if (roll < 0.25) {
      queue.push(createStatusBlockEvent(targetTag, STATUS.PARALYSIS));
      queue.push(createTextEvent(`${attacker.name} is fully paralyzed!`));
      queue.push(createWaitEvent(800));
      return true; // Blocked
    }
  }

  if (status === STATUS.SLEEP) {
    const turns = attacker.status?.turnsRemaining ?? 0;
    if (turns > 1) {
      // Still asleep
      attacker.status.turnsRemaining -= 1;
      queue.push(createStatusBlockEvent(targetTag, STATUS.SLEEP));
      queue.push(createTextEvent(`${attacker.name} is fast asleep!`));
      queue.push(createWaitEvent(800));
      return true; // Blocked
    } else {
      // Wakes up!
      attacker.status = null;
      queue.push(createTextEvent(`${attacker.name} woke up!`));
      queue.push(createWaitEvent(800));
      return false; // Can proceed with attack
    }
  }

  if (status === STATUS.FREEZE) {
    const roll = rng();
    if (roll < 0.2) {
      // 20% chance to thaw
      attacker.status = null;
      queue.push(createTextEvent(`${attacker.name} thawed out!`));
      queue.push(createWaitEvent(800));
      return false; // Can proceed
    } else {
      queue.push(createStatusBlockEvent(targetTag, STATUS.FREEZE));
      queue.push(createTextEvent(`${attacker.name} is frozen solid!`));
      queue.push(createWaitEvent(800));
      return true; // Blocked
    }
  }

  // Volatile statuses
  const volatileStatuses = attacker.volatileStatuses || [];
  
  // Find confusion
  const confusionIndex = volatileStatuses.findIndex(vs => vs.condition === VOLATILE_STATUS.CONFUSION);
  if (confusionIndex !== -1) {
    const confusion = volatileStatuses[confusionIndex];
    
    // Decrement turn
    confusion.turnsRemaining -= 1;
    
    if (confusion.turnsRemaining <= 0) {
      // Snaps out
      attacker.volatileStatuses.splice(confusionIndex, 1);
      queue.push(createTextEvent(`${attacker.name} snapped out of confusion!`));
      queue.push(createWaitEvent(800));
      // Does NOT block attack
    } else {
      queue.push(createTextEvent(`${attacker.name} is confused!`));
      queue.push(createWaitEvent(500));
      
      const roll = rng();
      if (roll < 0.33) {
        // Hit itself!
        queue.push(createTextEvent(`It hurt itself in its confusion!`));
        
        // Confusion damage is typeless physical 40 BP
        const mockMove = { power: 40, category: 'physical', type: null };
        const { damage } = calculateDamage(mockMove, attacker, attacker);
        
        const prevHp = attacker.currentHp;
        const newHp = Math.max(0, prevHp - damage);
        attacker.currentHp = newHp;
        
        queue.push(createDamageEvent({
          target: attackerTag,
          previousHp: prevHp,
          newHp: newHp,
        }));
        queue.push(createWaitEvent(800));
        
        // Faint check for hitting itself
        if (newHp <= 0) {
           return true; // blocked and potentially fainted (engine checks faint later)
        }
        
        return true; // Attack blocked
      }
    }
  }

  return false; // Can proceed with attack
}
