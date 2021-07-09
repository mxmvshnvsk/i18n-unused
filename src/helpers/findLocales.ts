import { readdirSync } from 'fs';

import { LocalesPathAndCodes } from '../types';

import { generateFilesPaths } from './files';

export const generateLocalesPathAndCodes = async (
  path: string,
  allowedLocaleTypes: string[],
  exclude?: string | string[],
): Promise<LocalesPathAndCodes> => {
  const localesPath = `${process.cwd()}/${path}`;
  const localesFiles = await generateFilesPaths(localesPath, allowedLocaleTypes);
  const localesFilePaths: string[] = [...localesFiles].filter((v) => !v.includes('/index.js'));

  const localesCodes = readdirSync(localesPath, { withFileTypes: true })
    .filter((file: any) => {
      if (!file.isDirectory()) {
        return false;
      }
      if (!exclude) {
        return true
      }

      const excludedCodes: string[] = Array.isArray(exclude) ? exclude : [exclude];

      return !excludedCodes.includes(file.name);
    })
    .map((dir: any) => dir.name);

  return { localesPath, localesCodes, localesFilePaths };
};
