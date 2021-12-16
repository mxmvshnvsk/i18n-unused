/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

import { resolveFile } from '../helpers/files';

import { RunOptions, RecursiveStruct } from '../types';

const defaultValues: RunOptions = {
  srcPath: '',
  context: true,
  excludeKey: '',
  marker: '[UNUSED]',
  ignoreComments: false,
  srcExtensions: ['js', 'ts', 'jsx', 'tsx', 'vue'],
  translationKeyMatcher: /(?:[$ .](_|t|tc|i18nKey))\(.*?\)/gi,
  localeFileParser: (m: RecursiveStruct): RecursiveStruct =>
    (m.default || m) as RecursiveStruct,
};

export const initialize = async (
  inlineOptions: RunOptions,
): Promise<RunOptions> => {
  let config: RunOptions = { ...inlineOptions };

  try {
    const configFile = await resolveFile(
      `${process.cwd()}/i18n-unused.config.js`,
    );

    config = { ...configFile, ...inlineOptions };
  } catch (e) {}

  if (!config.localesPath) {
    throw new Error('Locales path is required');
  }

  if (!config.localesExtensions && !config.localeNameResolver) {
    config.localesExtensions = ['json'];
  }

  return { ...defaultValues, ...config };
};
