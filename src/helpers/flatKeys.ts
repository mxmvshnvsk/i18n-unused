import { RecursiveStruct } from '../types';

interface Options {
  parent?: string;
  keys?: string[];
  context: boolean;
  contextSeparator: string,
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
  }: Options,
): string[] => {
  Object.keys(source).forEach((key) => {
    const flatKey = parent ? `${parent}.${key}` : key;

    if (!Array.isArray(source[key]) && typeof source[key] === 'object') {
      generateTranslationsFlatKeys(source[key] as RecursiveStruct, {
        contextSeparator,
        parent: flatKey,
        excludeKey,
        context,
        keys,
      });
    } else {
      keys.push(context ? flatKey.split(contextSeparator)[0] : flatKey);
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
