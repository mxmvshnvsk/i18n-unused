export type RunOptions = {
  extensions: string[],
  localesPath: string,
  srcPath: string,
  localesExtensions: string[],
  excludeKey?: string[],
  marker?: string,
  gitCheck?: boolean,
};

export type LocalesPathAndCodes = {
  localesPath: string,
  localesCodes: string[],
  localesFilePaths: string[],
};

export type ApplyFlat = (source: any, key: string) => void;

export type UnusedCollect = { path: string, keys: string[], count: number }[];
