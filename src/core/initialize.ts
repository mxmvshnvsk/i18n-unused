/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

import { resolveFile } from '../helpers/files';

import { RunOptions, RecursiveStruct } from '../types';
import fs from 'fs';
import { parseRegex } from '../helpers/parseRegex';

const defaultValues: RunOptions = {
  srcPath: '',
  context: true,
  excludeKey: '',
  marker: '[UNUSED]',
  ignoreComments: false,
  flatTranslations: false,
  translationSeparator: '.',
  translationContextSeparator: '_',
  srcExtensions: ['js', 'ts', 'jsx', 'tsx', 'vue'],
  translationKeyMatcher: /(?:[$ .](_|t|tc|i18nKey))\(.*?\)/gi,
  localeFileParser: (m: RecursiveStruct): RecursiveStruct =>
    (m.default || m) as RecursiveStruct,
  missedTranslationParser: /\(([^)]+)\)/,
  localeJsonStringifyIndent: 2,
};

export const initialize = async (
  inlineOptions: RunOptions,
): Promise<RunOptions> => {
  let config: RunOptions = { ...inlineOptions };

  try {
    const base = process.cwd();

    let configFile: Partial<RunOptions> = {};

    for (const ext of ['js', 'cjs', 'json']) {
      const path = `${base}/i18n-unused.config.${ext}`;
      if (fs.existsSync(path)) {
        configFile = await resolveFile(path);
        // ⛔ There is no safe/reliable way to parse a function
        // ✔ When the file is a JSON need to parse the regex
        if (ext === 'json') {
          const potentialRegex = [
            'translationKeyMatcher',
            'missedTranslationParser',
            'localeNameResolver',
          ];
          potentialRegex.forEach((value) => {
            if (Object.prototype.hasOwnProperty.call(configFile, value)) {
              configFile[value] = parseRegex(configFile[value]);
            }
          });
        }
        break;
      }
    }

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
