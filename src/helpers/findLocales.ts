import { readdirSync } from 'fs';

import { LocalesPathAndCodes, ModuleNameResolver } from '../types';

import { generateFilesPaths } from './files';

interface options {
  allowedLocaleTypes?: string[],
  localeNameResolver?: ModuleNameResolver,
  exclude?: string | string[],
  include?: string | string[],
}

export const generateLocalesPathsAndCodes = async (
  path: string,
  {
    allowedLocaleTypes,
    localeNameResolver,
    exclude,
    include,
  }: options = {},
): Promise<LocalesPathAndCodes> => {
  const localesPath = `${process.cwd()}/${path}`;

  const excludedLocales: string[] = exclude ? (Array.isArray(exclude) ? exclude : [exclude]) : [];
  const includedLocales: string[] = include ? (Array.isArray(include) ? include : [include]) : [];

  const localesFiles = await generateFilesPaths(localesPath, localeNameResolver || allowedLocaleTypes);
  const localesFilePaths: string[] = [...localesFiles]
    .filter((v) => {
      if (!excludedLocales.length && !includedLocales.length) {
        return true;
      }

      return excludedLocales.length
        ? !excludedLocales.some((l: string) => v.includes(`/${l}`))
        : includedLocales.some((l: string) => v.includes(`/${l}`));
    });

  const localesCodes = readdirSync(localesPath, { withFileTypes: true })
    .filter((file: any) => {
      if (!file.isDirectory()) {
        return false;
      }
      if (!excludedLocales.length && !includedLocales.length) {
        return true
      }

      return excludedLocales.length
        ? !excludedLocales.includes(file.name)
        : includedLocales.includes(file.name);
    })
    .map((dir: any) => dir.name);

  return { localesPath, localesCodes, localesFilePaths };
};
