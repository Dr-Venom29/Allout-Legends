export function getHpPercent(currentHp, maxHp) {
  return (currentHp / Math.max(maxHp, 1)) * 100;
}

export function getHpClass(percent) {
  if (percent > 50) return "";
  if (percent > 20) return "medium";
  return "low";
}