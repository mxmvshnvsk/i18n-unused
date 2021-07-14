# i18n-unused
Tool to find, analyze, sync, update and remove unused and missed i18n translations in your JavaScript project.

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
  // array of files extensions, like ['js', 'vue'],
  // by default ['js', 'ts', 'jsx', 'tsx', 'vue']
  extensions: [],
  // array of extensions of locales files, like ['js', 'json'],
  // by default ['json']
  localesExtensions: [],
  // path where analyze files
  srcPath: 'src',
  // path, where plased locales files
  localesPath: 'src/locales',
  // if substring contain key, it'll ignore
  excludeKey: '.props.',
  // custom marker for unused translations,
  // by defaul [UNUSED],
  marker: 'UNUSED_MARKER',
  // check git log status, false by default
  gitCheck: true
};
```

## Usage

Get help
```bash
i18n-unused -h
```

Display unused translations:
```bash
i18n-unused display-unused
```

Mark unused translations via `[UNUSED]` or your marker from config:
```bash
i18n-unused mark-unused
```

Remove unused translations:
```bash
i18n-unused remove-unused
```

Sync translations:
```bash
i18n-unused sync <source> <target>
```

## Usage in code

If you use tool in code, you can run `collectUnusedTranslations`, return `Promise`:

```javascript
import { collectUnusedTranslations } from 'i18n-unused';

const handleTransltions = async () => {
  // return: [{ path: 'locale_file_path', keys: ['unused_keys'] }]
  const unusedCollect = await collectUnusedTranslations(
    paths, // paths to locale files
    srcPath, // where to search using
    extensions, // serch file extensions, eg. ['ts', 'vue']
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
