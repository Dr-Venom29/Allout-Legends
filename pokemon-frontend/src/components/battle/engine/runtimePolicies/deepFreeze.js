export function deepFreeze(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (seen.has(obj)) return obj;
  seen.add(obj);
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    const val = obj[key];
    if (typeof val === 'object' && val !== null) deepFreeze(val, seen);
  }
  return obj;
}
