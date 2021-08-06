import fs from 'fs';

import { createRequire } from 'module';

import { RunOptions, RecursiveStruct } from '../types';

import { initialize } from '../core/initialize';
import { generateFilesPaths } from '../helpers/files';
import { checkUncommittedChanges } from '../helpers/git';

import { GREEN } from '../helpers/consoleColor';

export const mergeLocaleData = (source: RecursiveStruct, target: RecursiveStruct) => {
  const keys = Object.keys(source);

  keys.forEach((key) => {
    if (typeof source[key] === 'object') {
      target[key] = target[key] || {};
      mergeLocaleData(
        source[key] as RecursiveStruct,
        target[key] as RecursiveStruct,
      );
    } else {
      target[key] = target[key] || source[key];
    }
  });

  return target;
};

export const syncTranslations = async (
  source: string,
  target: string,
  options: RunOptions,
): Promise<boolean> => {
  const config: RunOptions = await initialize(options);

  const [sourcePath] = await generateFilesPaths(config.localesPath, {
    fileNameResolver: (n) => n === source,
  });
  const [targetPath] = await generateFilesPaths(config.localesPath, {
    fileNameResolver: (n) => n === target,
  });

  const r = createRequire(import.meta.url);
  const sourceLocale = r(sourcePath);
  const targetLocale = r(targetPath);

  const mergedLocale = mergeLocaleData(sourceLocale, targetLocale);

  if (config.gitCheck) {
    checkUncommittedChanges();
  }

  fs.writeFileSync(targetPath, JSON.stringify(mergedLocale, null, 2));

  console.log(GREEN, 'Translations are synchronized');

  return true;
};
