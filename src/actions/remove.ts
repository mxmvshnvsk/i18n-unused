import { writeFileSync } from 'fs';

import { createRequire } from 'module';

import { RunOptions, UnusedCollects } from '../types';

import { initialize } from '../core/initialize';
import { collectUnusedTranslations } from '../core/translations';
import { generateFilesPaths } from '../helpers/files';
import { applyToFlatKey } from '../core/action';
import { checkUncommittedChanges } from '../helpers/git';

import { GREEN } from '../helpers/consoleColor';

export const removeUnusedTranslations = async (
  options: RunOptions,
): Promise<UnusedCollects> => {
  const config = await initialize(options);

  const localesFilesPaths = await generateFilesPaths(config.localesPath, {
    extensions: ['json'], // @TODO implement other types when add other types writes
  });

  const srcFilesPaths = await generateFilesPaths(
    `${process.cwd()}/${config.srcPath}`,
    {
      extensions: config.extensions,
    },
  );

  const unusedTranslationsCollects = await collectUnusedTranslations(
    localesFilesPaths,
    srcFilesPaths,
    {
      localeModuleResolver: config.localeModuleResolver,
      excludeTranslationKey: config.excludeKey,
    },
  );

  if (config.gitCheck) {
    checkUncommittedChanges();
  }

  unusedTranslationsCollects.collects.forEach((collect) => {
    const r = createRequire(import.meta.url);
    const locale = r(collect.localePath);

    collect.keys.forEach((key) =>
      applyToFlatKey(locale, key, (source, lastKey) => {
        delete source[lastKey];
      }),
    );

    writeFileSync(collect.localePath, JSON.stringify(locale, null, 2));

    console.log(GREEN, `Successfully removed: ${collect.localePath}`);
  });

  return unusedTranslationsCollects;
};
