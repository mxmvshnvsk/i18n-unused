import { readFileSync } from 'fs';

import { UnusedCollect } from '../types';

import { generateFilesPaths } from './files';
import { generateTranslationsFlatKeys } from './flatKeys';

export const isTranslationStructure = (v: any): boolean => (!Array.isArray(v) && typeof v === 'object');

export const collectUnusedTranslations = async (paths: string[], srcPath: string, extensions: string[]): Promise<UnusedCollect> => {
  const collect: UnusedCollect = [];

  for (const localePath of paths) {
    const locale = require(localePath);
    const translationsKeys = generateTranslationsFlatKeys(locale);
    const filesPaths = await generateFilesPaths(srcPath, extensions);

    [...filesPaths].forEach((filePath: string) => {
      const file = readFileSync(filePath).toString();

      [...translationsKeys].forEach((key: string) => {
        if (file.includes(key)) {
          translationsKeys.splice(translationsKeys.indexOf(key), 1);
        }
      });
    });

    collect.push({ path: localePath, keys: translationsKeys });
  }

  return collect;
};
