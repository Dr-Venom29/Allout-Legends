export const ITEMS = {
  pokeball: {
    name: "Poké Ball",
    category: "ball",
    usableInBattle: true,
    ballMultiplier: 1.0,
    icon: "/assets/items/pokeball.png",
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
  greatBall: {
    name: "Great Ball",
    category: "ball",
    usableInBattle: true,
    ballMultiplier: 1.5,
    icon: "/assets/items/greatball.png",
  },
  ultraBall: {
    name: "Ultra Ball",
    category: "ball",
    usableInBattle: true,
    ballMultiplier: 2.0,
    icon: "/assets/items/ultraball.png",
  },
  masterBall: {
    name: "Master Ball",
    category: "ball",
    usableInBattle: true,
    guaranteedCatch: true,
    icon: "/assets/items/masterball.png",
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
