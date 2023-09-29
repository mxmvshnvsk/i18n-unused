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
          ? getKeyWithoutContext(key, contextSeparator, contextMatcher)
          : flatKey,
      );
    }
  });

  return excludeKey
    ? keys.filter((k: string) =>
        typeof excludeKey === "string"
          ? !k.includes(excludeKey)
          : excludeKey.every((ek) => !k.includes(ek)),
      )
    : keys;
};

/**
 * Removes context from key.
 *
 * Makes sure translation keys like `some_key_i_have` is not treated as context.
 */
const getKeyWithoutContext = (
  key: string,
  contextSeparator: string,
  contextMatcher: RegExp,
) => {
  const splitted = key.split(contextSeparator);
  if (splitted.length === 1) return key;
  const lastPart = splitted[splitted.length - 1];
  if (lastPart.match(contextMatcher)) {
    return splitted.slice(0, splitted.length - 1).join(contextSeparator);
  }
  return splitted.join(contextSeparator);
};
