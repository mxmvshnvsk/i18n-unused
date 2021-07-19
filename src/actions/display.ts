import { RunOptions, UnusedCollect } from '../types';

import { initialize } from '../helpers/initialize';
import { collectUnusedTranslations } from '../helpers/translations';
import { generateLocalesPathAndCodes } from '../helpers/findLocales';
import { getFileSizeKb } from '../helpers/files';

export const displayUnusedTranslations = async (options: RunOptions): Promise<UnusedCollect> => {
  const config = await initialize(options);

  const { localesFilePaths } = await generateLocalesPathAndCodes(
    config.localesPath,
    config.localesExtensions
      ? { allowedLocaleTypes: config.localesExtensions }
      : { localeNameResolver: config.localeNameResolver },
  );

  const unusedTranslationsCollect = await collectUnusedTranslations(
    localesFilePaths,
    `${process.cwd()}/${config.srcPath}`,
    config.extensions,
    config.localeModuleResolver,
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
