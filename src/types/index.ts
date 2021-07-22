export type RecursiveStruct = {
  [key: string]: string | string[] | RecursiveStruct;
};

export type ApplyFlat = (source: RecursiveStruct, key: string) => void;

export type UnusedCollect = {
  localePath: string;
  keys: string[];
  count: number;
}[];

export type MissedCollect = {
  filePath: string;
  staticKeys: string[];
  dynamicKeys: string[];
  staticCount: number;
  dynamicCount: number;
}[];

export type UnusedCollects = {
  collects: UnusedCollect;
  totalCount: number;
};

export type MissedCollects = {
  collects: MissedCollect;
  totalStaticCount: number;
  totalDynamicCount: number;
};

export type ModuleNameResolver = RegExp | ((n: string) => boolean);

export type TranslationKeyMatcher = RegExp;

export type ModuleResolver = (m: RecursiveStruct) => RecursiveStruct;

export type RunOptions = {
  extensions?: string[];
  localesExtensions?: string[];
  localesPath?: string;
  srcPath?: string;
  excludeKey?: string | string[];
  marker?: string;
  gitCheck?: boolean;
  translationKeyMatcher?: TranslationKeyMatcher;
  localeNameResolver?: ModuleNameResolver;
  localeModuleResolver?: ModuleResolver;
};
