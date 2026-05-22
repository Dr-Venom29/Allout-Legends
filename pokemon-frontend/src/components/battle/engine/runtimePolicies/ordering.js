export function computeCombatantOrder(combatantEntries = [], phaseContext = {}) {
  if (!Array.isArray(combatantEntries) || combatantEntries.length === 0) return [];
  // If caller provided explicit order (array of tags), respect it
  if (phaseContext.ordering && Array.isArray(phaseContext.ordering)) {
    const map = new Map(combatantEntries.map(e => [e.tag, e]));
    const ordered = [];
    for (const tag of phaseContext.ordering) {
      if (map.has(tag)) ordered.push(map.get(tag));
    }
    // Append any remaining not listed
    for (const e of combatantEntries) if (!ordered.includes(e)) ordered.push(e);
    return ordered;
  }

  // Default: sort by effective speed desc, then deterministic uuid/name
  return [...combatantEntries].sort((a, b) => {
    const sa = a.effectiveSpeed ?? 0;
    const sb = b.effectiveSpeed ?? 0;
    if (sa !== sb) return sb - sa; // higher speed first
    const ua = a.c?.uuid || a.tag || a.c?.name || "";
    const ub = b.c?.uuid || b.tag || b.c?.name || "";
    return ua < ub ? -1 : ua > ub ? 1 : 0;
  });
}
