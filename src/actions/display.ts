import { RunOptions, UnusedTranslations, MissedTranslations } from "../types";

import { initialize } from "../core/initialize";
import {
  collectUnusedTranslations,
  collectMissedTranslations,
} from "../core/translations";
import { generateFilesPaths, getFileSizeKb } from "../helpers/files";

export const displayUnusedTranslations = async (
  options: RunOptions,
): Promise<UnusedTranslations> => {
  const config = await initialize(options);

  const localesFilesPaths = await generateFilesPaths(config.localesPath, {
    srcExtensions: config.localesExtensions,
    fileNameResolver: config.localeNameResolver,
  });

  const srcFilesPaths = await generateFilesPaths(
    `${process.cwd()}/${config.srcPath}`,
    {
      srcExtensions: config.srcExtensions,
      ignorePaths: config.ignorePaths,
      basePath: config.srcPath,
    },
  );

  const unusedTranslations = await collectUnusedTranslations(
    localesFilesPaths,
    srcFilesPaths,
    {
      context: config.context,
      contextSeparator: config.translationContextSeparator,
      contextMatcher: config.translationContextMatcher,
      ignoreComments: config.ignoreComments,
      localeFileParser: config.localeFileParser,
      localeFileLoader: config.localeFileLoader,
      customChecker: config.customChecker,
      excludeTranslationKey: config.excludeKey,
      translationKeyMatcher: config.translationKeyMatcher,
    },
  );

  unusedTranslations.translations.forEach((translation) => {
    console.log(
      "<<<==========================================================>>>",
    );
    console.log(`Unused translations in: ${translation.localePath}`);
    console.log(`Unused translations count: ${translation.count}`);
    console.table(
      translation.keys.map((key: string) => ({ Translation: key })),
    );
  });

  console.log(
    `Total unused translations count: ${unusedTranslations.totalCount}`,
  );

  console.log(
    `Can free up memory: ~${getFileSizeKb(
      unusedTranslations.translations.reduce(
        (acc, { keys }) => `${acc}, ${keys.join(", ")}`,
        "",
      ),
    )}kb`,
  );

  return unusedTranslations;
};

export const displayMissedTranslations = async (
  options: RunOptions,
): Promise<MissedTranslations> => {
  const config = await initialize(options);

  const localesFilesPaths = await generateFilesPaths(config.localesPath, {
    srcExtensions: config.localesExtensions,
    fileNameResolver: config.localeNameResolver,
  });

  const srcFilesPaths = await generateFilesPaths(
    `${process.cwd()}/${config.srcPath}`,
    {
      srcExtensions: config.srcExtensions,
      ignorePaths: config.ignorePaths,
      basePath: config.srcPath,
    },
  );

  const missedTranslations = await collectMissedTranslations(
    localesFilesPaths,
    srcFilesPaths,
    {
      context: config.context,
      contextSeparator: config.translationContextSeparator,
      contextMatcher: config.translationContextMatcher,
      ignoreComments: config.ignoreComments,
      localeFileParser: config.localeFileParser,
      localeFileLoader: config.localeFileLoader,
      excludeTranslationKey: config.excludeKey,
      translationKeyMatcher: config.translationKeyMatcher,
      missedTranslationParser: config.missedTranslationParser,
    },
  );

  missedTranslations.translations.forEach((translation) => {
    console.log(
      "<<<==========================================================>>>",
    );

    console.log(`Missed translations in: ${translation.filePath}`);
    console.log(`Missed static translations count: ${translation.staticCount}`);
    console.log(
      `Missed dynamic translations count: ${translation.dynamicCount}`,
    );

    if (translation.staticKeys.length) {
      console.log("--------------------------------------------");
      console.log("Static keys:");
      console.table(
        translation.staticKeys.map((key: string) => ({ Key: key })),
      );
    }
    if (translation.dynamicKeys.length) {
      console.log("--------------------------------------------");
      console.log("Dynamic keys:");
      console.table(
        translation.dynamicKeys.map((key: string) => ({ Key: key })),
      );
    }
  });

  console.log(
    `Total missed static translations count: ${missedTranslations.totalStaticCount}`,
  );
  console.log(
    `Total missed dynamic translations count: ${missedTranslations.totalDynamicCount}`,
  );

  return missedTranslations;
};
