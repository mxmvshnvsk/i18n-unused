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
  extensions: [], // array of files extensions, like ['js', 'ts', 'vue']
  localesExtensions: [], // array of extensions of locales files, like ['js', 'json']
  srcPath: 'src', // path where analyze files
  localesPath: 'src/locales' // pat, where plased locales files
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

Sync translations:
```bash
i18n-unused sync en es
```

## License

MIT License. [Maxim Vishnevsky](https://github.com/mxmvshnvsk)
