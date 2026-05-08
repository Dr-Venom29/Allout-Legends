const MOVEMENT_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

export function setupKeyboard({
  paintMode,
  setPaintMode,
  handleSave,
  setSelectedTileId,
  handleMove,
  setPressedKey,
  TILESET_MAX_ID,
}) {
  const onKeyDown = (e) => {
    if (e.repeat) return;

    const tag = e.target.tagName;
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      e.target.isContentEditable
    ) {
      return;
    }

    const keyActions = {
      p: () => {
        setPaintMode((prev) => !prev);
      },
      "[": () => {
        if (!paintMode) return;

        setSelectedTileId((prev) =>
          Math.max(0, prev - 1)
        );
      },
      "]": () => {
        if (!paintMode) return;

        setSelectedTileId((prev) =>
          Math.min(TILESET_MAX_ID, prev + 1)
        );
      },
    };

    const action = keyActions[e.key.toLowerCase()];
    if (action) {
      e.preventDefault();
      action();
      return;
    }

    if (
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === "s"
    ) {
      e.preventDefault();

      handleSave();

      return;
    }

    if (MOVEMENT_KEYS.has(e.key)) {
      e.preventDefault();

      setPressedKey(e.key);

      handleMove(e.key);
    }
  };

  const onKeyUp = () => {
    setPressedKey(null);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
}