import { COMMANDS } from "./presentationCommands";

/**
 * Validates the structure of a Presentation Command.
 * Ensures the command conforms to the { type, payload } schema and is serializable.
 * 
 * @param {Object} command - The command to validate
 * @throws {Error} If the command is malformed
 */
export function assertCommandShape(command) {
  if (!command || typeof command !== "object") {
    throw new Error(`[Command Validation] Command is not an object: ${command}`);
  }

  if (typeof command.type !== "string" || !Object.values(COMMANDS).includes(command.type)) {
    throw new Error(`[Command Validation] Command missing valid 'type': ${JSON.stringify(command)}`);
  }

  // Enforce pure serializable payload recursively
  if (command.payload !== undefined) {
    if (typeof command.payload !== "object" || command.payload === null) {
        throw new Error(`[Command Validation] Command payload must be a pure object: ${JSON.stringify(command)}`);
    }
    
    function checkSerializable(obj, path = "payload") {
      for (const key in obj) {
        const val = obj[key];
        if (typeof val === "function") {
          throw new Error(`[Command Validation] Command payload cannot contain functions. Must be serializable. Failed at: ${path}.${key}`);
        } else if (val !== null && typeof val === "object") {
          checkSerializable(val, `${path}.${key}`);
        }
      }
    }
    
    checkSerializable(command.payload);
  }
}
