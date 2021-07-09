import { execSync } from 'child_process';

import { GREEN, MAGENTA } from './consoleColor';

export const checkUncommittedChanges = () => {
  const result = execSync('git status --porcelain').toString();

  if (result) {
    console.log(MAGENTA, 'Working tree is dirty: you might want to commit your changes before running the script');
  } else {
    console.log(GREEN, 'Working tree is clean');
  }
};
