import { RunOptions } from '../types';

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

  if (!config.extensions) {
    config.extensions = ['js', 'ts', 'jsx', 'tsx', 'vue'];
  }

  if (!config.localesExtensions) {
    config.localesExtensions = ['json'];
  }

  if (!config.marker) {
    config.marker = '[UNUSED]';
  }

  return config;
}
