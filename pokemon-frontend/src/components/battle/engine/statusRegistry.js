import { PERSISTENT_STATUSES } from "./registries/statuses/persistentStatuses";
import { VOLATILE_STATUSES } from "./registries/statuses/volatileStatuses";

/**
 * Status Effect Registry
 * 
 * Formalizes all legacy pre-turn and end-turn logic into pure phase hooks.
 * Aggregates modular persistent and volatile registries into a unified export.
 */
export const STATUS_EFFECTS = {
  ...PERSISTENT_STATUSES,
  ...VOLATILE_STATUSES
};
