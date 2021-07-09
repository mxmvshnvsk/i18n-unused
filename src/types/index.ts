export type RunOptions = {
  extensions: string[],
  localesPath: string,
  srcPath: string,
  localesExtensions: string[],
  excludeKey?: string[],
};

export type LocalesPathAndCodes = {
  localesPath: string,
  localesCodes: string[],
  localesFilePaths: string[],
};
