import { RunOptions } from '../types';

export const initialize = (inlineOptions: RunOptions): RunOptions => {
  let config: RunOptions = { ...inlineOptions };

  try {
    const configFile: RunOptions = require(`${process.cwd()}/i18n-unused.config.js`);

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
