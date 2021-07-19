# i18n-unused

![npm](https://img.shields.io/npm/v/i18n-unused?color=red&label=version)
![npm](https://img.shields.io/npm/dt/i18n-unused?color=green)

The tool for finding, analyzing and removing unused i18n translations in your JavaScript project

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
| localesPath          | path for searching locales files | yes | string | -
| srcPath              | path for searching files with translations using | yes | string | -
| extensions           | allowed to read files extensions | no | string[] | ['js', 'ts', 'jsx', 'tsx', 'vue']
| localesExtensions    | allowed to read files extensions of locales | no, if set `localeNameResolver` | string[] | -
| localeNameResolver   | resolver for locale file name | no, if set `localesExtensions` | RegExp, (name: string) => boolean | -
| localeModuleResolver | resolve locale imports, for example if you use named imports from locales files, just wrap it to your own resolver | no | (module) => module | fn, return `module.default` or `module`
| excludeKey           | option to excluding some translations, for example if you set `excludeKey: '.props.'`, it'll ignore all flat keys with this value | no | string, string[] | -
| marker               | special string, it'll added via `mark-unused` | no | string | '[UNUSED]'
| gitCheck             | it'll show git change tree state | no | boolean | false

## Usage

Get help:
```bash
i18n-unused -h
```

Display unused translations:
```bash
i18n-unused display-unused
```

Mark unused translations via `[UNUSED]` or your marker from config (works only with `json` for now):
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

Display missed translations **(Work in progress)**:

## Usage in code

If you use tool in code, you can run `collectUnusedTranslations`, return `Promise`:

```javascript
import { collectUnusedTranslations } from 'i18n-unused';

const handleTranslations = async () => {
  // return: [{ path: 'locale_file_path', keys: ['unused_keys'], count: 0 }]
  const unusedCollect = await collectUnusedTranslations(
    paths, // paths to locale files
    srcPath, // where to search using
    extensions, // search file extensions, eg. ['ts', 'vue']
    localeModuleResolver, // resolver for module, (module) => module
    excludeTranslationKey, // special string or sting[] to exclude flat translations
  );
};
```

All other action return `UnusedCollect` too, list of actions:
  - `displayUnusedTranslations`
  - `removeUnusedTranslations`
  - `markUnusedTranslations`

## What else?

If the tool helped you, please rate it on [github](https://github.com/mxmvshnvsk/i18n-unused), thx. I'll be glad to your PRs =)

## License

MIT License. [Maxim Vishnevsky](https://github.com/mxmvshnvsk)
