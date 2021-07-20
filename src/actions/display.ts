import { RunOptions, UnusedCollects } from '../types';

import { initialize } from '../helpers/initialize';
import { collectUnusedTranslations } from '../helpers/translations';
import { generateFilesPaths, getFileSizeKb } from '../helpers/files';

export const displayUnusedTranslations = async (options: RunOptions): Promise<UnusedCollects> => {
  const config = await initialize(options);

  const localesFilesPaths = await generateFilesPaths(
    config.localesPath,
    {
      extensions: config.localesExtensions,
      fileNameResolver: config.localeNameResolver,
    },
  );

  const unusedTranslationsCollects = await collectUnusedTranslations(
    localesFilesPaths,
    `${process.cwd()}/${config.srcPath}`,
    config.extensions,
    config.localeModuleResolver,
    config.excludeKey,
  );

  unusedTranslationsCollects.collects.forEach((collect) => {
    console.log('<<<==========================================================>>>');
    console.log(`Unused translations in: ${collect.path}`);
    console.log(`Unused translations count: ${collect.count}`);
    console.table(collect.keys.map((key: string) => ({ 'Translation': key })));
  });

  console.log(`Total unused translations count: ${unusedTranslationsCollects.totalCount}`);

  console.log(`Can free up memory: ~${getFileSizeKb(
    unusedTranslationsCollects.collects.reduce((acc, { keys }) => `${acc}, ${keys.join(', ')}`, '')
  )}kb`);

  return unusedTranslationsCollects;
};
