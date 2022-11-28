#!/usr/bin/env node
const { program } = require('commander');

const { description, version } = require('../package.json');

const {
  displayUnusedTranslations,
  displayMissedTranslations,
  removeUnusedTranslations,
  markUnusedTranslations,
  syncTranslations,
  parseRegex
} = require('../dist/i18n-unused.cjs');



program.description(description);

program.version(version, '-v --version', 'output version');

program
  .option('-sExt, --src-extensions [srcExtensions...]', 'files extensions, which includes for searching (ext ext ext; by default: js, ts, jsx, tsx, vue)')
  .option('-lExt, --locales-extensions [localesExtensions...]', 'locales files extensions (ext,ext,ext; by default: json)')
  .option('-lExt, --translation-key-matcher <translationKeyMatcher>', '{string} locales matcher to search for translation keys in files by default: \'/(?:[$ .](_|t|tc|i18nKey))\\(.*?\\)/gi\'', parseRegex)
  .option('-sPath, --src-path <srcPath>', 'path to source of code (path, ex. \'src\')')
  .option('-lPath, --locales-path <localesPath>', 'path to locales (path, ex. \'src/locales\')');

program
  .command('display-unused')
  .description('output table with unused translations')
  .action(() => displayUnusedTranslations(program.opts()));

program
  .command('display-missed')
  .description('output table with missed translations')
  .action(() => displayMissedTranslations(program.opts()));

program
  .command('mark-unused')
  .description('mark unused translations via [UNUSED] or your marker from config')
  .action(() => markUnusedTranslations(program.opts()));

program
  .command('remove-unused')
  .description('remove unused translations')
  .action(() => removeUnusedTranslations(program.opts()));

program
  .command('display-missed')
  .description('output table with missed translations')
  .action(displayUnusedTranslations);

program
  .command('sync source target')
  .description('sync translations')
  .action((s, t) => syncTranslations(s, t, program.opts()));

program.parse(process.argv);
