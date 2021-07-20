export type ApplyFlat = (source: any, key: string) => void;

export type UnusedCollect = {
  localePath: string,
  srcPath: string,
  keys: string[],
  count: number
}[];

export type UnusedCollects = { collects: UnusedCollect, totalCount: number };

export type ModuleNameResolver = RegExp | ((n: string) => boolean)

export type ModuleResolver = (m: any) => any;

export type RunOptions = {
  extensions?: string[],
  localesExtensions?: string[],
  localesPath?: string,
  srcPath?: string,
  excludeKey?: string | string[],
  marker?: string,
  gitCheck?: boolean,
  localeNameResolver?: ModuleNameResolver,
  localeModuleResolver?: ModuleResolver,
};
