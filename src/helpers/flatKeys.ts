import { isTranslationStructure } from './translations';

interface options {
  parent?: string,
  keys?: string[],
  excludeKey?: string | string[],
}

export const generateTranslationsFlatKeys = (
  source: any,
  {
    parent,
    keys = [],
    excludeKey,
  }: options,
): string[] => {
  Object.keys(source).forEach((key) => {
    const flatKey = parent ? `${parent}.${key}` : key

    if (isTranslationStructure(source[key])) {
      generateTranslationsFlatKeys(source[key], {
        parent: flatKey,
        keys: keys,
        excludeKey: excludeKey,
      })
    } else {
      keys.push(flatKey)
    }
  });

  return excludeKey
    ? keys.filter((k: string) => (
      typeof excludeKey === 'string'
        ? !k.includes(excludeKey)
        : excludeKey.every((ek) => !k.includes(ek))
    ))
    : keys;
};
