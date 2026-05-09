import { addItem } from "./inventory";

export function canAfford(money, price) {
  return Number.isFinite(money) && money >= price;
}

export function buyItem({ inventory, money, itemId, price }) {
  const currentMoney = Number.isFinite(money) ? money : 0;

  if (currentMoney < price) {
    return { success: false, inventory, money: currentMoney, message: "Not enough money" };
  }

  const nextInventory = addItem(inventory, itemId, 1);
  const nextMoney = currentMoney - price;

  return { success: true, inventory: nextInventory, money: nextMoney };
}
