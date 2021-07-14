import { RunOptions, UnusedCollect } from '../types';

import { initialize } from '../helpers/initialize';
import { collectUnusedTranslations } from '../helpers/translations';
import { generateLocalesPathAndCodes } from '../helpers/findLocales';

export const displayUnusedTranslations = async (options: RunOptions): Promise<UnusedCollect> => {
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
    console.log('<<<==========================================================>>>');
    console.log(`Unused locales in: ${collect.path}`);
    console.table(collect.keys.map((key: string) => ({ 'Translation': key })));
  });

  return unusedTranslationsCollect;
};
