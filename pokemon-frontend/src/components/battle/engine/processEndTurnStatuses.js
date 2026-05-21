import { STATUS } from "../../../game/statusConditions";
import { createStatusTickEvent, createTextEvent, createWaitEvent, createFaintEvent, createEndBattleEvent } from "../events/createEvent";

/**
 * PURE FUNCTION
 * Processes end-of-turn statuses like Poison and Burn damage ticks.
 * 
 * @param {Object} context - The battle context { queue, player, enemy, rng }
 */
export function processEndTurnStatuses(context) {
  const { queue, player, enemy } = context;

  const handleEndTurnTick = (combatant, targetTag) => {
    if (combatant.currentHp <= 0) return; // Already fainted

    const status = combatant.status?.condition ?? null;
    if (!status) return;

    const maxHp = combatant.maxHp;

    if (status === STATUS.POISON) {
      const damage = Math.max(1, Math.floor(maxHp / 8));
      const prevHp = combatant.currentHp;
      const newHp = Math.max(0, prevHp - damage);
      combatant.currentHp = newHp;
      
      queue.push(createStatusTickEvent(targetTag, STATUS.POISON, damage, newHp));
      queue.push(createTextEvent(`${combatant.name} is hurt by poison!`));
      queue.push(createWaitEvent(800));
    }

    if (status === STATUS.BURN) {
      const damage = Math.max(1, Math.floor(maxHp / 16));
      const prevHp = combatant.currentHp;
      const newHp = Math.max(0, prevHp - damage);
      combatant.currentHp = newHp;

      queue.push(createStatusTickEvent(targetTag, STATUS.BURN, damage, newHp));
      queue.push(createTextEvent(`${combatant.name} is hurt by its burn!`));
      queue.push(createWaitEvent(800));
    }

  handleEndTurnTick(player, "player");
  handleEndTurnTick(enemy, "enemy");
}
