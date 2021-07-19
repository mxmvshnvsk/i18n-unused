export type ApplyFlat = (source: any, key: string) => void;

export type UnusedCollect = { path: string, keys: string[], count: number }[];

export type ModuleResolver = (m: any) => any;

export type RunOptions = {
  extensions?: string[],
  localesExtensions?: string[],
  localesPath?: string,
  srcPath?: string,
  excludeKey?: string[],
  marker?: string,
  gitCheck?: boolean,
  localeModuleResolver?: ModuleResolver,
};

export type LocalesPathAndCodes = {
  localesPath: string,
  localesCodes: string[],
  localesFilePaths: string[],
};
