#!/usr/bin/env node
const { program } = require('commander');

const { description, version } = require('../package.json');

program.description(description);

program.version(version, '-v --version', 'output version');

program
  .option('-du --display-unused', 'output table with unused translations')
  .option('-mu --mark-unused', 'mark unused translations via [UNUSED]')
  .option('-ru --remove-unused', 'remove unused translations')
  .option('-dm --display-missed', 'output table with missed translations')
  .option('-s --sync', 'sync translations');

program.parse(process.argv);
