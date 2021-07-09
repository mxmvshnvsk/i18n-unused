const isTranslationStructure = (v: any): boolean => (!Array.isArray(v) && typeof v === 'object');

export const generateTranslationsFlatKeys = (source: any, parent: string = '', keys: string[] = []): string[] => {
  Object.keys(source).forEach((key) => {
    const flatKey = parent ? `${parent}.${key}` : key

    if (isTranslationStructure(source[key])) {
      generateTranslationsFlatKeys(source[key], flatKey, keys)
    } else {
      keys.push(flatKey)
    }
  })

  return keys
};
