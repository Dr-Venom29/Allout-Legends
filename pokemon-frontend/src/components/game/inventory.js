export const ITEMS = {
  pokeball: {
    name: "Poké Ball",
    category: "ball",
    usableInBattle: true,
  },
  potion: {
    name: "Potion",
    category: "healing",
    healAmount: 20,
    usableInBattle: true,
  },
  superPotion: {
    name: "Super Potion",
    category: "healing",
    healAmount: 50,
    usableInBattle: true,
  },
  revive: {
    name: "Revive",
    category: "revive",
    usableInBattle: true,
  },
};

export function hasItem(
  inventory,
  itemId,
  amount = 1
) {
  return (inventory?.[itemId] ?? 0) >= amount;
}

export function consumeItem(
  inventory,
  itemId,
  amount = 1
) {
  const current = inventory?.[itemId] ?? 0;

  if (current < amount) {
    return inventory;
  }

  return {
    ...inventory,
    [itemId]: current - amount,
  };
}

export function addItem(
  inventory,
  itemId,
  amount = 1
) {
  return {
    ...inventory,
    [itemId]: (inventory?.[itemId] ?? 0) + amount,
  };
}

export function getItemCount(
  inventory,
  itemId
) {
  return inventory?.[itemId] ?? 0;
}
