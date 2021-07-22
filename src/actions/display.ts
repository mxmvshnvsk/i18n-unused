import { RunOptions, UnusedCollects, MissedCollects } from '../types';

import { initialize } from '../helpers/initialize';
import {
  collectUnusedTranslations,
  collectMissedTranslations,
} from '../helpers/translations';
import { generateFilesPaths, getFileSizeKb } from '../helpers/files';

export const displayUnusedTranslations = async (
  options: RunOptions,
): Promise<UnusedCollects> => {
  const config = await initialize(options);

  const localesFilesPaths = await generateFilesPaths(config.localesPath, {
    extensions: config.localesExtensions,
    fileNameResolver: config.localeNameResolver,
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

  unusedTranslationsCollects.collects.forEach((collect) => {
    console.log(
      '<<<==========================================================>>>',
    );
    console.log(`Unused translations in: ${collect.localePath}`);
    console.log(`Unused translations count: ${collect.count}`);
    console.table(collect.keys.map((key: string) => ({ Translation: key })));
  });

  console.log(
    `Total unused translations count: ${unusedTranslationsCollects.totalCount}`,
  );

  console.log(
    `Can free up memory: ~${getFileSizeKb(
      unusedTranslationsCollects.collects.reduce(
        (acc, { keys }) => `${acc}, ${keys.join(', ')}`,
        '',
      ),
    )}kb`,
  );

  return unusedTranslationsCollects;
};

export const displayMissedTranslations = async (
  options: RunOptions,
): Promise<MissedCollects> => {
  const config = await initialize(options);

  const localesFilesPaths = await generateFilesPaths(config.localesPath, {
    extensions: config.localesExtensions,
    fileNameResolver: config.localeNameResolver,
  });

  const srcFilesPaths = await generateFilesPaths(
    `${process.cwd()}/${config.srcPath}`,
    {
      extensions: config.extensions,
    },
  );

  const missedTranslationsCollects = await collectMissedTranslations(
    localesFilesPaths,
    srcFilesPaths,
    {
      localeModuleResolver: config.localeModuleResolver,
      excludeTranslationKey: config.excludeKey,
      translationKeyMatcher: config.translationKeyMatcher,
    },
  );

  missedTranslationsCollects.collects.forEach((collect) => {
    console.log(
      '<<<==========================================================>>>',
    );

    console.log(`Missed translations in: ${collect.filePath}`);
    console.log(`Missed static translations count: ${collect.staticCount}`);
    console.log(`Missed dynamic translations count: ${collect.dynamicCount}`);

    if (collect.staticKeys.length) {
      console.log('--------------------------------------------');
      console.log('Static keys:');
      console.table(collect.staticKeys.map((key: string) => ({ Key: key })));
    }
    if (collect.dynamicKeys.length) {
      console.log('--------------------------------------------');
      console.log('Dynamic keys:');
      console.table(collect.dynamicKeys.map((key: string) => ({ Key: key })));
    }
  });

  console.log(
    `Total missed static translations count: ${missedTranslationsCollects.totalStaticCount}`,
  );
  console.log(
    `Total missed dynamic translations count: ${missedTranslationsCollects.totalDynamicCount}`,
  );

  return missedTranslationsCollects;
};
