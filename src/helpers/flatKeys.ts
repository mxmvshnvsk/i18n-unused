import { RecursiveStruct } from "../types";

interface Options {
  parent?: string;
  keys?: string[];
  context: boolean;
  contextSeparator: string;
  contextMatcher: RegExp;
  excludeKey?: string | string[];
}

export const generateTranslationsFlatKeys = (
  source: RecursiveStruct,
  {
    parent,
    keys = [],
    excludeKey,
    context,
    contextSeparator,
    contextMatcher,
  }: Options,
): string[] => {
  Object.keys(source).forEach((key) => {
    const flatKey = parent ? `${parent}.${key}` : key;

    if (!Array.isArray(source[key]) && typeof source[key] === "object") {
      generateTranslationsFlatKeys(source[key] as RecursiveStruct, {
        contextSeparator,
        parent: flatKey,
        excludeKey,
        context,
        contextMatcher,
        keys,
      });
    } else {
      keys.push(
        context
          ? getKeyWithoutContext(flatKey, contextSeparator, contextMatcher)
          : flatKey,
      );
    }
  });

  const resultKeys = excludeKey
    ? keys.filter((k: string) =>
        typeof excludeKey === "string"
          ? !k.includes(excludeKey)
          : excludeKey.every((ek) => !k.includes(ek)),
      )
    : keys;

  // The context removal can cause duplicates, so we need to remove them
  return [...new Set(resultKeys)];
};

/**
 * Removes context from key.
 *
 * Makes sure translation keys like `some_key_i_have` is not treated as context.
 */
const getKeyWithoutContext = (
  flatKey: string,
  contextSeparator: string,
  contextMatcher: RegExp,
) => {
  const splitted = flatKey.split(contextSeparator);
  if (splitted.length === 1) return flatKey;

  const lastPart = splitted[splitted.length - 1];

  // If the last part is a context, remove it
  if (lastPart.match(contextMatcher)) {
    return splitted.slice(0, splitted.length - 2).join(contextSeparator);
  }
  // Otherwise, join all parts
  return splitted.join(contextSeparator);
};
