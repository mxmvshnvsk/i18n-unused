import { resolveFile } from './files';

import { RunOptions } from '../types';

const defaultValues: RunOptions = {
  excludeKey: '',
  marker: '[UNUSED]',
  extensions: ['js', 'ts', 'jsx', 'tsx', 'vue'],
  localeModuleResolver: (m: any): any => m.default || m,
};

export const initialize = async (inlineOptions: RunOptions): Promise<RunOptions> => {
  let config: RunOptions = { ...inlineOptions };

  try {
    const configFile = await resolveFile(`${process.cwd()}/i18n-unused.config.js`);

    config = { ...configFile, ...inlineOptions };
  } catch (e) {}

  if (!config.localesPath) {
    throw new Error('Locales path is required');
  }

  if (!config.srcPath) {
    throw new Error('Src path is required');
  }

  if (!config.localesExtensions && !config.localeNameResolver) {
    config.localesExtensions = ['json'];
  }

  return { ...defaultValues, ...config };
}
