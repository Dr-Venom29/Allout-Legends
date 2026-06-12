export class InputManager {
  constructor() {
    this.keys = new Set();
    this.directionStack = [];
    this.isPaintMode = false;
    this.onAction = null; // Custom callback for non-movement actions (e.g. Paint, Save, Inventory)
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  attach(onActionCallback) {
    this.onAction = onActionCallback;
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  detach() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  handleKeyDown(e) {
    if (e.repeat) return;
    
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) {
      return;
    }

    // Pass specific non-movement keys to action handler
    const actionKeys = ["p", "[", "]", "s", "z", "x", "c", "i"];
    if (actionKeys.includes(e.key.toLowerCase())) {
      if (this.onAction) {
        this.onAction(e);
      }
      return;
    }

    const key = e.key;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(key.toLowerCase()) || ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
      e.preventDefault();
      this.keys.add(key);
      
      // Keep track of the order keys were pressed to prioritize the most recent direction
      if (!this.directionStack.includes(key)) {
        this.directionStack.push(key);
      }
    }
  }

  handleKeyUp(e) {
    const key = e.key;
    this.keys.delete(key);
    
    const index = this.directionStack.indexOf(key);
    if (index !== -1) {
      this.directionStack.splice(index, 1);
    }
  }

  getPrimaryDirection() {
    if (this.directionStack.length === 0) return null;
    return this.directionStack[this.directionStack.length - 1]; // Return the most recently pressed key
  }

  getMovementVector() {
    let dx = 0;
    let dy = 0;
    let isMoving = false;
    let facing = null;

    const primaryKey = this.getPrimaryDirection();
    
    if (!primaryKey) return { dx, dy, isMoving, facing };

    isMoving = true;

    // We only move in the primary axis to avoid diagonal sliding, keeping movement aligned to 4-way 
    // unless you want smooth diagonal physics. Since we have 4-way sprites, strictly moving 4-way feels better.
    if (primaryKey === "ArrowUp" || primaryKey === "w") {
      dy = -1;
      facing = "Up";
    } else if (primaryKey === "ArrowDown" || primaryKey === "s") {
      dy = 1;
      facing = "Down";
    } else if (primaryKey === "ArrowLeft" || primaryKey === "a") {
      dx = -1;
      facing = "Left";
    } else if (primaryKey === "ArrowRight" || primaryKey === "d") {
      dx = 1;
      facing = "Right";
    }

    return { dx, dy, isMoving, facing };
  }
}
