import { readdirSync } from 'fs';

import { LocalesPathAndCodes, ModuleNameResolver } from '../types';

import { generateFilesPaths } from './files';

export const generateLocalesPathAndCodes = async (
  path: string,
  options: {
    allowedLocaleTypes?: string[],
    localeNameResolver?: ModuleNameResolver,
    exclude?: string | string[],
    include?: string | string[],
  } = {},
): Promise<LocalesPathAndCodes> => {
  const localesPath = `${process.cwd()}/${path}`;

  const excludedCodes: string[] = options.exclude ? (Array.isArray(options.exclude) ? options.exclude : [options.exclude]) : [];
  const includedCodes: string[] = options.include ? (Array.isArray(options.include) ? options.include : [options.include]) : [];

  const localesFiles = await generateFilesPaths(localesPath, options.localeNameResolver || options.allowedLocaleTypes);
  const localesFilePaths: string[] = [...localesFiles]
    .filter((v) => {
      if (v.includes('/index.')) {
        return false;
      }

      if (!excludedCodes.length && !includedCodes.length) {
        return true;
      }

      return excludedCodes.length
        ? !excludedCodes.some((code: string) => v.includes(`/${code}.`))
        : includedCodes.some((code: string) => v.includes(`/${code}.`));
    });

  const localesCodes = readdirSync(localesPath, { withFileTypes: true })
    .filter((file: any) => {
      if (!file.isDirectory()) {
        return false;
      }
      if (!excludedCodes.length && !includedCodes.length) {
        return true
      }

      return excludedCodes.length
        ? !excludedCodes.includes(file.name)
        : includedCodes.includes(file.name);
    })
    .map((dir: any) => dir.name);

  return { localesPath, localesCodes, localesFilePaths };
};
