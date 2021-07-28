import { readFileSync } from 'fs';

import {
  UnusedCollect,
  UnusedCollects,
  MissedCollect,
  MissedCollects,
  ModuleResolver,
  TranslationKeyMatcher,
} from '../types';

import { resolveFile } from '../helpers/files';
import { generateTranslationsFlatKeys } from '../helpers/flatKeys';

interface unusedOptions {
  localeModuleResolver?: ModuleResolver;
  excludeTranslationKey?: string | string[];
}

const replaceQuotes = (v: string): string => v.replace(/(`|'|")/gi, '');
const isStaticKey = (v: string): boolean => !v.includes('${') && /'|"/.test(v);
const isDynamicKey = (v: string): boolean => v.includes('${') || !/'|"/.test(v);

export const collectUnusedTranslations = async (
  localesPaths: string[],
  srcFilesPaths: string[],
  { localeModuleResolver, excludeTranslationKey }: unusedOptions,
): Promise<UnusedCollects> => {
  const collect: UnusedCollect = [];

  for (const localePath of localesPaths) {
    const locale = await resolveFile(localePath, localeModuleResolver);
    const translationsKeys = generateTranslationsFlatKeys(locale, {
      excludeKey: excludeTranslationKey,
    });

    srcFilesPaths.forEach((filePath: string) => {
      const file = readFileSync(filePath).toString();

      [...translationsKeys].forEach((key: string) => {
        if (file.includes(key)) {
          translationsKeys.splice(translationsKeys.indexOf(key), 1);
        }
      });
    });

    collect.push({
      localePath: localePath,
      keys: translationsKeys,
      count: translationsKeys.length,
    });
  }

  return {
    collects: collect,
    totalCount: collect.reduce((acc, { count }) => acc + count, 0),
  };
};

interface missedOptions {
  localeModuleResolver?: ModuleResolver;
  excludeTranslationKey?: string | string[];
  translationKeyMatcher?: TranslationKeyMatcher;
}

export const collectMissedTranslations = async (
  localesPaths: string[],
  srcFilesPaths: string[],
  {
    localeModuleResolver,
    excludeTranslationKey,
    translationKeyMatcher,
  }: missedOptions,
): Promise<MissedCollects> => {
  const collects: MissedCollect = [];

  const flatKeys = [
    ...new Set(
      await localesPaths.reduce(async (asyncAcc, localePath) => {
        const acc = await asyncAcc;
        const locale = await resolveFile(localePath, localeModuleResolver);
        const translationsKeys = generateTranslationsFlatKeys(locale, {
          excludeKey: excludeTranslationKey,
        });

        return [...acc, ...translationsKeys];
      }, Promise.resolve([])),
    ),
  ];

  const filesMissedTranslationsKeys: { [key: string]: string[] } =
    await srcFilesPaths.reduce(async (asyncAcc, filePath) => {
      const acc: { [key: string]: string[] } = await asyncAcc;
      acc[filePath] = acc[filePath] || [];

      const file = readFileSync(filePath).toString();
      const matchKeys = (file.match(translationKeyMatcher) || [])
        .map((v) => {
          const [match] = v.match(/\((.*?)\)/gi);
          const [translation] = match.split(',');

          return translation.replace(/(\(|\)|\[\d\])/gi, '');
        })
        .filter((v) => !flatKeys.includes(v));

      if (matchKeys.length) {
        acc[filePath].push(...matchKeys);
      }

      return acc;
    }, Promise.resolve({}));

  Object.keys(filesMissedTranslationsKeys).forEach((filePath: string) => {
    if (!filesMissedTranslationsKeys[filePath].length) {
      return;
    }

    const staticKeys = filesMissedTranslationsKeys[filePath]
      .filter(isStaticKey)
      .map(replaceQuotes);
    const dynamicKeys = filesMissedTranslationsKeys[filePath]
      .filter(isDynamicKey)
      .map(replaceQuotes);

    collects.push({
      filePath,
      staticKeys,
      dynamicKeys,
      staticCount: staticKeys.length,
      dynamicCount: dynamicKeys.length,
    });
  });

  return {
    collects,
    totalStaticCount: collects.reduce((acc, { staticCount: c }) => acc + c, 0),
    totalDynamicCount: collects.reduce(
      (acc, { dynamicCount: c }) => acc + c,
      0,
    ),
  };
};
