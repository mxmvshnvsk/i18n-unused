# i18n-unused

![npm](https://img.shields.io/npm/v/i18n-unused?color=red&label=version&link=https://www.npmjs.com/package/i18n-unused)
![npm](https://img.shields.io/npm/dt/i18n-unused?color=green&link=https://www.npmjs.com/package/i18n-unused)

The static analyze tool for finding, marking and removing unused and missing i18n translations in your JavaScript project.

## Installation

With npm:
```bash
npm install --save-dev i18n-unused
```

With yarn:
```bash
yarn add --dev i18n-unused
```

## Configuration

Add config `i18n-unused.config.js` to your root folder:

```javascript
module.exports = {
  localesPath: 'src/locales',
  srcPath: 'src',
};
```
### Configuration options

| Option name | <div style="width: 280px">Description</div> | Required | Type | <div style="min-width: 100px">Default value</div> |
| --- | --- | --- | --- | --- |
| localesPath           | path to search for locales | yes | string | -
| localesExtensions     | allowed file extensions for locales | no | string[] | if not set `localeNameResolver`: ['json']
| localeNameResolver    | file name resolver for locales | no | RegExp, (name: string) => boolean | -
| localeFileParser      | resolve locale imports, for example if you use named imports from locales files, just wrap it to your own resolver | no | (module) => module | fn, return `module.default` or `module`
| localeFileLoader      | load the locale file manually (e.g. for using your own parser) | no | (filePath) => object | -
| srcPath               | path to search for translations | no | string | `''` (same as run folder)
| srcExtensions         | allowed file extensions for translations | no | string[] | ['js', 'ts', 'jsx', 'tsx', 'vue']
| ignorePaths           | ignored paths, eg: `['src/ignored-folder']`, should start similarly `srcPath` | no | string[] | -
| translationKeyMatcher | matcher to searching for translation keys in files | no | RegExp | RegExp, match `$_`, `$t`, `t`, `$tc`, `tc` and `i18nKey`
| excludeKey            | doesn't process translations that include passed key(s), for example if you set `excludeKey: '.props.'`, script will ignore `Button.props.value`. | no | string, string[] | -
| ignoreComments        | Ignore code comments in src files. | no | boolean | false
| marker                | special string to mark unused translations, it'll added via `mark-unused` | no | string | '[UNUSED]'
| gitCheck              | show git state change tree | no | boolean | false
| context               | use i18n context, (eg: [plurals](https://www.i18next.com/translation-function/context)) | no | boolean | true
| flatTranslations      | use flat translations, (eg: [Flat JSON](https://www.codeandweb.com/babeledit/documentation/file-formats#flat-json)) | no | boolean | false
| translationSeparator         | separator for translations using in code | no | string | '.'
| translationContextSeparator  | separator for i18n context (see `context` option) | no | string | '_'
| missedTranslationParser  | parser for ejecting value from `translationKeyMatcher` matches | no | RegExp, (v: string) => string | RegExp, match value inside rounded brackets
| localeJsonStringifyIndent  | json indent value for writing json file, either a number of spaces, or a string to indent with. (i.e. `2`, `4`, `\t`) | no | string , number | `2`

## Usage

Get help:
```bash
i18n-unused -h
```

Display unused translations:
```bash
i18n-unused display-unused
```

Mark unused translations via `[UNUSED]` or marker from config (works only with `json` for now):
```bash
i18n-unused mark-unused
```

Remove unused translations (works only with `json` for now):
```bash
i18n-unused remove-unused
```

Sync translations (works only with `json` for now):
```bash
i18n-unused sync <source> <target>
```

Display missed translations:
```bash
i18n-unused display-missed
```

## Usage in code

### collectUnusedTranslations

If you use tool in code, you can run async function `collectUnusedTranslations`:

```javascript
import { collectUnusedTranslations } from 'i18n-unused';

const handleTranslations = async () => {
  const unusedTranslations = await collectUnusedTranslations(
    localesPaths, // paths to locale files
    srcFilesPaths, // paths to src files
    {
      localeFileParser: (module) => module, // optional, resolver for module
      excludeTranslationKey: ['.props.'], // optional, special string or sting[] to exclude flat translations
    },
  );
};
```

It'll return to you follow collect:

```javascript
{
  translations: [
    {
      localePath: 'locale_file_path',
      keys: ['unused_key'],
      count: 1,
    },
  ],
  totalCount: 1,
}
```

### collectMissedTranslations

If you use tool in code, you can run async function `collectMissedTranslations`:

```javascript
import { collectMissedTranslations } from 'i18n-unused';

const handleTranslations = async () => {
  const missedTranslations = await collectMissedTranslations(
    localesPaths, // paths to locale files
    srcFilesPaths, // paths to src files
    {
      localeFileParser: (module) => module, // optional, resolver for module
      excludeTranslationKey: ['.props.'], // optional, special string or sting[] to exclude flat translations
      translationKeyMatcher: /(?:[$ .](_|t|tc))\(.*?\)/ig, // optional, match translation keys in files
    },
  );
};
```

You'll get the following collection:

```javascript
{
  translations: [
    {
      filePath: 'src_file_path',
      staticKeys: ['missed_key'], // keys without ${} syntax
      dynamicKeys: ['missed_key'], // keys with ${} syntax
      staticCount: 1,
      dynamicCount: 1,
    },
  ],
  totalStaticCount: 1,
  totalDynamicCount: 1,
}
```

### generateFilesPaths

Available as async function `generateFilesPaths`:

```javascript
import { generateFilesPaths } from 'i18n-unused';

const handleFilesPaths = async () => {
  // return array of full paths to files
  const filesPaths = await generateFilesPaths(
    srcPath, // path where search files, example: 'src/locales'
    {
      srcExtensions, // allowed file extensions, example: ['js', 'ts']
      fileNameResolver, // resolver for file name, see more info about 'localeNameResolver' option
    },
  );
};
```

## Action results

Next actions return `unusedTranslations`:
  - `displayUnusedTranslations`
  - `removeUnusedTranslations`
  - `markUnusedTranslations`

Next actions return `missedTranslations`:
- `displayMissedTranslations`

## What else?

If the tool helped you, please rate it on [github](https://github.com/mxmvshnvsk/i18n-unused), thx. I'll be glad to your PRs =)

## License

MIT License. [Maxim Vishnevsky](https://github.com/mxmvshnvsk)
