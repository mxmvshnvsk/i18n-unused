import { RunOptions, UnusedCollect } from '../types';

import { initialize } from '../helpers/initialize';
import { collectUnusedTranslations } from '../helpers/translations';
import { generateFilesPaths, getFileSizeKb } from '../helpers/files';

export const displayUnusedTranslations = async (options: RunOptions): Promise<UnusedCollect> => {
  const config = await initialize(options);

  const localesFilesPaths = await generateFilesPaths(
    config.localesPath,
    config.localesExtensions || config.localeNameResolver,
  );

  const unusedTranslationsCollect = await collectUnusedTranslations(
    localesFilesPaths,
    `${process.cwd()}/${config.srcPath}`,
    config.extensions,
    config.localeModuleResolver,
    config.excludeKey,
  );

  unusedTranslationsCollect.forEach((collect) => {
    console.log('<<<==========================================================>>>');
    console.log(`Unused translations in: ${collect.path}`);
    console.log(`Unused translations count: ${collect.count}`);
    console.table(collect.keys.map((key: string) => ({ 'Translation': key })));
  });

  console.log(`Total unused translations count: ${
    unusedTranslationsCollect.reduce((acc, { count }) => acc + count, 0)
  }`);
  console.log(`Can free up memory: ~${getFileSizeKb(
    unusedTranslationsCollect.reduce((acc, { keys }) => `${acc}, ${keys.join(', ')}`, '')
  )}kb`);

  return unusedTranslationsCollect;
};
