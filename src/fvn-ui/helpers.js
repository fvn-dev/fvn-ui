export const merge = (target, ...sources) => {
  for (const source of sources) {
    for (const [key, val] of Object.entries(source)) {
      const existing = target[key];

      // Merge arrays
      if (Array.isArray(existing) && Array.isArray(val)) {
        existing.push(...val);
        continue;
      }

      // Deep merge objects
      if (existing && typeof existing === 'object' && !Array.isArray(existing)
          && val && typeof val === 'object' && !Array.isArray(val)) {
        merge(existing, val);
        continue;
      }

      target[key] = val;
    }
  }
  return target;
};