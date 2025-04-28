export type RecursiveStruct = {
  [key: string]: string | string[] | RecursiveStruct;
};

export type ApplyFlat = (source: RecursiveStruct, key: string) => void;

export type UnusedTranslation = {
  localePath: string;
  keys: string[];
  count: number;
}[];

export type MissedTranslation = {
  filePath: string;
  staticKeys: string[];
  dynamicKeys: string[];
  staticCount: number;
  dynamicCount: number;
}[];

export type UnusedTranslations = {
  translations: UnusedTranslation;
  totalCount: number;
};

export type MissedTranslations = {
  translations: MissedTranslation;
  totalStaticCount: number;
  totalDynamicCount: number;
};

export type ModuleNameResolver = RegExp | ((n: string) => boolean);

export type TranslationKeyMatcher = RegExp;

export type MissedTranslationParser = RegExp | ((v: string) => string);

export type ModuleResolver = (m: RecursiveStruct) => RecursiveStruct;

export type CustomFileLoader = (filePath: string) => RecursiveStruct;

export type CustomChecker = (
  matchKeys: Set<string>,
  translationsKeys: string[],
) => void;

export interface RunOptions {
  /**
   * Path to the locales folder
   */
  localesPath?: string;
  /**
   * Allowed file extensions for locales
   * @default ['json'] if `localeNameResolver` is not set
   */
  localesExtensions?: string[];
  /**
   * File name resolver for locales
   */
  localeNameResolver?: ModuleNameResolver;
  /**
   * Function to check if a key is used, if so the key should be removed from
   * translationsKeys
   */
  customChecker?: CustomChecker;
  /**
   * Resolve locale imports, for example if you use named imports from locales
   * files, just wrap it to your own resolver
   * @default (m) => m.default
   */
  localeFileParser?: ModuleResolver;
  /**
   * Load the locale file manually (e.g. for using your own parser)
   */
  localeFileLoader?: CustomFileLoader;
  /**
   * Path to search for translations
   * @default process.cwd()
   */
  srcPath?: string;
  /**
   * Allowed file extensions for translations
   * @default ['js', 'jsx', 'ts', 'tsx', 'vue']
   */
  srcExtensions?: string[];
  /**
   * Ignore paths, eg: `['src/ignored-folder']`, should start similarly srcPath
   */
  ignorePaths?: string[];
  /**
   * Matcher to search for translation keys in files
   * @default RegExp, match $_, $t, t, $tc, tc and i18nKey
   */
  translationKeyMatcher?: TranslationKeyMatcher;
  /**
   * Doesn't process translations that include passed key(s), for example if you
   * set `excludeKey: '.props.'`, script will ignore `Button.props.value`.
   */
  excludeKey?: string | string[];
  /**
   * Ignore code comments in src files.
   * @default false
   */
  ignoreComments?: boolean;
  /**
   * Special string to mark unused translations, it'll added via mark-unused
   * @default '[UNUSED]'
   */
  marker?: string;
  /**
   * Show git state change tree
   * @default false
   */
  gitCheck?: boolean;
  /**
   * Use i18n context, (eg: {@link https://www.i18next.com/translation-function/plurals Plurals})
   * @default true
   */
  context?: boolean;
  /**
   * Use flat translations, (eg: {@link https://www.codeandweb.com/babeledit/documentation/file-formats#flat-json Flat JSON})
   */
  flatTranslations?: boolean;
  /**
   * Separator for translations using in code
   * @default '.'
   */
  translationSeparator?: string;
  /**
   * Separator for i18n (see {@link context context option})
   * @default '_'
   */
  translationContextSeparator?: string;
  /**
   * Matcher to search for i18n context in translations
   * @default RegExp, match `zero`, `one`, `two`, `few`, `many`, `other`, `male`, `female`, `0`, `1`, `2`, `3`, `4`, `5`, `plural`, `11` and `100`
   */
  translationContextMatcher?: RegExp;
  /**
   * Parser for ejecting value from {@link translationKeyMatcher} matches
   * @default RegExp, match value inside rounded brackets
   */
  missedTranslationParser?: MissedTranslationParser;
  /**
   * Json indent value for writing json file, either a number of spaces, or a
   * string to indent with. (i.e. `2`, `4`, `\t`)
   * @default 2
   */
  localeJsonStringifyIndent: string | number;

  /**
   * Throw error when found unused translations
   * @default false
   */
  exitErrorOnUnused?: boolean;

  /**
   * Throw error when found missed translations
   * @default false
   */
  exitErrorOnMissed?: boolean;
}
