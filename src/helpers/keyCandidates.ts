/**
 * Generate all possible candidate translation keys for a given key, prefix, and namespaces
 * (e.g. `auth.login.submit`, `login.submit`, `submit`).
 */
export const buildKeyCandidates = (
  rawKey: string,
  keyPrefix?: string,
  namespaces: string[] = [],
): string[] => {
  const candidates: string[] = [];

  const colonIndex = rawKey.indexOf(":");
  const hasInlineNs = colonIndex > 0;
  const inlineNs = hasInlineNs ? rawKey.substring(0, colonIndex) : undefined;
  const keyWithoutInlineNs = hasInlineNs
    ? rawKey.substring(colonIndex + 1)
    : rawKey;

  if (hasInlineNs && inlineNs && keyWithoutInlineNs) {
    if (keyPrefix) {
      candidates.push(`${inlineNs}.${keyPrefix}.${keyWithoutInlineNs}`);
      candidates.push(`${inlineNs}.${keyWithoutInlineNs}`);
      candidates.push(`${keyPrefix}.${keyWithoutInlineNs}`);
    } else {
      candidates.push(`${inlineNs}.${keyWithoutInlineNs}`);
    }
    candidates.push(keyWithoutInlineNs);
  }

  if (keyPrefix) {
    const prefixed = `${keyPrefix}.${rawKey}`;
    // Namespace + keyPrefix + key (e.g. auth.login.submit)
    for (const ns of namespaces) {
      if (ns) {
        candidates.push(`${ns}.${prefixed}`);
      }
    }
    // keyPrefix + key (e.g. login.submit)
    candidates.push(prefixed);
  } else if (namespaces.length > 0) {
    for (const ns of namespaces) {
      if (ns) {
        candidates.push(`${ns}.${rawKey}`);
      }
    }
  }

  // Always include the rawKey as a fallback candidate
  if (!candidates.includes(rawKey)) {
    candidates.push(rawKey);
  }

  return [...new Set(candidates)];
};

/**
 * Check if a key usage involves dynamic string interpolation
 */
export const isDynamicKeyUsage = (
  rawKey: string,
  keyPrefix?: string,
  namespaces: string[] = [],
): boolean =>
  rawKey.includes("${") ||
  Boolean(keyPrefix?.includes("${")) ||
  namespaces.some((ns) => ns.includes("${"));
