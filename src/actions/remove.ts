import { writeFileSync } from 'fs';

import { RunOptions, UnusedCollect } from '../types';

import { initialize } from '../helpers/initialize';
import { collectUnusedTranslations } from '../helpers/translations';
import { generateLocalesPathAndCodes } from '../helpers/findLocales';
import { applyToFlatKey } from '../helpers/action';

import { GREEN } from '../helpers/consoleColor';

export const removeUnusedTranslations = async (options: RunOptions): Promise<UnusedCollect> => {
  const config = initialize(options);

  const { localesFilePaths } = await generateLocalesPathAndCodes(
    config.localesPath,
    config.localesExtensions,
  );

  const unusedTranslationsCollect = await collectUnusedTranslations(
    localesFilePaths,
    `${process.cwd()}/${config.srcPath}`,
    config.extensions,
  );

  unusedTranslationsCollect.forEach((collect) => {
    const locale = require(collect.path);

    collect.keys.forEach((key) => applyToFlatKey(locale, key, (source, lastKey) => {
      delete source[lastKey];
    }));

    writeFileSync(collect.path, JSON.stringify(locale, null, 2));

    console.log(GREEN, `Successfully removed: ${collect.path}`);
  });

  return unusedTranslationsCollect;
};
