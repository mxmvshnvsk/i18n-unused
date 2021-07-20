import fs from 'fs';

import { RunOptions } from '../types';

import { initialize } from '../helpers/initialize';
import { generateFilesPaths } from '../helpers/files';
import { checkUncommittedChanges } from '../helpers/git';

import { GREEN } from '../helpers/consoleColor';

const mergeLocaleData = (source: any, target: any) => {
  const keys = Object.keys(source);

  keys.forEach((key) => {
    if (typeof source[key] === 'object') {
      target[key] = target[key] || {};
      mergeLocaleData(source[key], target[key]);
    } else {
      target[key] = target[key] || source[key];
    }
  })

  return target;
}

export const syncTranslations = async (source: string, target: string, options: RunOptions) => {
  const config: RunOptions = await initialize(options);

  const [sourcePath] = await generateFilesPaths(config.localesPath, { fileNameResolver: (n) => n === source });
  const [targetPath] = await generateFilesPaths(config.localesPath, { fileNameResolver: (n) => n === target });

  const sourceLocale = require(sourcePath);
  const targetLocale = require(targetPath);

  const mergedLocale = mergeLocaleData(sourceLocale, targetLocale);

  if (config.gitCheck) {
    checkUncommittedChanges();
  }

  fs.writeFileSync(targetPath, JSON.stringify(mergedLocale, null, 2));

  console.log(GREEN, 'Translations are synchronized');
};
