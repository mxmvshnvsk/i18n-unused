import { RecursiveStruct } from '../types';

interface options {
  parent?: string;
  keys?: string[];
  context?: boolean;
  excludeKey?: string | string[];
}

export const generateTranslationsFlatKeys = (
  source: RecursiveStruct,
  { parent, keys = [], excludeKey, context }: options,
): string[] => {
  Object.keys(source).forEach((key) => {
    const flatKey = parent ? `${parent}.${key}` : key;

    if (!Array.isArray(source[key]) && typeof source[key] === 'object') {
      generateTranslationsFlatKeys(source[key] as RecursiveStruct, {
        excludeKey: excludeKey,
        parent: flatKey,
        keys: keys,
        context,
      });
    } else {
      keys.push(context ? flatKey.split('_')[0] : flatKey);
    }
  });

  return excludeKey
    ? keys.filter((k: string) =>
        typeof excludeKey === 'string'
          ? !k.includes(excludeKey)
          : excludeKey.every((ek) => !k.includes(ek)),
      )
    : keys;
};
