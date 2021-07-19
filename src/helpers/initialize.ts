import { RunOptions } from '../types';

const defaultValues: RunOptions = {
  extensions: ['js', 'ts', 'jsx', 'tsx', 'vue'],
  localesExtensions: ['json'],
  marker: '[UNUSED]',
  localeModuleResolver: (m: any): any => m.default,
};

export const initialize = async (inlineOptions: RunOptions): Promise<RunOptions> => {
  let config: RunOptions = { ...inlineOptions };

  try {
    const { default: configFile } = await import(`${process.cwd()}/i18n-unused.config.js`);

    config = { ...configFile, ...inlineOptions };
  } catch (e) {}

  if (!config.localesPath) {
    throw new Error('Locales path is required');
  }

  if (!config.srcPath) {
    throw new Error('Src path is required');
  }

  return { ...defaultValues, ...config };
}
