import { PHASES, PRIORITY } from "./triggerPhases";
import { applyDamage, DAMAGE_REASONS } from "./applyDamage";

export const WEATHER_TYPES = {
  NONE: "NONE",
  SANDSTORM: "SANDSTORM",
  HAIL: "HAIL",
  RAIN: "RAIN",
  SUN: "SUN",
};

/**
 * Weather Registry
 * 
 * Maps specific weather types to phase hooks.
 * All effect resolution must be synchronous and emit reactions to the context.
 */
export const WEATHER_EFFECTS = {
  
  [WEATHER_TYPES.SANDSTORM]: {
    [PHASES.TURN_END]: (context) => {
      const { playerPokemon, enemy } = context.state;
      const events = [];

      // Check player
      if (!isImmuneToSandstorm(playerPokemon)) {
        const damage = Math.max(1, Math.floor(playerPokemon.maxHp / 16));
        events.push(...applyDamage({
          context,
          target: playerPokemon,
          targetTag: "player",
          amount: damage,
          reason: DAMAGE_REASONS.WEATHER,
          message: `${playerPokemon.name} is buffeted by the sandstorm!`
        }));
      }

      // Check enemy
      if (!isImmuneToSandstorm(enemy)) {
        const damage = Math.max(1, Math.floor(enemy.maxHp / 16));
        events.push(...applyDamage({
          context,
          target: enemy,
          targetTag: "enemy",
          amount: damage,
          reason: DAMAGE_REASONS.WEATHER,
          message: `${enemy.name} is buffeted by the sandstorm!`
        }));
      }

      if (events.length > 0) {
        context.emitReaction({
          priority: PRIORITY.WEATHER,
          source: WEATHER_TYPES.SANDSTORM,
          originPhase: PHASES.TURN_END,
          events,
        });
      }
    },
  },

  [WEATHER_TYPES.HAIL]: {
    [PHASES.TURN_END]: (context) => {
      const { playerPokemon, enemy } = context.state;
      const events = [];

      if (!isImmuneToHail(playerPokemon)) {
        const damage = Math.max(1, Math.floor(playerPokemon.maxHp / 16));
        events.push(...applyDamage({
          context,
          target: playerPokemon,
          targetTag: "player",
          amount: damage,
          reason: DAMAGE_REASONS.WEATHER,
          message: `${playerPokemon.name} is pelted by hail!`
        }));
      }

      if (!isImmuneToHail(enemy)) {
        const damage = Math.max(1, Math.floor(enemy.maxHp / 16));
        events.push(...applyDamage({
          context,
          target: enemy,
          targetTag: "enemy",
          amount: damage,
          reason: DAMAGE_REASONS.WEATHER,
          message: `${enemy.name} is pelted by hail!`
        }));
      }

      if (events.length > 0) {
        context.emitReaction({
          priority: PRIORITY.WEATHER,
          source: WEATHER_TYPES.HAIL,
          originPhase: PHASES.TURN_END,
          events,
        });
      }
    },
  },

  [WEATHER_TYPES.RAIN]: {
    [PHASES.ON_DAMAGE]: (context, phaseContext) => {
      if (phaseContext.move.type === "Water") {
        context.modifiers.power.push({ source: WEATHER_TYPES.RAIN, multiplier: 1.5 });
      } else if (phaseContext.move.type === "Fire") {
        context.modifiers.power.push({ source: WEATHER_TYPES.RAIN, multiplier: 0.5 });
      }
    }
  },

  [WEATHER_TYPES.SUN]: {
    [PHASES.ON_DAMAGE]: (context, phaseContext) => {
      if (phaseContext.move.type === "Fire") {
        context.modifiers.power.push({ source: WEATHER_TYPES.SUN, multiplier: 1.5 });
      } else if (phaseContext.move.type === "Water") {
        context.modifiers.power.push({ source: WEATHER_TYPES.SUN, multiplier: 0.5 });
      }
    }
  }

};

function isImmuneToSandstorm(pokemon) {
  return pokemon.types.includes("Rock") || pokemon.types.includes("Ground") || pokemon.types.includes("Steel");
}

function isImmuneToHail(pokemon) {
  return pokemon.types.includes("Ice");
}
